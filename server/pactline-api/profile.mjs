import { getProfile, saveProfile } from "./pactline-store.mjs";
import { allowedOrigin, applySecurity, isPlainObject, rateLimit } from "./security.mjs";
import { operatorContext } from "./run.mjs";
function json(res, status, body) { return res.status(status).json(body); }
export default async function handler(req, res) {
  const requestId = applySecurity(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!allowedOrigin(req)) return json(res, 403, { error: "Origin is not allowed", requestId });
  if (!rateLimit(req, res)) return;
  try {
    const auth = await operatorContext(req, false);
    if (req.method === "GET") return json(res, 200, { profile: await getProfile(), actor: auth.actor, requestId });
    if (req.method !== "PUT" || !isPlainObject(req.body)) return json(res, 400, { error: "PUT with a JSON object required", requestId });
    const patch = req.body;
    if (patch.displayName !== undefined && (typeof patch.displayName !== "string" || patch.displayName.trim().length < 2 || patch.displayName.length > 80)) return json(res, 400, { error: "displayName must be 2–80 characters", requestId });
    if (patch.initials !== undefined && (typeof patch.initials !== "string" || !/^[a-z0-9]{1,4}$/i.test(patch.initials))) return json(res, 400, { error: "initials must contain 1–4 letters or numbers", requestId });
    if (patch.avatarColor !== undefined && !["mint", "cobalt", "violet", "amber"].includes(patch.avatarColor)) return json(res, 400, { error: "avatarColor is not supported", requestId });
    return json(res, 200, { profile: await saveProfile({ displayName: patch.displayName?.trim(), initials: patch.initials?.toUpperCase(), avatarColor: patch.avatarColor }), actor: auth.actor, requestId });
  } catch (error) { return json(res, Number(error?.statusCode) || 500, { error: error instanceof Error ? error.message : "Profile request failed", requestId }); }
}
