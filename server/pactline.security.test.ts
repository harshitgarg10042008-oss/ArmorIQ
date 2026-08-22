import { describe, expect, it, vi } from "vitest";
// @ts-ignore Shared ESM helper is intentionally tested without a duplicate TypeScript wrapper.
import { allowedOrigin, applySecurity, validateRunRequest, validateToolArguments } from "../api/security.mjs";

describe("Pactline security helpers", () => {
  it("allows server-to-server requests without a browser origin", () => {
    const req = { headers: {} };
    const res = { setHeader: vi.fn() };
    const requestId = applySecurity(req, res);
    expect(requestId).toMatch(/^req_/);
    expect(allowedOrigin(req)).toBe(true);
    expect(res.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
  });

  it("rejects malformed run decisions and MCP tool arguments", () => {
    expect(validateRunRequest({ operation: "decide", decision: "maybe" })).toBeTruthy();
    expect(validateRunRequest({ operation: "decide", decision: "approve", idempotencyKey: "short" })).toBeTruthy();
    expect(validateToolArguments("read_invoice", {})).toBeTruthy();
    expect(validateToolArguments("send_email", { recipient: "not-an-email", invoiceId: "INV-044" })).toBeTruthy();
    expect(validateToolArguments("read_invoice", { invoiceId: "INV-044" })).toBeNull();
  });

  it("rejects an origin that differs from the configured frontend", () => {
    const previous = process.env.PACTLINE_FRONTEND_ORIGIN;
    process.env.PACTLINE_FRONTEND_ORIGIN = "https://pactline.example";
    try {
      expect(allowedOrigin({ headers: { origin: "https://evil.example" } })).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.PACTLINE_FRONTEND_ORIGIN;
      else process.env.PACTLINE_FRONTEND_ORIGIN = previous;
    }
  });
});
