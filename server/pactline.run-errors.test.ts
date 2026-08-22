import { describe, expect, it, vi } from "vitest";
import { classifyExecutionError, execute, isAuthorizationHoldError } from "./pactline-api/run.mjs";

describe("Pactline run error classification", () => {
  it("returns configuration-required for missing live configuration", () => {
    expect(classifyExecutionError(new Error("ARMORIQ_API_KEY and USER_EMAIL are required"))).toBe(503);
    expect(classifyExecutionError(Object.assign(new Error("Operator authentication is not configured"), { statusCode: 503 }))).toBe(503);
  });

  it("returns authentication-required for invalid credentials", () => {
    expect(classifyExecutionError(new Error("ArmorIQ API key unauthorized"))).toBe(401);
    expect(classifyExecutionError(Object.assign(new Error("Operator authentication required"), { statusCode: 401 }))).toBe(401);
  });

  it("recognizes authorization holds without treating them as technical failures", () => {
    expect(isAuthorizationHoldError({ decision: "hold" })).toBe(true);
    expect(isAuthorizationHoldError(new Error("Action outside captured intent requires approval"))).toBe(true);
    expect(isAuthorizationHoldError({ response: { data: { message: "Tool 'send_email' held for approval by member policy rule" } } })).toBe(true);
    expect(isAuthorizationHoldError(new Error("ArmorIQ API key unauthorized"))).toBe(false);
    expect(isAuthorizationHoldError(new Error("MCP endpoint returned 502"))).toBe(false);
  });

  it("returns a held action event when the SDK reports an out-of-scope authorization", async () => {
    const audit = { intentToken: "test-token", events: [] };
    const client = { invoke: vi.fn(async () => { throw { response: { data: { message: "Tool 'send_email' held for approval by member policy rule" } } }; }) };
    const event = await execute(client, "pactline-invoice", "send_email", { recipient: "external-review@protonmail.test" }, "operator@example.com", audit, "external-review@protonmail.test");
    expect(event).toMatchObject({ name: "send_email", decision: "held", requiresHumanApproval: true, technicalFailure: false });
    expect(audit.events[0]).toMatchObject({ event: "authorization_held", decision: "held" });
  });

  it("returns execution-failed for downstream MCP failures", () => {
    expect(classifyExecutionError(new Error("MCP endpoint returned 502"))).toBe(502);
    expect(classifyExecutionError(new Error("Invoice tool timed out"))).toBe(502);
    expect(classifyExecutionError(new Error("MCP tool error (-32000): EROFS: read-only file system, open '/var/task/agent/runtime-data/ledger.json'"))).toBe(502);
  });
});
