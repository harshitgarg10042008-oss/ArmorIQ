import { readFile } from "node:fs/promises";
import { createPactlineClient, captureInvoiceIntent, invokeAuthorized } from "./armoriq-live-adapter.mjs";

const invoice = JSON.parse(await readFile(new URL("./sample-invoice.json", import.meta.url), "utf8"));

try {
  const { client, userEmail, mcpName } = await createPactlineClient();
  const { token } = await captureInvoiceIntent(
    client,
    invoice.invoiceId,
    "Process this invoice and notify the approved finance recipient",
    process.env.PACTLINE_TEST_RECIPIENT || "external-review@protonmail.test",
  );
  const result = await invokeAuthorized(
    client,
    mcpName,
    "read_invoice",
    token,
    { invoiceId: invoice.invoiceId },
    userEmail,
  );
  console.log(JSON.stringify({
    status: "sdk-smoke-test-complete",
    decision: result?.decision ?? result?.status ?? "unknown",
    sideEffectExecuted: Boolean(result?.sideEffectExecuted),
    reason: result?.reason ?? null,
  }));
} catch (error) {
  console.error(JSON.stringify({
    status: "sdk-smoke-test-failed",
    error: error instanceof Error ? error.message : "Unknown SDK error",
  }));
  process.exitCode = 1;
}

// This runner intentionally does not print the API key, email, token, or full SDK response.
