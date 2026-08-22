import { describe, expect, it } from "vitest";
import { classifyExecutionError } from "./pactline-api/run.mjs";

describe("Pactline run error classification", () => {
  it("returns configuration-required for missing live configuration", () => {
    expect(classifyExecutionError(new Error("ARMORIQ_API_KEY and USER_EMAIL are required"))).toBe(503);
    expect(classifyExecutionError(Object.assign(new Error("Operator authentication is not configured"), { statusCode: 503 }))).toBe(503);
  });

  it("returns authentication-required for invalid credentials", () => {
    expect(classifyExecutionError(new Error("ArmorIQ API key unauthorized"))).toBe(401);
    expect(classifyExecutionError(Object.assign(new Error("Operator authentication required"), { statusCode: 401 }))).toBe(401);
  });

  it("returns execution-failed for downstream MCP failures", () => {
    expect(classifyExecutionError(new Error("MCP endpoint returned 502"))).toBe(502);
    expect(classifyExecutionError(new Error("Invoice tool timed out"))).toBe(502);
  });
});
