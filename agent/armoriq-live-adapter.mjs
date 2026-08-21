/**
 * Server-side ArmorIQ execution adapter.
 * The SDK is the authorization boundary; MCP remains the tool surface.
 */

export async function createPactlineClient() {
  const apiKey = process.env.ARMORIQ_API_KEY;
  const userEmail = process.env.USER_EMAIL;
  if (!apiKey || !userEmail) throw new Error("ARMORIQ_API_KEY and USER_EMAIL are required for live ArmorIQ execution.");
  const sdk = await import("@armoriq/sdk");
  const client = new sdk.ArmorIQClient({ apiKey });
  return { client, userEmail, mcpName: process.env.ARMORIQ_MCP_NAME || "pactline-invoice" };
}

export function buildInvoicePlan(invoiceId, approvedRecipient) {
  return {
    goal: "Process invoice and notify the approved finance recipient",
    steps: [
      { action: "read_invoice", mcp: process.env.ARMORIQ_MCP_NAME || "pactline-invoice", params: { invoiceId } },
      { action: "extract_fields", mcp: process.env.ARMORIQ_MCP_NAME || "pactline-invoice", params: { invoiceId } },
      { action: "write_record", mcp: process.env.ARMORIQ_MCP_NAME || "pactline-invoice", params: { invoiceId } },
      { action: "send_email", mcp: process.env.ARMORIQ_MCP_NAME || "pactline-invoice", params: { recipient: approvedRecipient, dataScope: "invoice metadata and totals", invoiceId } },
    ],
  };
}

export async function captureInvoiceIntent(client, invoiceId, prompt, approvedRecipient) {
  const plan = buildInvoicePlan(invoiceId, approvedRecipient);
  const captured = client.capturePlan("pactline-invoice-agent", prompt, plan);
  const token = await client.getIntentToken(captured);
  return { token, plan };
}

export async function invokeAuthorized(client, mcpName, action, token, args, userEmail) {
  return client.invoke(mcpName, action, token, args, undefined, userEmail);
}
