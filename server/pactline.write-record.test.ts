import { rm } from "node:fs/promises";
import { describe, expect, it } from "vitest";
// @ts-ignore The runtime module is intentionally tested as ESM from Vitest.
import { writeRecord } from "./pactline-api/pactline-tools.mjs";

describe("Pactline write_record persistence", () => {
  it("uses the writable serverless runtime directory instead of /var/task", async () => {
    const previousVercel = process.env.VERCEL;
    const testId = `INV-TEST-${Date.now()}`;
    process.env.VERCEL = "1";
    try {
      const first = await writeRecord({ invoiceId: testId, vendor: "Regression Vendor", amount: 1, currency: "INR", lineItems: [] });
      const second = await writeRecord({ invoiceId: testId, vendor: "Regression Vendor", amount: 1, currency: "INR", lineItems: [] });
      expect(first).toMatchObject({ recordId: testId, persisted: true, idempotent: false });
      expect(second).toMatchObject({ recordId: testId, persisted: true, idempotent: true });
      expect(first.store).toBe("runtime-ledger");
    } finally {
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
      await rm(`/tmp/pactline-runtime/ledger.json`, { force: true });
    }
  });
});
