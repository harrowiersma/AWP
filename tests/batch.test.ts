import { describe, it, expect } from "vitest";
import { detectCodeColumn, processRows, decodedToColumns } from "../src/batch/pipeline";
import { decode } from "../src/decoder";

describe("batch pipeline", () => {
  it("detects standard material-number headers", () => {
    expect(detectCodeColumn(["Description", "Material", "Qty"])).toBe(1);
    expect(detectCodeColumn(["materialnummer", "menge"])).toBe(0);
    expect(detectCodeColumn(["A", "B", "Speaking Number"])).toBe(2);
  });

  it("returns -1 when no header matches", () => {
    expect(detectCodeColumn(["foo", "bar", "baz"])).toBe(-1);
  });

  it("decodes rows and appends decoded columns", () => {
    const rows = [
      { Material: "24020C14A5A30100", Qty: "5" },
      { Material: "26G00C15A5A30000", Qty: "1" },
    ];
    const out = processRows(rows, "Material");
    expect(out).toHaveLength(2);
    expect(out[0].decoded_pressure).toContain("PS 25");
    expect(out[0].decoded_size).toContain("DN 40");
    expect(out[1].decoded_product_type).toContain("AVR");
    expect(out[1].decode_warnings).toMatch(/[Cc]ast iron|Gusseisen/);
  });

  it("handles empty material cells without error", () => {
    const out = processRows([{ Material: "", Other: "x" }], "Material");
    expect(out[0].decoded_product_type).toBe("");
  });

  it("decodedToColumns maps every appended column", () => {
    const d = decode("24020C14A5A30100");
    const cols = decodedToColumns(d);
    expect(cols.decoded_product_type).toContain("WVR");
    expect(cols.decoded_connection_type).toContain("flange");
    expect(cols.decoded_pressure).toContain("PS 25");
    expect(cols.decoded_size).toContain("DN 40");
    expect(cols.decoded_handwheel_cap).toContain("cap");
  });
});
