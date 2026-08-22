import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const node = process.execPath;
const apiScript = path.join(root, "server", "dev-api.mjs");
const envFile = path.join(root, ".env");
const tsxScript = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const viteScript = path.join(root, "node_modules", "vite", "bin", "vite.js");
const children = [];
let shuttingDown = false;

function start(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: "inherit", env: process.env, windowsHide: false });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 150);
}

async function isApiReady() {
  try {
    const response = await fetch(`http://127.0.0.1:${process.env.PACTLINE_API_PORT || 8787}/api/health`);
    return response.status >= 100 && response.status < 600;
  } catch { return false; }
}
async function waitForApi() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await isApiReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Pactline API did not become ready within 15 seconds");
}

let apiChild;
try {
  if (!(await isApiReady())) {
    const apiArgs = fs.existsSync(envFile) ? ["--env-file=.env", tsxScript, apiScript] : [tsxScript, apiScript];
    apiChild = start(node, apiArgs);
    apiChild.on("exit", (code, signal) => { if (!shuttingDown && signal !== "SIGTERM") shutdown(code ?? 1); });
    await waitForApi();
  }

  const viteChild = start(node, [viteScript, "--host"]);
  viteChild.on("exit", (code, signal) => { if (!shuttingDown && signal !== "SIGTERM") shutdown(code ?? 1); });
} catch (error) {
  console.error(`[Pactline] ${error instanceof Error ? error.message : "API startup failed"}`);
  shutdown(1);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
