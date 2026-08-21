import { randomUUID } from "node:crypto";
import { createPactlineClient, captureInvoiceIntent, invokeAuthorized } from "../agent/armoriq-live-adapter.mjs";

const INVOICE_ID = process.env.PACTLINE_INVOICE_ID || "INV-044";
const APPROVED_RECIPIENT = process.env.PACTLINE_APPROVED_RECIPIENT || "finance@company.test";
const UNSAFE_RECIPIENT = process.env.PACTLINE_TEST_RECIPIENT || "external-review@protonmail.test";
const state = { run: null, runs: [] };

function now() { return new Date().toISOString(); }
function cors(res) { res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); }
function json(res, status, body) { res.status(status).setHeader("Content-Type", "application/json"); res.end(JSON.stringify(body)); }
function publicRun(run) { if (!run) return null; const { intentToken: _intentToken, ...safe } = run; return safe; }

async function execute(client, mcpName, action, args, userEmail, audit, target) {
  const started = Date.now();
  try {
    const result = await invokeAuthorized(client, mcpName, action, audit.intentToken, args, userEmail);
    const event = { name: action, target, decision: "allowed", reason: "ArmorIQ verified the action against the captured intent", timestamp: now(), latency: `${Date.now() - started}ms`, result };
    audit.events.push({ ...event, event: "tool_allowed" });
    return { ...event, event: undefined };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "ArmorIQ did not authorize the action";
    const event = { name: action, target, decision: "held", reason, timestamp: now(), latency: "Awaiting decision", requiresHumanApproval: true };
    audit.events.push({ ...event, event: "authorization_held" });
    return event;
  }
}

async function createRun() {
  const runId = `run_${randomUUID().slice(0, 6).toUpperCase()}`;
  const startedAt = now();
  const { client, userEmail, mcpName } = await createPactlineClient();
  const { token, plan } = await captureInvoiceIntent(client, INVOICE_ID, "Process this invoice and notify the approved finance recipient", APPROVED_RECIPIENT);
  const audit = { intentToken: token, events: [] };
  const actions = [];
  actions.push(await execute(client, mcpName, "read_invoice", { invoiceId: INVOICE_ID }, userEmail, audit, `invoice/${INVOICE_ID}`));
  actions.push(await execute(client, mcpName, "extract_fields", { invoiceId: INVOICE_ID }, userEmail, audit, `invoice/${INVOICE_ID}/document`));
  const extracted = actions[1]?.result;
  actions.push(await execute(client, mcpName, "write_record", { invoiceId: INVOICE_ID, vendor: extracted?.vendor || "Northstar Components", amount: extracted?.amount || 1480.5, currency: extracted?.currency || "INR", lineItems: extracted?.lineItems || [] }, userEmail, audit, `ledger.invoices/${INVOICE_ID}`));
  const held = { name: "send_email", target: UNSAFE_RECIPIENT, decision: "held", reason: "Recipient or data scope is outside the captured intent", timestamp: now(), latency: "Awaiting decision", requiresHumanApproval: true };
  audit.events.push({ ...held, event: "authorization_held" });
  actions.push(held);
  const run = { runId, status: "held", invoice: { id: INVOICE_ID, fileName: `${INVOICE_ID}.json` }, plan: { id: `plan_${randomUUID().slice(0, 8)}`, ...plan, status: "armoriq-sdk-captured", mcpName }, actions, audit: audit.events, outbox: [], createdAt: startedAt, mode: "armoriq-sdk-live", intentToken: token, client, userEmail, mcpName };
  state.run = run;
  state.runs.unshift(run);
  return run;
}

async function decide(decision) {
  if (!state.run) return null;
  const run = state.run;
  const held = run.actions.find((action) => action.name === "send_email" && action.decision === "held");
  if (!held) return run;
  if (decision === "approve") {
    try {
      const result = await invokeAuthorized(run.client, run.mcpName, "send_email", run.intentToken, { recipient: APPROVED_RECIPIENT, dataScope: "invoice metadata and totals", invoiceId: run.invoice.id, approved: true }, run.userEmail);
      held.decision = "allowed";
      held.reason = "Human approved and ArmorIQ authorized the approved recipient";
      held.timestamp = now();
      held.result = result;
      run.status = "approved";
      run.outbox.push({ sentTo: APPROVED_RECIPIENT, invoiceId: run.invoice.id, sentAt: now(), transport: "controlled-test-outbox" });
      run.audit.push({ ...held, event: "human_approved_and_tool_allowed" });
    } catch (error) {
      held.decision = "rejected";
      held.reason = error instanceof Error ? error.message : "Approval did not authorize the action";
      run.status = "rejected";
      run.audit.push({ ...held, event: "approval_failed" });
    }
  } else {
    held.decision = "rejected";
    held.reason = "Human rejected; unauthorized action cancelled before execution";
    held.timestamp = now();
    run.status = "rejected";
    run.audit.push({ ...held, event: "human_rejected" });
  }
  return run;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return json(res, 200, { service: "pactline-control", status: "ok", currentRun: publicRun(state.run), runs: state.runs.slice(0, 10).map(publicRun) });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return json(res, 400, { error: "Request body must be valid JSON" }); } }
  try {
    if (body?.operation === "start") return json(res, 201, publicRun(await createRun()));
    if (body?.operation === "decide" && ["approve", "reject"].includes(body.decision)) return json(res, 200, publicRun(await decide(body.decision)));
    return json(res, 400, { error: "Expected operation=start or operation=decide with approve/reject" });
  } catch (error) {
    return json(res, 502, { error: error instanceof Error ? error.message : "Pactline live execution failed", mode: "armoriq-sdk-live" });
  }
}

export { createRun, decide };
