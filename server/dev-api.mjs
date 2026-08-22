import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth.ts";
import { appRouter } from "../server/routers.ts";
import { createContext } from "../server/_core/context.ts";
import { createRequire } from "node:module";
import runHandler from "./pactline-api/run.mjs";
import invoiceHandler from "./pactline-api/invoices.mjs";
import healthHandler from "./pactline-api/health.mjs";
import mcpHandler from "./pactline-api/mcp.mjs";
import settingsHandler from "./pactline-api/settings.mjs";
import dashboardHandler from "./pactline-api/dashboard.mjs";
import profileHandler from "./pactline-api/profile.mjs";
import notificationsHandler from "./pactline-api/notifications.mjs";
import exportHandler from "./pactline-api/export.mjs";

const require = createRequire(import.meta.url);
try {
  process.loadEnvFile?.(".env");
} catch {
  // Keep development usable when no local .env exists; handlers return safe errors.
}

const app = express();
app.use(express.json());
registerOAuthRoutes(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

function bridge(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Local API error" });
      }
    }
  };
}

app.all("/api/run", bridge(runHandler));
app.all("/api/invoices", bridge(invoiceHandler));
app.all("/api/health", bridge(healthHandler));
app.all("/api/mcp", bridge(mcpHandler));
app.all("/api/settings", bridge(settingsHandler));
app.all("/api/dashboard", bridge(dashboardHandler));
app.all("/api/profile", bridge(profileHandler));
app.all("/api/notifications", bridge(notificationsHandler));
app.all("/api/export", bridge(exportHandler));

const port = Number(process.env.PACTLINE_API_PORT || 8787);
app.listen(port, "127.0.0.1", () => {
  console.log(`Pactline local API running at http://127.0.0.1:${port}`);
});
