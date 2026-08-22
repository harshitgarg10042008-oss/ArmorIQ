import { readInvoice, extractFields, writeRecord, sendEmail } from "../../server/pactline-api/pactline-tools.mjs";
import { allowedOrigin, applySecurity, rateLimit, validateToolArguments } from "../../server/pactline-api/security.mjs";
import { increment } from "../../server/pactline-api/metrics.mjs";

const SERVER_NAME = process.env.ARMORIQ_MCP_NAME || "pactline-invoice";

const TOOLS = [
  { name: "read_invoice", description: "Read invoice metadata and totals from an invoice reference.", inputSchema: { type: "object", properties: { invoiceId: { type: "string" }, invoice: { type: "object" } }, required: ["invoiceId"] } },
  { name: "extract_fields", description: "Extract normalized fields and line items from an invoice document.", inputSchema: { type: "object", properties: { invoiceId: { type: "string" }, invoice: { type: "object" } }, required: ["invoiceId"] } },
  { name: "write_record", description: "Write an invoice record to the finance ledger.", inputSchema: { type: "object", properties: { invoiceId: { type: "string" }, invoice: { type: "object" }, vendor: { type: "string" }, amount: { type: "number" }, currency: { type: "string" }, lineItems: { type: "array" } }, required: ["invoiceId", "vendor", "amount"] } },
  { name: "send_email", description: "Send invoice data only after an approved authorization decision.", inputSchema: { type: "object", properties: { recipient: { type: "string" }, dataScope: { type: "string" }, invoiceId: { type: "string" }, approved: { type: "boolean" } }, required: ["recipient", "dataScope", "invoiceId"] } },
];

function sse(res, payload) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.end(`event: message\ndata: ${JSON.stringify(payload)}\n\n`);
}

function rpcError(id, code, message) { return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }; }
function toolResult(data) { return { content: [{ type: "text", text: JSON.stringify(data) }] }; }

async function callTool(name, args = {}) {
  if (name === "read_invoice") return readInvoice(args.invoiceId, args.invoice);
  if (name === "extract_fields") return extractFields(args.invoiceId, args.invoice);
  if (name === "write_record") return writeRecord(args);
  if (name === "send_email") return sendEmail(args);
  return null;
}

async function handleRpc(request) {
  const { id, method, params = {} } = request || {};
  if (method === "initialize") return { jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: SERVER_NAME, version: "2.0.0" } } };
  if (method === "notifications/initialized") return null;
  if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  if (method === "tools/call") {
    try {
      const validationError = validateToolArguments(params.name, params.arguments || {});
      if (validationError) return rpcError(id, -32602, validationError);
      const result = await callTool(params.name, params.arguments || {});
      increment("mcp.calls");
      if (!result) return rpcError(id, -32602, `Unknown tool: ${params.name}`);
      return { jsonrpc: "2.0", id, result: toolResult(result) };
    } catch (error) {
      increment("mcp.errors");
      return rpcError(id, -32000, error instanceof Error ? error.message : "Tool execution failed");
    }
  }
  return rpcError(id, -32601, `Method not found: ${method}`);
}

export default async function handler(req, res) {
  applySecurity(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!allowedOrigin(req)) return res.status(403).json({ error: "Origin is not allowed" });
  if (!rateLimit(req, res, 120)) return;
  if (req.method === "GET") return res.status(200).json({ service: SERVER_NAME, protocol: "json-rpc-2.0-over-sse", endpoint: "/api/mcp", tools: TOOLS.map((tool) => tool.name) });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Request body must be valid JSON" }); } }
  if (!body || typeof body !== "object" || body.jsonrpc !== "2.0") return res.status(400).json({ error: "JSON-RPC 2.0 request required" });
  const response = await handleRpc(body);
  if (!response) return res.status(202).end();
  return sse(res, response);
}

export { TOOLS, handleRpc };
