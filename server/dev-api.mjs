import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth.ts";
import { appRouter } from "../server/routers.ts";
import { createContext } from "../server/_core/context.ts";
import { createRequire } from "node:module";
const routeImporters = {
  run: () => import("./pactline-api/run.mjs"),
  invoices: () => import("./pactline-api/invoices.mjs"),
  health: () => import("./pactline-api/health.mjs"),
  mcp: () => import("./pactline-api/mcp.mjs"),
  settings: () => import("./pactline-api/settings.mjs"),
  dashboard: () => import("./pactline-api/dashboard.mjs"),
  profile: () => import("./pactline-api/profile.mjs"),
  notifications: () => import("./pactline-api/notifications.mjs"),
  export: () => import("./pactline-api/export.mjs"),
};
const routeCache = new Map();
async function loadRoute(name) {
  if (!routeCache.has(name)) {
    const module = await routeImporters[name]();
    if (typeof module.default !== "function") throw new Error(`Route ${name} does not export a default handler`);
    routeCache.set(name, module.default);
  }
  return routeCache.get(name);
}

const require = createRequire(import.meta.url);
try {
  process.loadEnvFile?.(".env");
} catch {
  // Keep development usable when no local .env exists; handlers return safe errors.
}

const app = express();
app.use(express.json());
app.get("/", (_req, res) => res.status(200).type("html").send("<!doctype html><title>Pactline API</title><main style=\"font-family:system-ui;max-width:680px;margin:48px auto;padding:0 20px\"><h1>Pactline API is running</h1><p>The frontend is served separately by Vite at <a href=\"http://localhost:5173/\">http://localhost:5173/</a>.</p><p>API health: <a href=\"/api/health\">/api/health</a></p></main>"));
if (process.env.OAUTH_SERVER_URL) registerOAuthRoutes(app);
else console.log("[OAuth] Local demo mode: OAuth routes disabled because OAUTH_SERVER_URL is not configured.");
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

function bridge(name) {
  return async (req, res) => {
    try {
      const handler = await loadRoute(name);
      await handler(req, res);
    } catch (error) {
      if (!res.headersSent) {
        const requestId = req.headers["x-request-id"] || `local_${Date.now().toString(36)}`;
        res.status(500).setHeader("X-Request-ID", requestId).json({ error: `Local API route ${name} could not load`, requestId });
      }
      console.error(`[Pactline] route ${name} failed to load`, error);
    }
  };
}

app.all("/api/run", bridge("run"));
app.all("/api/invoices", bridge("invoices"));
app.all("/api/health", bridge("health"));
app.all("/api/mcp", bridge("mcp"));
app.all("/api/settings", bridge("settings"));
app.all("/api/dashboard", bridge("dashboard"));
app.all("/api/profile", bridge("profile"));
app.all("/api/notifications", bridge("notifications"));
app.all("/api/export", bridge("export"));

const port = Number(process.env.PACTLINE_API_PORT || 8787);
app.listen(port, "127.0.0.1", () => {
  console.log(`Pactline local API running at http://127.0.0.1:${port}`);
});
