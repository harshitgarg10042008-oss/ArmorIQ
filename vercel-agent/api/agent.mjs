import { randomUUID } from "node:crypto";

const allowedTools = new Set(["read_invoice", "extract_fields", "write_record"]);
const approvedRecipient = process.env.PACTLINE_APPROVED_RECIPIENT || "finance@company.test";
const defaultMcpName = process.env.ARMORIQ_MCP_NAME || "pactline-invoice";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body, null, 2));
}

function evaluate(action) {
  const { name, args = {} } = action;
  if (allowedTools.has(name)) {
    return { decision: "allow", reason: "Action is inside the captured invoice-processing intent", sideEffectExecuted: false };
  }
  if (name === "send_email") {
    const recipient = args.recipient || args.target;
    const dataScope = args.dataScope || "invoice data";
    if (recipient === approvedRecipient && dataScope === "invoice metadata and totals") {
      return { decision: "allow", reason: "Recipient and data scope match the captured intent", sideEffectExecuted: false };
    }
    return { decision: "hold", reason: "Recipient or data scope is outside the captured intent", sideEffectExecuted: false, requiresHumanApproval: true };
  }
  return { decision: "block", reason: "Tool is not present in the captured intent", sideEffectExecuted: false };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    return json(res, 200, {
      service: "pactline-agent",
      status: "ok",
      mode: process.env.ARMORIQ_LIVE === "true" ? "armoriq-sdk-ready" : "safe-simulation",
      mcpName: defaultMcpName,
      endpoints: { health: "/api/agent", evaluate: "POST /api/agent", mcp: "POST /api/mcp" },
    });
  }

  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return json(res, 400, { error: "Request body must be valid JSON" }); }
  }
  const action = body?.action;
  if (!action?.name) return json(res, 400, { error: "Expected body.action.name" });

  const result = evaluate(action);
  const event = {
    eventId: `evt_${randomUUID().slice(0, 8)}`,
    planId: body.planId || "plan_pactline_invoice_v1",
    action,
    ...result,
    timestamp: new Date().toISOString(),
    armoriq: {
      sdkPackage: "@armoriq/sdk@0.6.10",
      integrationMode: process.env.ARMORIQ_LIVE === "true" ? "live-configured" : "adapter-ready",
      mcpName: defaultMcpName,
    },
  };

  return json(res, 200, event);
}
