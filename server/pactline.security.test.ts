import { describe, expect, it, vi } from "vitest";
// @ts-ignore Shared ESM helper is intentionally tested without a duplicate TypeScript wrapper.
import { allowedOrigin, applySecurity, validateRunRequest, validateToolArguments } from "./pactline-api/security.mjs";
// @ts-ignore Shared ESM run helper is intentionally tested without a duplicate TypeScript wrapper.
import { operatorContext } from "./pactline-api/run.mjs";

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

  it("uses a local demo approver without requiring a browser session", async () => {
    const previousMode = process.env.NODE_ENV;
    const previousAuth = process.env.PACTLINE_REQUIRE_AUTH;
    const previousToken = process.env.PACTLINE_OPERATOR_TOKEN;
    process.env.NODE_ENV = "development";
    process.env.PACTLINE_REQUIRE_AUTH = "false";
    delete process.env.PACTLINE_OPERATOR_TOKEN;
    try {
      await expect(operatorContext({ headers: {} }, true)).resolves.toMatchObject({ actor: "local-demo-operator", role: "approver" });
    } finally {
      if (previousMode === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousMode;
      if (previousAuth === undefined) delete process.env.PACTLINE_REQUIRE_AUTH;
      else process.env.PACTLINE_REQUIRE_AUTH = previousAuth;
      if (previousToken === undefined) delete process.env.PACTLINE_OPERATOR_TOKEN;
      else process.env.PACTLINE_OPERATOR_TOKEN = previousToken;
    }
  });

  it("rejects production startup when no operator authentication is configured", async () => {
    const previousMode = process.env.NODE_ENV;
    const previousAuth = process.env.PACTLINE_REQUIRE_AUTH;
    const previousToken = process.env.PACTLINE_OPERATOR_TOKEN;
    process.env.NODE_ENV = "production";
    delete process.env.PACTLINE_REQUIRE_AUTH;
    delete process.env.PACTLINE_OPERATOR_TOKEN;
    try {
      await expect(operatorContext({ headers: {} }, false)).rejects.toMatchObject({ statusCode: 503 });
    } finally {
      if (previousMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousMode;
      if (previousAuth === undefined) delete process.env.PACTLINE_REQUIRE_AUTH; else process.env.PACTLINE_REQUIRE_AUTH = previousAuth;
      if (previousToken === undefined) delete process.env.PACTLINE_OPERATOR_TOKEN; else process.env.PACTLINE_OPERATOR_TOKEN = previousToken;
    }
  });

  it("requires the configured bearer token and approver role", async () => {
    const previousMode = process.env.NODE_ENV;
    const previousAuth = process.env.PACTLINE_REQUIRE_AUTH;
    const previousToken = process.env.PACTLINE_OPERATOR_TOKEN;
    const previousRole = process.env.PACTLINE_OPERATOR_ROLE;
    process.env.NODE_ENV = "production";
    process.env.PACTLINE_OPERATOR_TOKEN = "server-secret";
    process.env.PACTLINE_OPERATOR_ROLE = "viewer";
    delete process.env.PACTLINE_REQUIRE_AUTH;
    try {
      await expect(operatorContext({ headers: {} }, false)).rejects.toMatchObject({ statusCode: 401 });
      await expect(operatorContext({ headers: { authorization: "Bearer server-secret" } }, true)).rejects.toMatchObject({ statusCode: 403 });
    } finally {
      if (previousMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousMode;
      if (previousAuth === undefined) delete process.env.PACTLINE_REQUIRE_AUTH; else process.env.PACTLINE_REQUIRE_AUTH = previousAuth;
      if (previousToken === undefined) delete process.env.PACTLINE_OPERATOR_TOKEN; else process.env.PACTLINE_OPERATOR_TOKEN = previousToken;
      if (previousRole === undefined) delete process.env.PACTLINE_OPERATOR_ROLE; else process.env.PACTLINE_OPERATOR_ROLE = previousRole;
    }
  });

  it("allows the localhost Vite origin during development", () => {
    const previousMode = process.env.NODE_ENV;
    const previousOrigin = process.env.PACTLINE_FRONTEND_ORIGIN;
    process.env.NODE_ENV = "development";
    delete process.env.PACTLINE_FRONTEND_ORIGIN;
    try {
      expect(allowedOrigin({ headers: { origin: "http://localhost:5173" } })).toBe(true);
      expect(allowedOrigin({ headers: { origin: "http://127.0.0.1:3000" } })).toBe(true);
    } finally {
      if (previousMode === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousMode;
      if (previousOrigin === undefined) delete process.env.PACTLINE_FRONTEND_ORIGIN;
      else process.env.PACTLINE_FRONTEND_ORIGIN = previousOrigin;
    }
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
