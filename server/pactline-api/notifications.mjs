import { getNotificationPreferences, saveNotificationPreferences } from "./pactline-store.mjs";
import { allowedOrigin, applySecurity, isPlainObject, rateLimit } from "./security.mjs";
import { operatorContext } from "./run.mjs";
function json(res, status, body) { return res.status(status).json(body); }
const KEYS = ["approvalHolds", "runFailures", "weeklyDigest"];
export default async function handler(req, res) {
  const requestId = applySecurity(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!allowedOrigin(req)) return json(res, 403, { error: "Origin is not allowed", requestId });
  if (!rateLimit(req, res)) return;
  try {
    const auth = await operatorContext(req, false);
    if (req.method === "GET") return json(res, 200, { preferences: await getNotificationPreferences(), actor: auth.actor, requestId });
    if (req.method !== "PUT" || !isPlainObject(req.body)) return json(res, 400, { error: "PUT with a JSON object required", requestId });
    const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => KEYS.includes(key)));
    if (Object.values(patch).some((value) => typeof value !== "boolean")) return json(res, 400, { error: "Notification preferences must be boolean values", requestId });
    return json(res, 200, { preferences: await saveNotificationPreferences(patch), actor: auth.actor, requestId });
  } catch (error) { return json(res, Number(error?.statusCode) || 500, { error: error instanceof Error ? error.message : "Notification preferences request failed", requestId }); }
}
