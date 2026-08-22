import { applySecurity, allowedOrigin, rateLimit } from "./security.mjs";
import { snapshot } from "./metrics.mjs";

export default async function handler(req, res) {
  applySecurity(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!allowedOrigin(req)) return res.status(403).json({ error: "Origin is not allowed" });
  if (!rateLimit(req, res, 30)) return;
  const checks = {
    armorIqApiKey: Boolean(process.env.ARMORIQ_API_KEY),
    armorIqUser: Boolean(process.env.USER_EMAIL),
    mcpName: process.env.ARMORIQ_MCP_NAME || "pactline-invoice",
    operatorAuth: Boolean(process.env.PACTLINE_OPERATOR_TOKEN),
    storageMode: "durable-runtime-store",
  };
  const ready = checks.armorIqApiKey && checks.armorIqUser;
  return res.status(ready ? 200 : 503).json({ service: "pactline-control", status: ready ? "ready" : "configuration-required", checks, metrics: snapshot(), timestamp: new Date().toISOString() });
}
