#!/usr/bin/env node
/**
 * Pactline ArmorIQ integration preflight.
 *
 * This checks configuration before the live SDK is called. It prevents the
 * common Discord-reported failures from appearing as opaque platform errors.
 * It never prints secret values.
 */

const required = ["ARMORIQ_API_KEY", "USER_EMAIL"];
const optional = ["ARMORIQ_AGENT_URL", "ARMORIQ_POLICY_ID", "ARMORIQ_MCP_NAME"];
const errors = [];
const warnings = [];

for (const key of required) {
  if (!process.env[key]) errors.push(`${key} is missing`);
}

if (process.env.ARMORIQ_AGENT_URL && !/^https?:\/\//.test(process.env.ARMORIQ_AGENT_URL)) {
  errors.push("ARMORIQ_AGENT_URL must begin with http:// or https://");
}

if (!process.env.ARMORIQ_AGENT_URL) {
  warnings.push("ARMORIQ_AGENT_URL is not set; remote agent registration cannot be attempted from this environment");
}
if (!process.env.ARMORIQ_POLICY_ID) {
  warnings.push("ARMORIQ_POLICY_ID is not set; verify the console policy is applied before using live enforcement");
}
if (!process.env.ARMORIQ_MCP_NAME) {
  warnings.push("ARMORIQ_MCP_NAME is not set; defaulting to the documented MCP name: pactline-invoice");
}

const toolMetadata = {
  read_invoice: { target: "invoice input", dataScope: "invoice metadata and totals" },
  extract_fields: { target: "invoice document", dataScope: "invoice metadata and totals" },
  write_record: { target: "ledger.invoices", dataScope: "invoice metadata and totals" },
  send_email: { target: process.env.PACTLINE_TEST_RECIPIENT || "external-review@protonmail.test", recipient: process.env.PACTLINE_TEST_RECIPIENT || "external-review@protonmail.test", dataScope: "vendor + totals + line items", amount: 0.01, currency: "INR" },
};

for (const [tool, metadata] of Object.entries(toolMetadata)) {
  for (const [key, value] of Object.entries(metadata)) {
    if (!value) errors.push(`${tool} metadata is missing: ${key}`);
  }
}

const result = {
  status: errors.length ? "blocked-preflight" : "ready-for-sdk-configuration",
  requiredKeys: required.map((key) => ({ key, present: Boolean(process.env[key]) })),
  optionalKeys: optional.map((key) => ({ key, present: Boolean(process.env[key]) })),
  mcpName: process.env.ARMORIQ_MCP_NAME || "pactline-invoice",
  toolMetadata,
  errors,
  warnings,
  next: errors.length
    ? "Fix the listed configuration errors before registering an agent or creating a policy."
    : "Run the reference SDK bootstrap/session flow, then capture the decision and proof path.",
};

console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
