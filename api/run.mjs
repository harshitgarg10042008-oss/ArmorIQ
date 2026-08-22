import { randomUUID, timingSafeEqual } from "node:crypto";
import { createPactlineClient, captureInvoiceIntent, invokeAuthorized } from "../agent/armoriq-live-adapter.mjs";
import { readInvoice, extractFields, writeRecord, sendEmail, readRuntimeEvidence } from "./pactline-tools.mjs";
import { getCurrentRun, listRuns, saveRun } from "./pactline-store.mjs";
import { allowedOrigin, applySecurity, rateLimit, validateRunRequest } from "./security.mjs";
import { sdk } from "../server/_core/sdk";

const APPROVED_RECIPIENT = process.env.PACTLINE_APPROVED_RECIPIENT || "finance@company.test";
const UNSAFE_RECIPIENT = process.env.PACTLINE_TEST_RECIPIENT || "external-review@protonmail.test";

function now() { return new Date().toISOString(); }
function cors(req, res) { applySecurity(req, res); }
function json(res, status, body) { return res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body)); }
async function operatorContext(req, needsApproval = false) {
  const configuredToken = process.env.PACTLINE_OPERATOR_TOKEN;
  const production = process.env.NODE_ENV === "production";
  if (production && !configuredToken && process.env.PACTLINE_REQUIRE_AUTH !== "true") throw Object.assign(new Error("Operator authentication is not configured"), { statusCode: 503 });
  const providedToken = String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "");
  if (configuredToken) {
    const expected = Buffer.from(configuredToken);
    const actual = Buffer.from(providedToken);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw Object.assign(new Error("Operator authentication required"), { statusCode: 401 });
  }
  let role = String(req.headers?.["x-pactline-role"] || (configuredToken ? "" : "approver")).toLowerCase();
  let actor = String(req.headers?.["x-pactline-actor"] || "local-operator");
  if (process.env.PACTLINE_REQUIRE_AUTH === "true") {
    try {
      const user = await sdk.authenticateRequest(req);
      role = user.role;
      actor = user.openId;
    } catch {
      throw Object.assign(new Error("Authenticated Pactline session required"), { statusCode: 401 });
    }
  }
  if (needsApproval && !["admin", "approver"].includes(role)) throw Object.assign(new Error("Approver role required"), { statusCode: 403 });
  return { actor, role };
}

function publicRun(run) {
  if (!run) return null;
  const { intentToken: _intentToken, userEmail: _userEmail, ...safe } = run;
  return safe;
}
function normalizeToolResult(result) {
  const candidate = result?.result || result;
  const text = candidate?.content?.find?.((item) => item.type === "text")?.text;
  if (!text) return candidate;
  try { return JSON.parse(text); } catch { return candidate; }
}

async function execute(client, mcpName, action, args, userEmail, audit, target) {
  const started = Date.now();
  try {
    const rawResult = await invokeAuthorized(client, mcpName, action, audit.intentToken, args, userEmail);
    const result = normalizeToolResult(rawResult);
    const toolDeclined = action === "send_email" && result?.executed === false;
    const event = toolDeclined
      ? { name: action, target, decision: "held", reason: result.reason || "The mail tool declined the action before execution", timestamp: now(), latency: "Awaiting decision", requiresHumanApproval: true, result }
      : { name: action, target, decision: "allowed", reason: "ArmorIQ verified the action against the captured intent", timestamp: now(), latency: `${Date.now() - started}ms`, result };
    audit.events.push({ ...event, event: toolDeclined ? "authorization_held" : "tool_allowed" });
    return event;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "ArmorIQ did not authorize the action";
    const event = { name: action, target, decision: "held", reason, timestamp: now(), latency: "Awaiting decision", requiresHumanApproval: true };
    audit.events.push({ ...event, event: "authorization_held" });
    return event;
  }
}

async function createRun({
  invoiceId = process.env.PACTLINE_INVOICE_ID || "INV-044",
  actor = "system"
} = {}) {
  const runId = `run_${randomUUID().slice(0, 6).toUpperCase()}`;
  const startedAt = now();
  const { client, userEmail, mcpName } = await createPactlineClient();
  const invoice = await readInvoice(invoiceId);
  const { token, plan } = await captureInvoiceIntent(client, invoiceId, "Process this invoice and notify the approved finance recipient", APPROVED_RECIPIENT);
  const audit = { intentToken: token, events: [{ event: "intent_captured", name: "capture_plan", target: invoiceId, decision: "allowed", reason: "Intent token issued by ArmorIQ", timestamp: now(), latency: "—" }] };
  const actions = [];
  actions.push(await execute(client, mcpName, "read_invoice", { invoiceId }, userEmail, audit, `invoice/${invoiceId}`));
  actions.push(await execute(client, mcpName, "extract_fields", { invoiceId }, userEmail, audit, `invoice/${invoiceId}/document`));
  const extracted = actions[1]?.result || invoice;
  actions.push(await execute(client, mcpName, "write_record", { invoiceId, vendor: extracted.vendor || invoice.vendor, amount: extracted.amount || invoice.amount, currency: extracted.currency || invoice.currency, lineItems: extracted.lineItems || invoice.lineItems || [] }, userEmail, audit, `ledger.invoices/${invoiceId}`));

  const heldOrAllowed = await execute(client, mcpName, "send_email", { recipient: UNSAFE_RECIPIENT, dataScope: "vendor + totals + line items", invoiceId, approved: false }, userEmail, audit, UNSAFE_RECIPIENT);
  if (heldOrAllowed.decision === "held") heldOrAllowed.requiresHumanApproval = true;
  actions.push(heldOrAllowed);
  const status = heldOrAllowed.decision === "held" ? "held" : "approved";
  const run = { runId, actor, status, invoice: { id: invoice.invoiceId, fileName: `${invoice.invoiceId}.json`, vendor: invoice.vendor, amount: invoice.amount }, plan: { id: `plan_${randomUUID().slice(0, 8)}`, ...plan, status: "armoriq-sdk-captured", mcpName }, actions, audit: audit.events, outbox: [], createdAt: startedAt, mode: "armoriq-sdk-live", intentToken: token, userEmail, mcpName };
  await saveRun(run);
  return run;
}

async function decide(decision, req, comment = "", idempotencyKey) {
  const auth = await operatorContext(req, true);
  const run = await getCurrentRun();
  if (!run) return null;
  const held = run.actions.find((action) => action.name === "send_email" && action.decision === "held");
  if (!held || !run.intentToken) return run;
  const approvalKey = idempotencyKey || `${run.runId}:${decision}`;
  const existingApproval = run.audit.find((event) => event.event === "human_approved_and_tool_allowed" || event.event === "human_rejected") && run.audit.find((event) => event.idempotencyKey === approvalKey);
  if (existingApproval) return run;
  if (decision === "reject") {
    held.decision = "rejected";
    held.reason = "Human rejected; unauthorized action cancelled before execution";
    held.timestamp = now();
    run.status = "rejected";
    run.audit.push({ ...held, event: "human_rejected", actor: auth.actor, role: auth.role, comment: comment || "Rejected by operator", idempotencyKey: approvalKey, requestId: req.pactlineRequestId });
    await saveRun(run);
    return run;
  }
  try {
    const { client } = await createPactlineClient();
    const rawResult = await invokeAuthorized(client, run.mcpName, "send_email", run.intentToken, { recipient: APPROVED_RECIPIENT, dataScope: "invoice metadata and totals", invoiceId: run.invoice.id, approved: true }, run.userEmail);
    const result = normalizeToolResult(rawResult);
    const emailResult = result?.executed === false ? await sendEmail({ recipient: APPROVED_RECIPIENT, invoiceId: run.invoice.id, dataScope: "invoice metadata and totals", approved: true }) : result;
    held.decision = "approved";
    held.reason = "Human approved and ArmorIQ authorized the approved recipient";
    held.timestamp = now();
    held.result = emailResult;
    held.latency = "Executed after approval";
    held.requiresHumanApproval = false;
    run.status = "approved";
    if (emailResult?.executed) run.outbox = [emailResult];
    run.audit.push({ ...held, event: "human_approved_and_tool_allowed", actor: auth.actor, role: auth.role, comment: comment || "Approved by operator", idempotencyKey: approvalKey, requestId: req.pactlineRequestId });
  } catch (error) {
    held.decision = "rejected";
    held.reason = error instanceof Error ? error.message : "Approval did not authorize the action";
    held.timestamp = now();
    run.status = "rejected";
    run.audit.push({ ...held, event: "approval_failed", actor: auth.actor, role: auth.role, idempotencyKey: approvalKey, requestId: req.pactlineRequestId });
  }
  await saveRun(run);
  return run;
}

export default async function handler(req, res) {
  req.pactlineRequestId = applySecurity(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!allowedOrigin(req)) return json(res, 403, { error: "Origin is not allowed" });
  if (!rateLimit(req, res)) return;
  try {
    if (req.method === "GET") {
      const [currentRun, runs, evidence] = await Promise.all([getCurrentRun(), listRuns(), readRuntimeEvidence()]);
      return json(res, 200, { service: "pactline-control", status: "ok", currentRun: publicRun(currentRun), runs: runs.slice(0, 10).map(publicRun), evidence });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { return json(res, 400, { error: "Request body must be valid JSON" }); } }
    const validationError = validateRunRequest(body);
    if (validationError) return json(res, 400, { error: validationError, requestId: req.pactlineRequestId });
    if (body?.operation === "start") {
      const auth = await operatorContext(req, false);
      return json(res, 201, publicRun(await createRun({ invoiceId: body.invoiceId, actor: auth.actor })));
    }
    if (body?.operation === "decide" && ["approve", "reject"].includes(body.decision)) return json(res, 200, publicRun(await decide(body.decision, req, body.comment, body.idempotencyKey)));
    return json(res, 400, { error: "Expected operation=start or operation=decide with approve/reject" });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 502;
    return json(res, statusCode, { error: error instanceof Error ? error.message : "Pactline live execution failed", mode: "armoriq-sdk-live" });
  }
}

export { createRun, decide };
