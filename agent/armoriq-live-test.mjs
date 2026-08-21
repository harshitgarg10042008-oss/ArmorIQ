import { readFile } from "node:fs/promises";
import { createPactlineSession, runAuthorizedStep, closePactlineSession } from "./armoriq-live-adapter.mjs";

const invoice = JSON.parse(await readFile(new URL("./sample-invoice.json", import.meta.url), "utf8"));
let client;
let session;
try {
  ({ client, session } = await createPactlineSession());
  const result = await runAuthorizedStep(
    session,
    { name: "read_invoice", args: { invoiceId: invoice.invoiceId, vendor: invoice.vendor, amount: invoice.amount } },
    "Process invoice and notify the approved finance recipient",
    async () => ({ invoiceId: invoice.invoiceId, vendor: invoice.vendor, amount: invoice.amount }),
  );
  console.log(JSON.stringify({ status: "sdk-smoke-test-complete", decision: result.decision, sideEffectExecuted: result.sideEffectExecuted, reason: result.reason ?? null }));
} catch (error) {
  console.error(JSON.stringify({ status: "sdk-smoke-test-failed", error: error instanceof Error ? error.message : "Unknown SDK error" }));
  process.exitCode = 1;
} finally {
  if (client && session) {
    try { await closePactlineSession(client, session); } catch { /* preserve the original result */ }
  }
}
