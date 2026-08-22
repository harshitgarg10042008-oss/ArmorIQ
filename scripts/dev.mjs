import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const children = [
  spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["vite", "--host"], { cwd: root, stdio: "inherit", env: process.env, shell: true }),
];
let apiChild;
const apiTimer = setTimeout(() => {
  apiChild = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["tsx", "server/dev-api.mjs"], { cwd: root, stdio: "inherit", env: process.env, shell: true });
  children.push(apiChild);
  apiChild.on("exit", (code, signal) => {
    if (signal !== "SIGTERM") shutdown(code ?? 1);
  });
}, 1200);

const shutdown = (code = 0) => {
  clearTimeout(apiTimer);
  for (const child of children) child.kill("SIGTERM");
  if (apiChild && !children.includes(apiChild)) apiChild.kill("SIGTERM");
  process.exit(code);
};

children[0].on("exit", (code, signal) => {
  if (signal !== "SIGTERM") shutdown(code ?? 1);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
