import { describe, expect, it } from "vitest";
import { handleRpc } from "../vercel-agent/api/mcp.mjs";

describe("Pactline MCP endpoint", () => {
  it("resolves a newly uploaded invoice from signed context", async () => {
    const response = await handleRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "read_invoice",
        arguments: {
          invoiceId: "INV-045",
          invoice: {
            invoiceId: "INV-045",
            vendor: "BluePeak Industrial Supplies",
            amount: 3250,
            currency: "INR",
            date: "2026-08-22",
            lineItems: [{ description: "Industrial components", quantity: 1, unitPrice: 3250 }],
          },
        },
      },
    });

    expect(response?.error).toBeUndefined();
    expect(response?.result?.content?.[0]?.text).toContain("INV-045");
    expect(response?.result?.content?.[0]?.text).toContain("BluePeak Industrial Supplies");
  });
});
