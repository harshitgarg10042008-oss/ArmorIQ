import mysql from "mysql2/promise";
import { getCurrentRun as getJsonCurrentRun, listRuns as listJsonRuns, resetCurrentRun as resetJsonCurrentRun, saveRun as saveJsonRun } from "./pactline-store.mjs";

const workspaceKey = process.env.PACTLINE_WORKSPACE_KEY || "finance-ops";
let poolPromise;
let databaseReady;

async function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!poolPromise) {
    poolPromise = mysql.createPool(process.env.DATABASE_URL);
  }
  return poolPromise;
}

async function isDatabaseReady() {
  if (databaseReady !== undefined) return databaseReady;
  databaseReady = (async () => {
    if (process.env.PACTLINE_RUNTIME_STORE === "json") return false;
    try {
      const pool = await getPool();
      if (!pool) return false;
      await pool.query("SELECT 1");
      return true;
    } catch (error) {
      console.warn("[RuntimeStore] Database unavailable; using JSON fallback", error instanceof Error ? error.message : "connection failed");
      return false;
    }
  })();
  return databaseReady;
}

function decodeSnapshot(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

async function listDatabaseRuns() {
  const pool = await getPool();
  if (!pool) return [];
  const [rows] = await pool.query("SELECT snapshot FROM pactlineRunSnapshots WHERE workspaceKey = ? ORDER BY createdAt DESC LIMIT 50", [workspaceKey]);
  return rows.map((row) => decodeSnapshot(row.snapshot)).filter(Boolean);
}

export async function listRuntimeRuns() {
  if (await isDatabaseReady()) {
    try { return await listDatabaseRuns(); } catch (error) { console.warn("[RuntimeStore] Read failed; using JSON fallback", error instanceof Error ? error.message : "read failed"); }
  }
  return listJsonRuns();
}

export async function getRuntimeCurrentRun() {
  const runs = await listRuntimeRuns();
  return runs[0] || null;
}

export async function saveRuntimeRun(run) {
  if (await isDatabaseReady()) {
    try {
      const pool = await getPool();
      await pool.query(
        "INSERT INTO pactlineRunSnapshots (workspaceKey, runKey, snapshot) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE snapshot = VALUES(snapshot), updatedAt = CURRENT_TIMESTAMP",
        [workspaceKey, run.runId, JSON.stringify(run)],
      );
      return run;
    } catch (error) {
      console.warn("[RuntimeStore] Write failed; using JSON fallback", error instanceof Error ? error.message : "write failed");
    }
  }
  return saveJsonRun(run);
}

export async function resetRuntimeCurrentRun() {
  if (await isDatabaseReady()) {
    try {
      const current = await getRuntimeCurrentRun();
      if (current) {
        const pool = await getPool();
        await pool.query("DELETE FROM pactlineRunSnapshots WHERE workspaceKey = ? AND runKey = ?", [workspaceKey, current.runId]);
      }
      return current;
    } catch (error) {
      console.warn("[RuntimeStore] Reset failed; using JSON fallback", error instanceof Error ? error.message : "reset failed");
    }
  }
  return resetJsonCurrentRun();
}

export function runtimeStoreMode() {
  return databaseReady === true ? "mysql" : "json-fallback";
}
