import { getCurrentRun, listApprovals, listRuns, getSettings } from "./pactline-store.mjs";
import { getMetrics } from "./metrics.mjs";
import { allowedOrigin, applySecurity, rateLimit } from "./security.mjs";
import { operatorContext } from "./run.mjs";
function json(res, status, body) { return res.status(status).json(body); }
export default async function handler(req, res) {
  const requestId = applySecurity(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!allowedOrigin(req)) return json(res, 403, { error: "Origin is not allowed", requestId });
  if (!rateLimit(req, res)) return;
  try {
    const auth = await operatorContext(req, false);
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed", requestId });
    const [currentRun, runs, approvals, settings] = await Promise.all([getCurrentRun(), listRuns(), listApprovals(), getSettings()]);
    return json(res, 200, { currentRun, runs: runs.slice(0, 20), approvals: approvals.slice(-50).reverse(), settings, metrics: getMetrics(), actor: auth.actor, role: auth.role, requestId });
  } catch (error) { return json(res, Number(error?.statusCode) || 500, { error: error instanceof Error ? error.message : "Dashboard request failed", requestId }); }
}
