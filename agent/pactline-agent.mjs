#!/usr/bin/env node
/**
 * Pactline Phase 1 proof
 *
 * Signal & Stewardship: evidence before decoration, asymmetric command layout,
 * exact operator-first copy, and explicit authority boundaries.
 *
 * This is a local SDK-shaped adapter for Round 2. It is not a claim that the
 * official ArmorIQ SDK is already connected. Replace capturePlan/invoke with
 * the official SDK calls after credentials and platform access are available.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = dirname(new URL(import.meta.url).pathname);
const INPUT = resolve(ROOT, "sample-invoice.json");
const OUTBOX = resolve(ROOT, "outbox.json");
const AUDIT = resolve(ROOT, "audit.json");

const now = () => new Date().toISOString();
const audit = [];
const sideEffects = [];

function record(event, detail) {
  const item = { id: `evt_${String(audit.length + 1).padStart(3, "0")}`, time: now(), event, ...detail };
  audit.push(item);
  console.log(JSON.stringify(item));
  return item;
}

function capturePlan(plan) {
  const captured = { id: "plan_pactline_invoice_v1", status: "signed-local-proof", capturedAt: now(), ...plan };
  record("plan_captured", { planId: captured.id, goal: captured.goal, allowedActions: captured.allowedActions });
  return captured;
}

function isAuthorized(plan, action) {
  if (action.name === "send_email") {
    return plan.allowedRecipients.includes(action.recipient)
      && action.dataScope === plan.allowedDataScope;
  }
  return plan.allowedActions.includes(action.name);
}

async function invoke(plan, action, tool) {
  const allowed = isAuthorized(plan, action);
  const decision = allowed ? "allow" : "hold";
  record("authorization_decision", {
    action: action.name,
    target: action.target,
    decision,
    reason: allowed ? "Action is inside captured intent" : "Recipient or data scope is outside captured intent",
    sideEffectExecuted: false,
  });

  if (!allowed) {
    return { decision: "hold", action, sideEffectExecuted: false };
  }

  const result = await tool(action);
  record("tool_executed", { action: action.name, result, sideEffectExecuted: true });
  return { decision: "allow", action, result, sideEffectExecuted: true };
}

const tools = {
  async read_invoice(action) {
    const invoice = JSON.parse(await readFile(action.target, "utf8"));
    return { invoiceId: invoice.invoiceId, vendor: invoice.vendor, amount: invoice.amount };
  },
  async extract_fields() {
    return { fields: ["invoiceId", "vendor", "amount", "lineItems"], confidence: 0.98 };
  },
  async write_record(action) {
    return { recordId: action.recordId, store: "local-ledger" };
  },
  async send_email(action) {
    sideEffects.push({ sentTo: action.recipient, dataScope: action.dataScope, sentAt: now() });
    return { messageId: `mail_${Date.now()}`, sink: "local-outbox" };
  },
};

async function main() {
  await mkdir(ROOT, { recursive: true });
  const plan = capturePlan({
    goal: "Process invoice and notify the approved finance recipient",
    allowedActions: ["read_invoice", "extract_fields", "write_record", "send_email"],
    allowedRecipients: ["finance@company.test"],
    allowedDataScope: "invoice metadata and totals",
  });

  const invoice = await invoke(plan, { name: "read_invoice", target: INPUT }, tools.read_invoice);
  const fields = await invoke(plan, { name: "extract_fields", target: "invoice.document", dataScope: "invoice metadata and totals" }, tools.extract_fields);
  const recordResult = await invoke(plan, { name: "write_record", target: "ledger.invoices", recordId: "INV-044" }, tools.write_record);

  const held = await invoke(plan, {
    name: "send_email",
    target: "external-review@protonmail.test",
    recipient: "external-review@protonmail.test",
    dataScope: "vendor + totals + line items",
  }, tools.send_email);

  const humanDecision = process.env.PACTLINE_DECISION === "approve" ? "approved" : "rejected";
  record("human_decision", {
    decision: humanDecision,
    heldAction: held.action.name,
    sideEffectExecuted: false,
    note: humanDecision === "approved" ? "Approval recorded; release is demonstrated separately." : "Unauthorized action cancelled before execution.",
  });

  await writeFile(OUTBOX, JSON.stringify(sideEffects, null, 2));
  await writeFile(AUDIT, JSON.stringify({ plan, events: audit, outbox: sideEffects }, null, 2));

  console.log(`\nPactline Phase 1 complete: ${invoice.decision}, ${fields.decision}, ${recordResult.decision}, ${held.decision}; human=${humanDecision}`);
  console.log(`Side effects written: ${sideEffects.length}. Audit: ${AUDIT}`);
  if (sideEffects.length !== 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
