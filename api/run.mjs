import { randomUUID } from "node:crypto";
import { createPactlineClient, captureInvoiceIntent, invokeAuthorized } from "../agent/armoriq-live-adapter.mjs";
import { readInvoice, extractFields, writeRecord, sendEmail, readRuntimeEvidence } from "./pactline-tools.mjs";
import { getCurrentRun, listRuns, saveRun } from "./pactline-store.mjs";

const APPROVED_RECIPIENT = process.env.PACTLINE_APPROVED_RECIPIENT || "finance@company.test";
const UNSAFE_RECIPIENT = process.env.PACTLINE_TEST_RECIPIENT || "external-review@protonmail.test";

function now() { return new Date().toISOString(); }
function cors(res) { res.setHeader("Access-Control-Allow-Origin", process.env.PACTLINE_FRONTEND_ORIGIN || "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); }
function json(res, status, body) { return res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body)); }
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

async function createRun({ invoiceId = process.env.PACTLINE_INVOICE_ID || "INV-044" } = {}) {
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
  const run = { runId, status, invoice: { id: invoice.invoiceId, fileName: `${invoice.invoiceId}.json`, vendor: invoice.vendor, amount: invoice.amount }, plan: { id: `plan_${randomUUID().slice(0, 8)}`, ...plan, status: "armoriq-sdk-captured", mcpName }, actions, audit: audit.events, outbox: [], createdAt: startedAt, mode: "armoriq-sdk-live", intentToken: token, userEmail, mcpName };
  await saveRun(run);
  return run;
}

async function decide(decision) {
  const run = await getCurrentRun();
  if (!run) return null;
  const held = run.actions.find((action) => action.name === "send_email" && action.decision === "held");
  if (!held || !run.intentToken) return run;
  if (decision === "reject") {
    held.decision = "rejected";
    held.reason = "Human rejected; unauthorized action cancelled before execution";
    held.timestamp = now();
    run.status = "rejected";
    run.audit.push({ ...held, event: "human_rejected" });
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
    run.audit.push({ ...held, event: "human_approved_and_tool_allowed" });
  } catch (error) {
    held.decision = "rejected";
    held.reason = error instanceof Error ? error.message : "Approval did not authorize the action";
    held.timestamp = now();
    run.status = "rejected";
    run.audit.push({ ...held, event: "approval_failed" });
  }
  await saveRun(run);
  return run;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  try {
    if (req.method === "GET") {
      const [currentRun, runs, evidence] = await Promise.all([getCurrentRun(), listRuns(), readRuntimeEvidence()]);
      return json(res, 200, { service: "pactline-control", status: "ok", currentRun: publicRun(currentRun), runs: runs.slice(0, 10).map(publicRun), evidence });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { return json(res, 400, { error: "Request body must be valid JSON" }); } }
    if (body?.operation === "start") return json(res, 201, publicRun(await createRun({ invoiceId: body.invoiceId })));
    if (body?.operation === "decide" && ["approve", "reject"].includes(body.decision)) return json(res, 200, publicRun(await decide(body.decision)));
    return json(res, 400, { error: "Expected operation=start or operation=decide with approve/reject" });
  } catch (error) {
    return json(res, 502, { error: error instanceof Error ? error.message : "Pactline live execution failed", mode: "armoriq-sdk-live" });
  }
}

export { createRun, decide };
