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

export function buildInvoicePlan(invoiceId, approvedRecipient, invoiceContext = undefined) {
  const boundInvoice = invoiceContext ? {
    invoiceId: invoiceContext.invoiceId,
    vendor: invoiceContext.vendor,
    amount: invoiceContext.amount,
    currency: invoiceContext.currency,
    date: invoiceContext.date,
    lineItems: invoiceContext.lineItems || [],
  } : undefined;
  const invoiceParams = (extra = {}) => ({ invoiceId, ...(boundInvoice ? { invoice: boundInvoice } : {}), ...extra });
  return {
    goal: "Process invoice and notify the approved finance recipient",
    steps: [
      { action: "read_invoice", mcp: process.env.ARMORIQ_MCP_NAME || "pactline-invoice", params: invoiceParams() },
      { action: "extract_fields", mcp: process.env.ARMORIQ_MCP_NAME || "pactline-invoice", params: invoiceParams() },
      { action: "write_record", mcp: process.env.ARMORIQ_MCP_NAME || "pactline-invoice", params: invoiceParams() },
      { action: "send_email", mcp: process.env.ARMORIQ_MCP_NAME || "pactline-invoice", params: { recipient: approvedRecipient, dataScope: "invoice metadata and totals", invoiceId } },
    ],
  };
}

export async function captureInvoiceIntent(client, invoiceId, prompt, approvedRecipient, invoiceContext) {
  const plan = buildInvoicePlan(invoiceId, approvedRecipient, invoiceContext);
  const captured = client.capturePlan("pactline-invoice-agent", prompt, plan);
  const token = await client.getIntentToken(captured);
  return { token, plan };
}

export async function invokeAuthorized(client, mcpName, action, token, args, userEmail) {
  const timeoutMs = Math.max(5_000, Number(process.env.PACTLINE_SDK_TIMEOUT_MS || 45_000));
  let timeoutId;
  try {
    return await Promise.race([
      client.invoke(mcpName, action, token, args, undefined, userEmail),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`ArmorIQ MCP invocation timed out after ${timeoutMs}ms (action=${action}, mcp=${mcpName})`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
