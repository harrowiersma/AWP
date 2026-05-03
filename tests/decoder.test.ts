import { describe, it, expect } from "vitest";
import { decode } from "../src/decoder";
import fixtures from "./fixtures/known-codes.json";

type Fixture = {
  input: string;
  source: string;
  expected: {
    valid: boolean;
    productType?: { rawCode: string; family?: string; isCastIron?: boolean };
    connectionType?: { rawCode: string; inlet?: string | null; outlet?: string | null };
    pressure?: { rawCode: string; bar?: number };
    size?: { rawCode: string; dn?: number };
    screwMaterial?: { rawCode: string; label?: string };
    bodyMaterial?: { rawCode: string; isCastIron?: boolean };
    medium?: { rawCode: string };
    handwheelCap?: { rawCode: string; valueEn?: string };
  };
};

describe("decode() — fixtures from AWP source PDFs", () => {
  for (const fx of fixtures as Fixture[]) {
    it(`${fx.input} (${fx.source})`, () => {
      const result = decode(fx.input);

      if (fx.expected.productType) {
        expect(result.fields.productType.rawCode).toBe(fx.expected.productType.rawCode);
        if (fx.expected.productType.family) {
          expect(result.fields.productType.extra?.family).toBe(fx.expected.productType.family);
        }
        if (fx.expected.productType.isCastIron !== undefined) {
          expect(result.fields.productType.extra?.isCastIron).toBe(fx.expected.productType.isCastIron);
        }
      }

      if (fx.expected.connectionType) {
        expect(result.fields.connectionType.rawCode).toBe(fx.expected.connectionType.rawCode);
        if (fx.expected.connectionType.inlet) {
          expect((result.fields.connectionType.extra as { inlet?: string } | undefined)?.inlet).toBe(
            fx.expected.connectionType.inlet
          );
        }
      }

      if (fx.expected.pressure) {
        expect(result.fields.pressure.rawCode).toBe(fx.expected.pressure.rawCode);
        if (fx.expected.pressure.bar !== undefined) {
          expect((result.fields.pressure.extra as { bar?: number } | undefined)?.bar).toBe(
            fx.expected.pressure.bar
          );
        }
      }

      if (fx.expected.size) {
        expect(result.fields.size.rawCode).toBe(fx.expected.size.rawCode);
        if (fx.expected.size.dn !== undefined) {
          expect((result.fields.size.extra as { dn?: number } | undefined)?.dn).toBe(
            fx.expected.size.dn
          );
        }
      }

      if (fx.expected.screwMaterial) {
        expect(result.fields.screwMaterial.rawCode).toBe(fx.expected.screwMaterial.rawCode);
        if (fx.expected.screwMaterial.label) {
          expect(result.fields.screwMaterial.valueDe).toBe(fx.expected.screwMaterial.label);
        }
      }

      if (fx.expected.bodyMaterial) {
        expect(result.fields.bodyMaterial.rawCode).toBe(fx.expected.bodyMaterial.rawCode);
        if (fx.expected.bodyMaterial.isCastIron !== undefined) {
          expect((result.fields.bodyMaterial.extra as { isCastIron?: boolean } | undefined)?.isCastIron).toBe(
            fx.expected.bodyMaterial.isCastIron
          );
        }
      }

      if (fx.expected.medium) {
        expect(result.fields.medium.rawCode).toBe(fx.expected.medium.rawCode);
        expect(result.fields.medium.found).toBe(true);
      }

      if (fx.expected.handwheelCap) {
        expect(result.fields.handwheelCap.rawCode).toBe(fx.expected.handwheelCap.rawCode);
        if (fx.expected.handwheelCap.valueEn) {
          expect(result.fields.handwheelCap.valueEn).toBe(fx.expected.handwheelCap.valueEn);
        }
      }
    });
  }
});

describe("decode() — error handling", () => {
  it("rejects empty input", () => {
    const r = decode("");
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("rejects too-short input", () => {
    const r = decode("123");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/at least 16/);
  });

  it("normalizes whitespace and lowercase", () => {
    const r = decode("  24020c14a5a30100  ");
    expect(r.normalized).toBe("24020C14A5A30100");
    expect(r.fields.productType.rawCode).toBe("240");
  });

  it("flags unknown codes without throwing", () => {
    const r = decode("99999X99X9X90000");
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.fields.productType.found).toBe(false);
  });

  it("decodes the cast-iron variant 26G correctly", () => {
    const r = decode("26G00C15A5A30000");
    expect(r.fields.productType.found).toBe(true);
    expect(r.fields.productType.extra?.isCastIron).toBe(true);
    expect(r.fields.bodyMaterial.extra?.isCastIron).toBe(true);
    expect(r.warnings.some((w) => /[Cc]ast iron|Gusseisen/.test(w))).toBe(true);
  });

  it("strips SAP-style separator dots", () => {
    const r = decode("26300.00.C19A5A30000");
    expect(r.normalized).toBe("2630000C19A5A30000");
    expect(r.fields.productType.rawCode).toBe("263");
    expect(r.fields.connectionType.rawCode).toBe("00");
  });
});

describe("decode() — Phase 2: Pos 13-16 connection details", () => {
  it("decodes welding-end standard 0000 for AVR with Pos 4-5 = 00", () => {
    const r = decode("26300C19A5A30000");
    expect(r.fields.connectionDetails.found).toBe(true);
    expect(r.fields.connectionDetails.valueEn).toMatch(/welding end range 1/);
  });

  it("decodes ANSI Schedule 40 (1100) for welding ends", () => {
    const r = decode("26300C19A5A31100");
    expect(r.fields.connectionDetails.found).toBe(true);
    expect(r.fields.connectionDetails.valueEn).toMatch(/ANSI Schedule 40/);
  });

  it("decodes DIN flange (0000) when Pos 4-5 = 20", () => {
    const r = decode("26320C19A5A30000");
    expect(r.fields.connectionDetails.found).toBe(true);
    expect(r.fields.connectionDetails.valueEn).toMatch(/DIN flange/);
  });

  it("decodes ANSI 150 lbs flange (8800)", () => {
    const r = decode("26320C19A5A38800");
    expect(r.fields.connectionDetails.found).toBe(true);
    expect(r.fields.connectionDetails.valueEn).toMatch(/ANSI 150 lbs/);
  });

  it("falls back to 'request from AWP' for undocumented details", () => {
    const r = decode("26300C19A5A39999");
    expect(r.fields.connectionDetails.found).toBe(false);
    expect(r.fields.connectionDetails.valueEn).toMatch(/request from AWP/);
  });
});

describe("decode() — Phase 2: SonderKürzel suffixes", () => {
  it("decodes RM (RMRS approval)", () => {
    const r = decode("26300C19A5A30000RM");
    expect(r.fields.suffix.found).toBe(true);
    expect(r.fields.suffix.valueEn).toMatch(/Russian Maritime Register/);
    expect(r.fields.suffix.extra?.matched).toBe("RM");
    expect(r.fields.suffix.extra?.addedCodes).toBe("+9200+9311+9312");
  });

  it("matches longer suffixes first (RMRS not RM)", () => {
    const r = decode("26300C19A5A30000RMRS");
    expect(r.fields.suffix.extra?.matched).toBe("RMRS");
  });

  it("decodes TÜV with Unicode characters", () => {
    const r = decode("26300C19A5A30000TÜV");
    expect(r.fields.suffix.extra?.matched).toBe("TÜV");
    expect(r.fields.suffix.extra?.addedCodes).toBe("+9202");
  });

  it("returns '(none)' when no suffix is present", () => {
    const r = decode("24020C14A5A30100");
    expect(r.fields.suffix.found).toBe(true);
    expect(r.fields.suffix.valueEn).toBe("(none)");
    expect(r.fields.suffix.rawCode).toBe("");
  });

  it("flags an unknown suffix as a warning, not an error", () => {
    const r = decode("24020C14A5A30100ZZZ");
    expect(r.fields.suffix.found).toBe(false);
    expect(r.warnings.some((w) => /Unknown suffix/.test(w))).toBe(true);
    expect(r.errors).toEqual([]);
  });
});

describe("decode() — Phase 3: HRS family codes", () => {
  it("decodes 025 as HRS globe type", () => {
    const r = decode("02560D10A5A30000");
    expect(r.fields.productType.found).toBe(true);
    expect(r.fields.productType.extra?.family).toBe("HRS");
    expect(r.fields.productType.valueEn).toMatch(/HRS - hand regulating valve, globe/);
  });

  it("decodes 02K as HRSN needle valve", () => {
    const r = decode("02K60D10A5A30000");
    expect(r.fields.productType.extra?.family).toBe("HRSN");
  });

  it("decodes flange-kit prefix 152", () => {
    const r = decode("15252D10A5A30000");
    expect(r.fields.productType.extra?.family).toBe("FlangeKit");
  });
});

describe("decode() — Phase 3: DGL pressure-gas-line sub-system", () => {
  it("decodes the canonical DGL example 01884.15.5/00R11", () => {
    const r = decode("01884.15.5/00R11");
    expect(r.valid).toBe(true);
    expect(r.fields.productType.extra?.family).toBe("DGL");
    expect(r.fields.connectionType.valueEn).toMatch(/Welding ends to the AVR/);
    expect((r.fields.size.extra as { dn?: number })?.dn).toBe(50);
    expect(r.fields.bodyMaterial.valueEn).toMatch(/St \(steel\)/);
    expect(r.fields.connectionDetails.valueEn).toMatch(/R11/);
  });

  it("DGL with size DN200 NIRO", () => {
    const r = decode("01884.23.8/9AR35");
    expect(r.valid).toBe(true);
    expect((r.fields.size.extra as { dn?: number })?.dn).toBe(200);
    expect(r.fields.bodyMaterial.valueEn).toMatch(/NIRO/);
  });
});

describe("decode() — Phase 3: BS-Kit burst-disc sub-system", () => {
  it("decodes the canonical BS-Kit example 44201.10.5/xx001", () => {
    const r = decode("44201.10.5/xx001");
    expect(r.valid).toBe(true);
    expect(r.fields.productType.extra?.family).toBe("BS-Kit");
    expect(r.fields.bodyMaterial.valueEn).toMatch(/carbon steel/);
    expect(r.fields.handwheelCap.valueEn).toMatch(/to be specified/);
    expect((r.fields.connectionDetails.extra as { tolerance?: string })?.tolerance).toBe("±10%");
  });

  it("decodes 44201.10.5/12501 — burst pressure encoded numerically", () => {
    const r = decode("44201.10.5/12501");
    expect(r.valid).toBe(true);
    // Burst pressure parses as the leading digits — exact bar value depends on
    // unit convention which varies in the source data; we just require that the
    // numeric burst-pressure parsing succeeded.
    expect(r.fields.handwheelCap.found).toBe(true);
    expect(r.fields.handwheelCap.rawCode).toBe("12");
  });

  it("decodes 44201.10.8/xx011 — NIRO PS40 with ±5% tolerance", () => {
    const r = decode("44201.10.8/xx011");
    expect(r.fields.bodyMaterial.valueEn).toMatch(/stainless/);
    expect((r.fields.connectionDetails.extra as { tolerance?: string })?.tolerance).toBe("±5%");
  });

  it("decodes 44202.10.5/xx001 — screwed burst disc", () => {
    const r = decode("44202.10.5/xx001");
    expect(r.fields.productType.valueEn).toMatch(/Screwed burst disc/);
  });
});
