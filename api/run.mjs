import { randomUUID } from "node:crypto";

const APPROVED_RECIPIENT = process.env.PACTLINE_APPROVED_RECIPIENT || "finance@company.test";
const state = {
  run: null,
  runs: [],
};

function now() {
  return new Date().toISOString();
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function createRun() {
  const runId = `run_${randomUUID().slice(0, 6).toUpperCase()}`;
  const startedAt = now();
  const actions = [
    { name: "read_invoice", target: "inbox/northstar_invoice_044.pdf", decision: "allowed", reason: "Action is inside the captured intent", timestamp: startedAt, latency: "112ms" },
    { name: "extract_fields", target: "invoice_id · vendor · amount · line_items", decision: "allowed", reason: "Action is inside the captured intent", timestamp: startedAt, latency: "684ms" },
    { name: "write_record", target: "ledger.invoices / INV-044", decision: "allowed", reason: "Action is inside the captured intent", timestamp: startedAt, latency: "87ms" },
    { name: "send_email", target: "external-review@protonmail.test", decision: "held", reason: "Recipient or data scope is outside the captured intent", timestamp: startedAt, latency: "Awaiting decision", requiresHumanApproval: true },
  ];
  const run = {
    runId,
    status: "held",
    invoice: { id: "INV-044", fileName: "northstar_invoice_044.pdf", vendor: "Northstar Components", amount: 1480.5 },
    plan: {
      id: `plan_${randomUUID().slice(0, 8)}`,
      goal: "Process invoice and notify the approved finance recipient",
      steps: ["read invoice", "normalize fields", "write ledger record", "notify approved recipient"],
      status: "signed-local-proof",
      mcpName: process.env.ARMORIQ_MCP_NAME || "pactline-invoice",
    },
    actions,
    audit: actions.map((action) => ({ ...action, event: action.decision === "held" ? "authorization_held" : "tool_allowed" })),
    outbox: [],
    createdAt: startedAt,
    mode: process.env.ARMORIQ_LIVE === "true" ? "armoriq-sdk-ready" : "safe-simulation",
  };
  state.run = run;
  state.runs.unshift(run);
  return run;
}

function decide(decision) {
  if (!state.run) return null;
  const held = state.run.actions.find((action) => action.name === "send_email");
  if (!held || held.decision !== "held") return state.run;
  held.decision = decision === "approve" ? "allowed" : "rejected";
  held.reason = decision === "approve" ? "Human approved the held action" : "Unauthorized action cancelled before execution";
  held.timestamp = now();
  state.run.status = decision === "approve" ? "approved" : "rejected";
  state.run.audit.push({ ...held, event: decision === "approve" ? "human_approved" : "human_rejected" });
  if (decision === "approve") {
    state.run.outbox.push({ sentTo: APPROVED_RECIPIENT, invoiceId: state.run.invoice.id, sentAt: now(), simulated: true });
  }
  return state.run;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return json(res, 200, { service: "pactline-control", status: "ok", currentRun: state.run, runs: state.runs.slice(0, 10) });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return json(res, 400, { error: "Request body must be valid JSON" }); }
  }
  if (body?.operation === "start") return json(res, 201, createRun());
  if (body?.operation === "decide" && ["approve", "reject"].includes(body.decision)) return json(res, 200, decide(body.decision));
  return json(res, 400, { error: "Expected operation=start or operation=decide with approve/reject" });
}

export { createRun, decide };
