// Root-level Vercel entrypoint for the Pactline agent.
// Keeping this entrypoint at /api/agent avoids requiring a Vercel Root Directory override.
export { default } from "../vercel-agent/api/agent.mjs";
