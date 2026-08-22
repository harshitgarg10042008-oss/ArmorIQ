import { readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readInvoice, extractFields, writeRecord, sendEmail, readRuntimeEvidence } from "../server/pactline-api/pactline-tools.mjs";
import { buildInvoicePlan } from "../agent/armoriq-live-adapter.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(ROOT, "../agent/runtime-data");

async function validate() {
  console.log("--- Pactline Vertical Slice Validation ---");
  
  try {
    // 1. Reset runtime data
    await rm(DATA_DIR, { recursive: true, force: true });
    console.log("[1/5] Runtime data reset: OK");

    // 2. Validate real invoice tools
    const invoice = await readInvoice("INV-044");
    if (invoice.vendor !== "Northstar Components") throw new Error("readInvoice returned wrong vendor");
    const fields = await extractFields("INV-044");
    if (fields.lineItems.length !== 3) throw new Error("extractFields returned wrong line items count");
    console.log("[2/5] Real invoice tools: OK");

    // 3. Validate real ledger persistence
    const record = await writeRecord({ invoiceId: "INV-044", vendor: "Northstar Components", amount: 1480.5 });
    if (!record.persisted) throw new Error("writeRecord did not persist");
    const evidence = await readRuntimeEvidence();
    if (evidence.ledger.length !== 1) throw new Error("Ledger evidence not found");
    console.log("[3/5] Real ledger persistence: OK");

    // 4. Validate controlled outbox and approval
    const held = await sendEmail({ recipient: "external@protonmail.test", invoiceId: "INV-044", dataScope: "all", approved: false });
    if (held.executed) throw new Error("sendEmail executed without approval");
    const approved = await sendEmail({ recipient: "finance@company.test", invoiceId: "INV-044", dataScope: "all", approved: true });
    if (!approved.executed) throw new Error("sendEmail did not execute with approval");
    const finalEvidence = await readRuntimeEvidence();
    if (finalEvidence.outbox.length !== 1) throw new Error("Outbox evidence not found");
    console.log("[4/5] Controlled outbox and approval: OK");

    // 5. Validate SDK plan contract
    const plan = buildInvoicePlan("INV-044", "finance@company.test");
    if (plan.steps.length !== 4) throw new Error("buildInvoicePlan returned wrong steps count");
    if (plan.steps[3].action !== "send_email") throw new Error("buildInvoicePlan last step is not send_email");
    console.log("[5/5] SDK plan contract: OK");

    console.log("\n--- Validation Successful: Vertical Slice is Ready ---");
  } catch (error) {
    console.error("\n--- Validation Failed ---");
    console.error(error.message);
    process.exitCode = 1;
  }
}

validate();
