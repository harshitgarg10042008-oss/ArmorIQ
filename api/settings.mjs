import { getSettings, saveSettings } from "./pactline-store.mjs";
import { allowedOrigin, applySecurity, rateLimit, isPlainObject } from "./security.mjs";
import { operatorContext } from "./run.mjs";

const ALLOWED_KEYS = new Set(["workspaceName", "workspaceDescription", "approvalMode", "defaultRecipient", "retentionDays"]);

function json(res, status, body) { return res.status(status).json(body); }

export default async function handler(req, res) {
  const requestId = applySecurity(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!allowedOrigin(req)) return json(res, 403, { error: "Origin is not allowed", requestId });
  if (!rateLimit(req, res)) return;
  try {
    const auth = await operatorContext(req, req.method === "PUT");
    if (req.method === "GET") return json(res, 200, { settings: await getSettings(), actor: auth.actor, role: auth.role, requestId });
    if (req.method !== "PUT") return json(res, 405, { error: "Method not allowed", requestId });
    if (!isPlainObject(req.body)) return json(res, 400, { error: "JSON object required", requestId });
    const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => ALLOWED_KEYS.has(key)));
    if (typeof patch.workspaceName !== "undefined" && (typeof patch.workspaceName !== "string" || patch.workspaceName.length < 2 || patch.workspaceName.length > 80)) return json(res, 400, { error: "workspaceName must be 2–80 characters", requestId });
    if (typeof patch.defaultRecipient !== "undefined" && (typeof patch.defaultRecipient !== "string" || !patch.defaultRecipient.includes("@"))) return json(res, 400, { error: "defaultRecipient must be a valid email", requestId });
    if (typeof patch.retentionDays !== "undefined" && (!Number.isInteger(Number(patch.retentionDays)) || Number(patch.retentionDays) < 1 || Number(patch.retentionDays) > 3650)) return json(res, 400, { error: "retentionDays must be between 1 and 3650", requestId });
    return json(res, 200, { settings: await saveSettings(patch), actor: auth.actor, role: auth.role, requestId });
  } catch (error) { return json(res, Number(error?.statusCode) || 500, { error: error instanceof Error ? error.message : "Settings request failed", requestId }); }
}
