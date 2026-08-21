import { randomUUID } from "node:crypto";

const SERVER_NAME = process.env.ARMORIQ_MCP_NAME || "pactline-invoice";
const APPROVED_RECIPIENT = process.env.PACTLINE_APPROVED_RECIPIENT || "finance@company.test";

const TOOLS = [
  {
    name: "read_invoice",
    description: "Read invoice metadata and totals from an invoice reference.",
    inputSchema: {
      type: "object",
      properties: { invoiceId: { type: "string", description: "Invoice identifier" } },
      required: ["invoiceId"],
    },
  },
  {
    name: "extract_fields",
    description: "Extract normalized fields and line items from an invoice document.",
    inputSchema: {
      type: "object",
      properties: { invoiceId: { type: "string", description: "Invoice identifier" } },
      required: ["invoiceId"],
    },
  },
  {
    name: "write_record",
    description: "Write an invoice record to the finance ledger.",
    inputSchema: {
      type: "object",
      properties: {
        invoiceId: { type: "string", description: "Invoice identifier" },
        vendor: { type: "string", description: "Vendor name" },
        amount: { type: "number", description: "Invoice total" },
      },
      required: ["invoiceId", "vendor", "amount"],
    },
  },
  {
    name: "send_email",
    description: "Propose sending invoice data to an approved finance recipient.",
    inputSchema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Email recipient" },
        dataScope: { type: "string", description: "Invoice data scope" },
        invoiceId: { type: "string", description: "Invoice identifier" },
      },
      required: ["recipient", "dataScope", "invoiceId"],
    },
  },
];

function sse(res, payload) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.end(`event: message\ndata: ${JSON.stringify(payload)}\n\n`);
}

function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function toolResult(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

function callTool(name, args = {}) {
  if (name === "read_invoice") {
    return { invoiceId: args.invoiceId || "INV-044", vendor: "Northstar Components", amount: 1480.5 };
  }
  if (name === "extract_fields") {
    return { invoiceId: args.invoiceId || "INV-044", fields: ["invoiceId", "vendor", "amount", "lineItems"], confidence: 0.98 };
  }
  if (name === "write_record") {
    return { recordId: args.invoiceId || "INV-044", store: "local-ledger", writeId: `wr_${randomUUID().slice(0, 8)}` };
  }
  if (name === "send_email") {
    const approved = args.recipient === APPROVED_RECIPIENT && args.dataScope === "invoice metadata and totals";
    return {
      proposed: true,
      executed: false,
      recipient: args.recipient,
      approvedRecipient: APPROVED_RECIPIENT,
      decision: approved ? "eligible-for-authorization" : "requires-human-approval",
      reason: approved ? "Recipient and data scope match the invoice intent" : "Recipient or data scope is outside the captured intent",
    };
  }
  return null;
}

async function handleRpc(request) {
  const { id, method, params = {} } = request || {};
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: "1.0.0" },
      },
    };
  }
  if (method === "notifications/initialized") return null;
  if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  if (method === "tools/call") {
    const name = params.name;
    const result = callTool(name, params.arguments || {});
    if (!result) return rpcError(id, -32602, `Unknown tool: ${name}`);
    return { jsonrpc: "2.0", id, result: toolResult(result) };
  }
  return rpcError(id, -32601, `Method not found: ${method}`);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") {
    return res.status(200).json({ service: SERVER_NAME, protocol: "json-rpc-2.0-over-sse", endpoint: "/api/mcp", tools: TOOLS.map((tool) => tool.name) });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Request body must be valid JSON" }); }
  }
  const response = await handleRpc(body);
  if (!response) return res.status(202).end();
  return sse(res, response);
}

export { TOOLS, handleRpc };
