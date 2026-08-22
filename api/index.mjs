const routeLoaders = new Map([
  ["/agent", () => import("../server/pactline-api/agent.mjs")],
  ["/dashboard", () => import("../server/pactline-api/dashboard.mjs")],
  ["/export", () => import("../server/pactline-api/export.mjs")],
  ["/health", () => import("../server/pactline-api/health.mjs")],
  ["/invoices", () => import("../server/pactline-api/invoices.mjs")],
  ["/mcp", () => import("../server/pactline-api/mcp.mjs")],
  ["/metrics", () => import("../server/pactline-api/metrics.mjs")],
  ["/notifications", () => import("../server/pactline-api/notifications.mjs")],
  ["/profile", () => import("../server/pactline-api/profile.mjs")],
  ["/run", () => import("../server/pactline-api/run.mjs")],
  ["/settings", () => import("../server/pactline-api/settings.mjs")],
]);

export default async function handler(req, res) {
  const requested = String(req.query?.route || new URL(req.url || "/", "http://localhost").pathname).replace(/\/$/, "") || "/";
  const route = requested.startsWith("/api/") ? requested.slice(4) : requested;
  const loadRoute = routeLoaders.get(route);
  if (!loadRoute) return res.status(404).json({ error: "Pactline API route not found", route });

  try {
    const module = await loadRoute();
    const routeHandler = module.default;
    if (typeof routeHandler !== "function") {
      return res.status(500).json({ error: "Pactline API route is not callable", route });
    }
    return await routeHandler(req, res);
  } catch (error) {
    console.error("[Pactline] route load failure", { route, error: error instanceof Error ? error.message : String(error) });
    return res.status(502).json({
      error: "Pactline API route could not be loaded",
      route,
      detail: error instanceof Error ? error.message : "Unknown route loading error",
    });
  }
}
