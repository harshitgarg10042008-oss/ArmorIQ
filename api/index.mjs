import agentHandler from "../server/pactline-api/agent.mjs";
import dashboardHandler from "../server/pactline-api/dashboard.mjs";
import exportHandler from "../server/pactline-api/export.mjs";
import healthHandler from "../server/pactline-api/health.mjs";
import invoicesHandler from "../server/pactline-api/invoices.mjs";
import mcpHandler from "../server/pactline-api/mcp.mjs";
import metricsHandler from "../server/pactline-api/metrics.mjs";
import notificationsHandler from "../server/pactline-api/notifications.mjs";
import profileHandler from "../server/pactline-api/profile.mjs";
import runHandler from "../server/pactline-api/run.mjs";
import settingsHandler from "../server/pactline-api/settings.mjs";

const routes = new Map([
  ["/agent", agentHandler],
  ["/dashboard", dashboardHandler],
  ["/export", exportHandler],
  ["/health", healthHandler],
  ["/invoices", invoicesHandler],
  ["/mcp", mcpHandler],
  ["/metrics", metricsHandler],
  ["/notifications", notificationsHandler],
  ["/profile", profileHandler],
  ["/run", runHandler],
  ["/settings", settingsHandler],
]);

export default async function handler(req, res) {
  const requested = String(req.query?.route || new URL(req.url || "/", "http://localhost").pathname).replace(/\/$/, "") || "/";
  const route = requested.startsWith("/api/") ? requested.slice(4) : requested;
  const target = routes.get(route);
  if (!target) return res.status(404).json({ error: "Pactline API route not found", route });
  return target(req, res);
}
