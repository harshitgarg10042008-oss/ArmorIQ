import mysql from "mysql2/promise";
import { createHash } from "node:crypto";

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

function eventHash(event, previousHash = "") {
  return createHash("sha256").update(`${previousHash}|${JSON.stringify(event)}`).digest("hex");
}

export async function saveDatabaseRun(run) {
  const pool = await getPool();
  if (!pool) return false;
  const invoiceId = run?.invoice?.id;
  if (!run?.runId || !invoiceId) return false;
  const invoice = await getDatabaseInvoice(invoiceId);
  if (!invoice) return false;
  const [invoiceRows] = await pool.query("SELECT id FROM invoices WHERE workspaceId = ? AND externalId = ? LIMIT 1", [workspaceId, invoiceId]);
  const relationalInvoiceId = invoiceRows[0]?.id;
  if (!relationalInvoiceId) return false;
  const plan = run.plan || {};
  await pool.query(
    "INSERT INTO pactlineRuns (workspaceId, invoiceId, runKey, status, planId, planHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE status = VALUES(status), planId = VALUES(planId), planHash = VALUES(planHash), updatedAt = CURRENT_TIMESTAMP",
    [workspaceId, relationalInvoiceId, run.runId, run.status || "running", plan.id || null, plan.planHash || null, new Date(run.createdAt || Date.now())],
  );
  const [runRows] = await pool.query("SELECT id FROM pactlineRuns WHERE runKey = ? LIMIT 1", [run.runId]);
  const relationalRunId = runRows[0]?.id;
  if (!relationalRunId) return false;
  const [actionRows] = await pool.query("SELECT COUNT(*) AS count FROM pactlineActions WHERE runId = ?", [relationalRunId]);
  if (Number(actionRows[0]?.count || 0) === 0) {
    for (const [index, action] of (run.actions || []).entries()) {
      await pool.query(
        "INSERT INTO pactlineActions (runId, actionKey, toolName, target, decision, reason, argumentsHash, proofReference, executed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [relationalRunId, `${run.runId}:${index + 1}`, action.name || "unknown", action.target || "unknown", action.decision || "held", action.reason || null, null, null, ["allowed", "approved", "executed"].includes(action.decision), new Date(action.timestamp || run.createdAt || Date.now())],
      );
    }
  }
  const [auditRows] = await pool.query("SELECT COUNT(*) AS count FROM pactlineAuditEvents WHERE runId = ?", [relationalRunId]);
  if (Number(auditRows[0]?.count || 0) === 0) {
    let previousHash = "";
    for (const event of run.audit || []) {
      const hash = eventHash(event, previousHash);
      await pool.query(
        "INSERT INTO pactlineAuditEvents (workspaceId, runId, actorUserId, eventType, payload, previousHash, eventHash, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [workspaceId, relationalRunId, null, event.event || "audit_event", JSON.stringify(event), previousHash || null, hash, new Date(event.timestamp || run.createdAt || Date.now())],
      );
      previousHash = hash;
    }
  }
  return true;
}
