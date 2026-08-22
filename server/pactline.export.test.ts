import { describe, expect, it } from "vitest";
import { makeCsv, makePdf } from "./pactline-api/export.mjs";

describe("Pactline report exports", () => {
  it("escapes CSV values and includes stable headers", () => {
    const csv = makeCsv([{ runId: "run-1", comment: 'Approved, then "posted"' }]);
    expect(csv).toContain('"runId","comment"');
    expect(csv).toContain('"run-1","Approved, then ""posted"""');
  });

  it("creates a readable PDF document", () => {
    const pdf = makePdf([{ runId: "run-1", status: "held" }], "Pactline audit report");
    expect(pdf.subarray(0, 8).toString()).toBe("%PDF-1.4");
    expect(pdf.toString("binary")).toContain("Pactline audit report");
    expect(pdf.toString("binary")).toContain("%%EOF");
  });
});
