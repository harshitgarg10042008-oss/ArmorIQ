import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR, getInvoice, listInvoices, saveInvoice } from "./pactline-store.mjs";
import { getDatabaseInvoice, listDatabaseInvoices, saveDatabaseInvoice } from "./pactline-db-repository.mjs";
import { storagePut } from "../storage.ts";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { createWorker } from "tesseract.js";

const ROOT = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(ROOT, "../agent/invoice_044.json");
const LEDGER_FILE = join(DATA_DIR, "ledger.json");
const OUTBOX_FILE = join(DATA_DIR, "outbox.json");

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return fallback; }
}
async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
async function fixtureInvoice() { return readJson(FIXTURE, null); }
async function requireInvoice(invoiceId) {
  const databaseInvoice = await getDatabaseInvoice(invoiceId).catch(() => null);
  if (databaseInvoice) return databaseInvoice;
  const stored = await getInvoice(invoiceId);
  if (stored) return stored;
  const fixture = await fixtureInvoice();
  if (!fixture || fixture.invoiceId !== invoiceId) throw new Error(`Invoice not found: ${invoiceId}`);
  return fixture;
}

export async function listAvailableInvoices() {
  const databaseInvoices = await listDatabaseInvoices().catch(() => []);
  if (databaseInvoices.length) return databaseInvoices;
  const stored = await listInvoices();
  if (stored.length) return stored;
  const fixture = await fixtureInvoice();
  return fixture ? [fixture] : [];
}

async function storeInvoiceDocument(invoiceId, fileName, bytes, mimeType) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  try {
    return await storagePut(`invoices/${invoiceId}/${safeName}`, bytes, mimeType);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.startsWith("Storage config missing:")) throw error;
    const localKey = `local-invoices/${invoiceId}/${safeName}`;
    const localPath = join(DATA_DIR, "uploads", invoiceId, safeName);
    await mkdir(dirname(localPath), { recursive: true });
    await writeFile(localPath, bytes);
    return { key: localKey, url: `local-storage://${localKey}` };
  }
}

function parseInvoiceText(text, confidence, sourceLabel) {
  const normalizedText = String(text || "").replace(/\s+/g, " ").trim();
  const invoiceId = normalizedText.match(/\b(INV[- ]?[A-Z0-9-]+)\b/i)?.[1]?.replace(/ /g, "-");
  const vendor = normalizedText.match(/(?:vendor|supplier|billed\s+by)\s*[:\-]\s*([^|,;]+?)(?=\s+(?:invoice|date|amount|total)\b|$)/i)?.[1]?.trim();
  const amountMatch = normalizedText.match(/(?:grand\s+total|total|amount\s+due)\s*[:\-]?\s*(?:₹|INR|USD|\$)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const date = normalizedText.match(/\b(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b/)?.[1];
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : undefined;
  if (!invoiceId || !vendor || !Number.isFinite(amount) || amount <= 0) throw new Error(`${sourceLabel} was stored but could not be confidently parsed; provide a structured invoice JSON or review the document manually.`);
  return { invoiceId, vendor, amount, currency: /(?:INR|₹)/i.test(normalizedText) ? "INR" : "USD", date, lineItems: [], confidence };
}

async function extractImageText(bytes) {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(bytes);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

async function extractDocumentFields(bytes, mimeType) {
  if (mimeType === "application/pdf") {
    const parsed = await pdfParse(bytes);
    return parseInvoiceText(parsed.text, 0.78, "PDF");
  }
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const text = await extractImageText(bytes);
    return parseInvoiceText(text, 0.72, "Image OCR");
  }
  return JSON.parse(bytes.toString("utf8"));
}

export async function registerInvoice(invoice) {
  const documentBase64 = typeof invoice.documentBase64 === "string" ? invoice.documentBase64 : "";
  const mimeType = String(invoice.mimeType || "application/json").trim().toLowerCase();
  let documentFields = {};
  let documentBytes;
  if (documentBase64) {
    const raw = documentBase64.replace(/^data:[^;]+;base64,/, "");
    documentBytes = Buffer.from(raw, "base64");
    if (!documentBytes.length || documentBytes.length > 10 * 1024 * 1024) throw new Error("Invoice document must be between 1 byte and 10 MB");
    if (!invoice.invoiceId || !invoice.vendor || invoice.amount === undefined) documentFields = await extractDocumentFields(documentBytes, mimeType);
  }
  const input = { ...documentFields, ...invoice };
  const normalized = {
    invoiceId: String(input.invoiceId || "").trim(),
    vendor: String(input.vendor || "").trim(),
    amount: Number(input.amount),
    currency: String(input.currency || "INR").trim().toUpperCase(),
    date: String(input.date || new Date().toISOString().slice(0, 10)),
    lineItems: Array.isArray(input.lineItems) ? input.lineItems : [],
    confidence: Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : undefined,
    source: input.source || input.fileName || "operator-input",
    fileName: String(input.fileName || input.source || "invoice.json").trim(),
    mimeType,
    receivedAt: new Date().toISOString(),
  };
  if (!/^INV-[A-Z0-9-]+$/i.test(normalized.invoiceId)) throw new Error("invoiceId must look like INV-044");
  if (!normalized.vendor || !Number.isFinite(normalized.amount) || normalized.amount <= 0) throw new Error("vendor and a positive amount are required");
  const existing = await getDatabaseInvoice(normalized.invoiceId).catch(() => null) || await getInvoice(normalized.invoiceId);
  if (existing) throw new Error(`Invoice ${normalized.invoiceId} already exists; duplicate upload rejected`);
  if (documentBase64) {
    const allowedTypes = new Set(["application/json", "application/pdf", "image/png", "image/jpeg"]);
    if (!allowedTypes.has(normalized.mimeType)) throw new Error("Supported invoice documents are JSON, PDF, PNG, and JPEG");
    const stored = await storeInvoiceDocument(normalized.invoiceId, normalized.fileName, documentBytes, normalized.mimeType);
    normalized.sourceKey = stored.key;
    normalized.sourceUrl = stored.url;
  }
  const saved = await saveInvoice(normalized);
  await saveDatabaseInvoice(saved).catch((error) => {
    if (process.env.DATABASE_URL) throw error;
  });
  return saved;
}

function contextInvoice(invoiceId, context) {
  if (!context || context.invoiceId !== invoiceId || typeof context.vendor !== "string" || !Number.isFinite(Number(context.amount))) return null;
  return { invoiceId, vendor: context.vendor, amount: Number(context.amount), currency: String(context.currency || "INR").toUpperCase(), date: context.date || new Date().toISOString().slice(0, 10), lineItems: Array.isArray(context.lineItems) ? context.lineItems : [], source: "signed-intent-context", fileName: context.fileName || `${invoiceId}.json` };
}

export async function readInvoice(invoiceId = "INV-044", context) {
  const invoice = contextInvoice(invoiceId, context) || await requireInvoice(invoiceId);
  return { invoiceId: invoice.invoiceId, vendor: invoice.vendor, amount: invoice.amount, currency: invoice.currency, date: invoice.date };
}

export async function extractFields(invoiceId = "INV-044", context) {
  const invoice = contextInvoice(invoiceId, context) || await requireInvoice(invoiceId);
  return { invoiceId: invoice.invoiceId, vendor: invoice.vendor, amount: invoice.amount, currency: invoice.currency, date: invoice.date, lineItems: invoice.lineItems || [], confidence: invoice.confidence ?? 1, source: invoice.source || "invoice-catalog" };
}

export async function writeRecord({ invoiceId, vendor, amount, currency = "INR", lineItems = [] }) {
  const ledger = await readJson(LEDGER_FILE, []);
  const existing = ledger.find((item) => item.invoiceId === invoiceId);
  if (existing) return { recordId: existing.recordId, store: "runtime-ledger", persisted: true, idempotent: true, writtenAt: existing.writtenAt };
  const record = { recordId: invoiceId, invoiceId, vendor, amount, currency, lineItems, writtenAt: new Date().toISOString() };
  await writeJson(LEDGER_FILE, [...ledger, record]);
  return { recordId: invoiceId, store: "runtime-ledger", persisted: true, idempotent: false, writtenAt: record.writtenAt };
}

export async function sendEmail({ recipient, invoiceId, dataScope, approved = false }) {
  const approvedRecipient = process.env.PACTLINE_APPROVED_RECIPIENT || "finance@company.test";
  if (!approved || recipient !== approvedRecipient) return { executed: false, recipient, invoiceId, dataScope, reason: "Email requires an ArmorIQ-approved decision before execution" };
  const outbox = await readJson(OUTBOX_FILE, []);
  const existing = outbox.find((item) => item.invoiceId === invoiceId && item.recipient === recipient);
  if (existing) return { executed: true, ...existing, idempotent: true };
  const message = { messageId: `msg_${Date.now()}`, recipient, invoiceId, dataScope, sentAt: new Date().toISOString(), transport: "controlled-test-outbox", idempotent: false };
  await writeJson(OUTBOX_FILE, [...outbox, message]);
  return { executed: true, ...message };
}

export async function readRuntimeEvidence() {
  return { ledger: await readJson(LEDGER_FILE, []), outbox: await readJson(OUTBOX_FILE, []) };
}
