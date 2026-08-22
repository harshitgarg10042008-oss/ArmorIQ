import mysql from "mysql2/promise";

let poolPromise;
const workspaceId = Number(process.env.PACTLINE_WORKSPACE_ID || 1);

async function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!poolPromise) poolPromise = mysql.createPool(process.env.DATABASE_URL);
  return poolPromise;
}

export async function databaseConfigured() {
  return Boolean(await getPool());
}

function toInvoice(row) {
  if (!row) return null;
  let extractedData = row.extractedData;
  if (typeof extractedData === "string") {
    try { extractedData = JSON.parse(extractedData); } catch { extractedData = null; }
  }
  return {
    invoiceId: row.externalId,
    vendor: row.vendor,
    amount: Number(row.amountCents) / 100,
    currency: row.currency,
    date: extractedData?.date,
    lineItems: Array.isArray(extractedData?.lineItems) ? extractedData.lineItems : [],
    confidence: extractedData?.confidence,
    source: extractedData?.source,
    fileName: extractedData?.fileName,
    mimeType: extractedData?.mimeType,
    sourceKey: row.sourceKey,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getDatabaseInvoice(invoiceId) {
  const pool = await getPool();
  if (!pool) return null;
  const [rows] = await pool.query("SELECT * FROM invoices WHERE workspaceId = ? AND externalId = ? LIMIT 1", [workspaceId, invoiceId]);
  return toInvoice(rows[0]);
}

export async function listDatabaseInvoices() {
  const pool = await getPool();
  if (!pool) return [];
  const [rows] = await pool.query("SELECT * FROM invoices WHERE workspaceId = ? ORDER BY createdAt DESC LIMIT 100", [workspaceId]);
  return rows.map(toInvoice).filter(Boolean);
}

export async function saveDatabaseInvoice(invoice) {
  const pool = await getPool();
  if (!pool) return null;
  const extractedData = JSON.stringify({
    date: invoice.date,
    lineItems: invoice.lineItems || [],
    confidence: invoice.confidence,
    source: invoice.source,
    fileName: invoice.fileName,
    mimeType: invoice.mimeType,
  });
  await pool.query(
    "INSERT INTO invoices (workspaceId, externalId, vendor, amountCents, currency, status, sourceKey, extractedData) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE vendor = VALUES(vendor), amountCents = VALUES(amountCents), currency = VALUES(currency), sourceKey = VALUES(sourceKey), extractedData = VALUES(extractedData), updatedAt = CURRENT_TIMESTAMP",
    [workspaceId, invoice.invoiceId, invoice.vendor, Math.round(Number(invoice.amount) * 100), invoice.currency, "validated", invoice.sourceKey || null, extractedData],
  );
  return getDatabaseInvoice(invoice.invoiceId);
}
