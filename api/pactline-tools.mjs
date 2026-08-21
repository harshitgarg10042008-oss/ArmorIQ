import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(ROOT, "../agent/invoice_044.json");
const DATA_DIR = join(ROOT, "../agent/runtime-data");
const LEDGER_FILE = join(DATA_DIR, "ledger.json");
const OUTBOX_FILE = join(DATA_DIR, "outbox.json");

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return fallback; }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export async function readInvoice(invoiceId = "INV-044") {
  const invoice = await readJson(FIXTURE, null);
  if (!invoice || invoice.invoiceId !== invoiceId) throw new Error(`Invoice not found: ${invoiceId}`);
  return { invoiceId: invoice.invoiceId, vendor: invoice.vendor, amount: invoice.amount, currency: invoice.currency, date: invoice.date };
}

export async function extractFields(invoiceId = "INV-044") {
  const invoice = await readJson(FIXTURE, null);
  if (!invoice || invoice.invoiceId !== invoiceId) throw new Error(`Invoice not found: ${invoiceId}`);
  return { invoiceId: invoice.invoiceId, vendor: invoice.vendor, amount: invoice.amount, currency: invoice.currency, lineItems: invoice.lineItems, confidence: 1 };
}

export async function writeRecord({ invoiceId, vendor, amount, currency = "INR", lineItems = [] }) {
  const ledger = await readJson(LEDGER_FILE, []);
  const record = { recordId: invoiceId, invoiceId, vendor, amount, currency, lineItems, writtenAt: new Date().toISOString() };
  const next = [...ledger.filter((item) => item.invoiceId !== invoiceId), record];
  await writeJson(LEDGER_FILE, next);
  return { recordId: invoiceId, store: "runtime-ledger", persisted: true, writtenAt: record.writtenAt };
}

export async function sendEmail({ recipient, invoiceId, dataScope, approved = false }) {
  const approvedRecipient = process.env.PACTLINE_APPROVED_RECIPIENT || "finance@company.test";
  if (!approved || recipient !== approvedRecipient) {
    return { executed: false, recipient, invoiceId, dataScope, reason: "Email requires an ArmorIQ-approved decision before execution" };
  }
  const outbox = await readJson(OUTBOX_FILE, []);
  const message = { messageId: `msg_${Date.now()}`, recipient, invoiceId, dataScope, sentAt: new Date().toISOString(), transport: "controlled-test-outbox" };
  await writeJson(OUTBOX_FILE, [...outbox, message]);
  return { executed: true, ...message };
}

export async function readRuntimeEvidence() {
  return { ledger: await readJson(LEDGER_FILE, []), outbox: await readJson(OUTBOX_FILE, []) };
}
