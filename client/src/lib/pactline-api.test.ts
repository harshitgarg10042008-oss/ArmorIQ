import { describe, expect, it } from "vitest";
import { buildStartRunPayload, resolveActiveInvoiceId } from "./pactline-api";

describe("invoice selection and start payload", () => {
  it("uses the uploaded invoice ID as the active selection", () => {
    expect(resolveActiveInvoiceId("INV-044", { invoiceId: "INV-901" })).toBe("INV-901");
    expect(resolveActiveInvoiceId("INV-901", { invoiceId: "INV-902" })).toBe("INV-902");
  });

  it("does not replace an existing selection with an empty upload response", () => {
    expect(resolveActiveInvoiceId("INV-901", { invoiceId: "" })).toBe("INV-901");
    expect(resolveActiveInvoiceId("INV-901", null)).toBe("INV-901");
  });

  it("sends the selected uploaded invoice ID and rejects an empty selection", () => {
    expect(buildStartRunPayload(" INV-901 ")).toEqual({ operation: "start", invoiceId: "INV-901" });
    expect(() => buildStartRunPayload("  ")).toThrow("Select or enter an invoice ID");
  });
});
