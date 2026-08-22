import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = join(ROOT, "../agent/runtime-data");
const RUNS_FILE = join(DATA_DIR, "runs.json");
const INVOICES_FILE = join(DATA_DIR, "invoices.json");
const APPROVALS_FILE = join(DATA_DIR, "approvals.json");

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

export async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temp, file);
}

export async function listRuns() {
  return readJson(RUNS_FILE, []);
}

export async function getCurrentRun() {
  const runs = await listRuns();
  return runs[0] || null;
}

export async function saveRun(run) {
  const runs = await listRuns();
  const next = [run, ...runs.filter((item) => item.runId !== run.runId)].slice(0, 50);
  await writeJson(RUNS_FILE, next);
  return run;
}

export async function getInvoice(invoiceId) {
  const invoices = await readJson(INVOICES_FILE, []);
  return invoices.find((invoice) => invoice.invoiceId === invoiceId) || null;
}

export async function listInvoices() {
  return readJson(INVOICES_FILE, []);
}

export async function saveInvoice(invoice) {
  const invoices = await listInvoices();
  const next = [invoice, ...invoices.filter((item) => item.invoiceId !== invoice.invoiceId)];
  await writeJson(INVOICES_FILE, next);
  return invoice;
}

export async function listApprovals() {
  return readJson(APPROVALS_FILE, []);
}

export async function appendApproval(approval) {
  const approvals = await listApprovals();
  const existing = approvals.find((item) => item.idempotencyKey === approval.idempotencyKey);
  if (existing) return { approval: existing, duplicate: true };
  const record = Object.freeze({ ...approval, recordedAt: new Date().toISOString() });
  await writeJson(APPROVALS_FILE, [...approvals, record]);
  return { approval: record, duplicate: false };
}
