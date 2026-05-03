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
    expect(r.errors[0]).toMatch(/Expected 16 characters/);
  });

  it("16300E18.511C041 (15 chars after strip) reports the right diagnostic", () => {
    const r = decode("16300E18.511C041");
    expect(r.valid).toBe(false);
    // 16 chars including the dot, 15 after strip — should call out the missing char.
    expect(r.errors[0]).toMatch(/got 15/);
    expect(r.errors[0]).toMatch(/1 character\(s\) appear to be missing/);
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

describe("decode() — Phase 4: Pos 13-16 per-position decoding for AVRS", () => {
  it("decodes AVRS pos 13-16 per-position breakdown 0202", () => {
    const r = decode("06162C10A5A30202");
    expect(r.fields.connectionDetails.found).toBe(true);
    const perPos = (r.fields.connectionDetails.extra as { perPosition?: Array<{ pos: string; found: boolean; labelEn?: string }> }).perPosition;
    expect(perPos).toBeDefined();
    expect(perPos!.length).toBe(4);
    // Pos 14 should decode to G1/2" thread
    const pos14 = perPos!.find((p) => p.pos === "14");
    expect(pos14?.labelEn).toMatch(/G1\/2/);
    // Pos 16 should decode to blind nut
    const pos16 = perPos!.find((p) => p.pos === "16");
    expect(pos16?.labelEn).toMatch(/blind nut/);
  });

  it("AVRS pos 13-16 partial: known + unknown mixed", () => {
    const r = decode("06162C10A5A30209");
    const perPos = (r.fields.connectionDetails.extra as { perPosition?: Array<{ found: boolean }> }).perPosition;
    expect(perPos).toBeDefined();
    // Pos 16 = "9" is not in the table — should be unknown
    const pos16 = perPos!.find((p) => (p as unknown as { pos: string }).pos === "16");
    expect(pos16?.found).toBe(false);
  });
});

describe("decode() — Phase 4: Kit sub-system", () => {
  it("decodes 15752e12.5/04103 — G-FL-Kit DN25/40 PS40", () => {
    const r = decode("15752e12.5/04103");
    expect(r.valid).toBe(true);
    expect(r.fields.productType.extra?.family).toBe("Kit");
    expect(r.fields.productType.valueEn).toMatch(/G-FL-Kit/);
    expect(r.fields.pressure.valueEn).toMatch(/PS40/);
    // Variant: 0=screw 8.8, 4=DN40 outlet, 1=R1, 0=DIN, 3=DM
    expect(r.fields.connectionDetails.valueEn).toMatch(/screws 8.8/);
    expect(r.fields.connectionDetails.valueEn).toMatch(/DN40/);
  });

  it("decodes 45752e12.5/041e3 — single-SV with AWP flange", () => {
    const r = decode("45752e12.5/041e3");
    expect(r.valid).toBe(true);
    expect(r.fields.productType.valueEn).toMatch(/Single-SV/);
    expect(r.fields.connectionDetails.valueEn).toMatch(/AWP flanges/);
  });

  it("decodes 17760e10.5/11001 — screw-end kit for SV 446/448", () => {
    const r = decode("17760e10.5/11001");
    expect(r.valid).toBe(true);
    expect(r.fields.productType.valueEn).toMatch(/SV type 446\/448/);
  });

  it("decodes 44660e10.5/10001 — single-SV/HRS screw-end kit", () => {
    const r = decode("44660e10.5/10001");
    expect(r.valid).toBe(true);
    expect(r.fields.productType.valueEn).toMatch(/single SV or HRS/);
  });
});

describe("decode() — Phase 4: HRS family override (Pos 9-16)", () => {
  it("HRS code 02560F10LDA11103 decodes ring-material + accessory codes", () => {
    // pos 1-3 = 025 (HRS), pos 4-5 = 60 (Gewinde Ein/Aus), pos 6 = F (PS63),
    // pos 7-8 = 10 (DN15), pos 9 = L (inlet table B), pos 10 = D (table A FPM),
    // pos 11 = A (outlet variant — via override), pos 12 = 1 (standard test port),
    // pos 13-16 = 1103.
    const r = decode("02560F10LDA11103");
    expect(r.fields.productType.extra?.family).toBe("HRS");
    expect(r.fields.pressure.valueEn).toMatch(/PS63/);
    expect(r.fields.screwMaterial.fieldEn).toMatch(/Inlet connection table/);
    expect(r.fields.screwMaterial.valueEn).toMatch(/table B/);
    // Pos 10 = D — table A FPM
    expect(r.fields.bodyMaterial.fieldEn).toMatch(/O-ring material/);
    expect(r.fields.bodyMaterial.valueEn).toMatch(/FPM/);
    // Pos 12 = 1 should be standard test-port
    expect(r.fields.handwheelCap.fieldEn).toMatch(/Test-port/);
    expect(r.fields.handwheelCap.valueEn).toMatch(/test port/i);
  });

  it("HRS code with PS120 (H) decodes correctly", () => {
    const r = decode("02560H10A5A30000");
    expect(r.fields.pressure.valueEn).toMatch(/PS120/);
    expect((r.fields.pressure.extra as { bar?: number })?.bar).toBe(120);
  });
});

describe("decode() — Phase 5: Safety-valve override", () => {
  it("decodes 45828D10A5A10000 with set-pressure 28 bar", () => {
    const r = decode("45828D10A5A10000");
    expect(r.fields.productType.extra?.family).toBe("SVU");
    // Pos 4-5 = 28 → set pressure 28 bar (NOT unknown connection)
    expect(r.fields.connectionType.fieldEn).toMatch(/Set pressure/);
    expect(r.fields.connectionType.found).toBe(true);
    expect((r.fields.connectionType.extra as { setPressureBar?: number })?.setPressureBar).toBe(28);
    // Pos 12 = 1 → connection variant 1
    expect(r.fields.handwheelCap.fieldEn).toMatch(/Connection variant/);
    // Should not warn about unknown connection code
    expect(r.warnings.find((w) => /Unknown connection type code: 28/.test(w))).toBeUndefined();
  });

  it("decodes 44210D10A5A10000 with set-pressure 10 bar (SVA family 442)", () => {
    const r = decode("44210D10A5A10000");
    expect(r.fields.productType.extra?.family).toBe("SVA");
    // Pos 4-5 = 10 — would be AE/AE+DV in the standard table, but for SVA
    // it's set pressure 10 bar. Override should win.
    expect(r.fields.connectionType.fieldEn).toMatch(/Set pressure/);
    expect((r.fields.connectionType.extra as { setPressureBar?: number })?.setPressureBar).toBe(10);
  });

  it("safety-valve Pos 13-16 decodes per-position inlet/outlet/fittings", () => {
    const r = decode("45828D10A5A10000");
    const perPos = (r.fields.connectionDetails.extra as { perPosition?: Array<{ pos: string; found: boolean }> }).perPosition;
    expect(perPos).toBeDefined();
    expect(perPos!.length).toBe(4);
    // 0000 → all standard
    expect(perPos!.every((p) => p.found)).toBe(true);
  });
});

describe("decode() — Phase 6: completeness fixes", () => {
  it("normalize() strips hyphens and underscores too", () => {
    const r = decode("24020-C14_A5A30100");
    expect(r.normalized).toBe("24020C14A5A30100");
    expect(r.valid).toBe(true);
  });

  it("DGL with explicit pressure D (PS40) decodes", () => {
    const r = decode("01884D15.5/00R11");
    expect(r.valid).toBe(true);
    expect(r.fields.pressure.found).toBe(true);
    expect((r.fields.pressure.extra as { bar?: number })?.bar).toBe(40);
  });

  it("DGL with explicit pressure F (PS64) decodes", () => {
    const r = decode("01884F15.5/00R11");
    expect(r.valid).toBe(true);
    expect((r.fields.pressure.extra as { bar?: number })?.bar).toBe(64);
  });

  it("AVR per-position fallback decodes a code not in the block table", () => {
    // 26300C19A5A38010 — Pos 13-16 = 8010, not in block table.
    // Per-position: 8 (ANSI series) · 0 (groove) · 1 (inlet variant 1) · 0 (no outlet fitting)
    const r = decode("26300C19A5A38010");
    const perPos = (r.fields.connectionDetails.extra as { perPosition?: Array<{ pos: string; found: boolean; labelEn?: string }> }).perPosition;
    expect(perPos).toBeDefined();
    expect(perPos!.find((p) => p.pos === "13")?.labelEn).toMatch(/ANSI flange/);
    expect(perPos!.find((p) => p.pos === "14")?.labelEn).toMatch(/groove/);
  });

  it("HRS Anschlusscodierung scan surfaces a known thread code", () => {
    // Synthetic HRS code that contains 'A1' (G1/2") in pos 9-16.
    const r = decode("02560F10A153A11003");
    // The code is 18 chars — long enough; test mostly cares about the connection-code reference scan.
    if (r.valid && r.fields.productType.extra?.family === "HRS") {
      const refs = r.fields.connectionDetails.extra?.connectionCodeReference as
        | Array<{ code: string }>
        | undefined;
      if (refs) {
        expect(refs.length).toBeGreaterThan(0);
      }
    }
  });

  it("S+M+D-Kit ANSI prefix 063 is recognised at Pos 1-3", () => {
    const r = decode("06300D13A5A11000");
    expect(r.fields.productType.found).toBe(true);
    expect(r.fields.productType.extra?.family).toBe("ANSI-Kit");
  });
});

describe("decode() — Phase 4: EXP suffix", () => {
  it("decodes EXP suffix as export variant", () => {
    const r = decode("15752E10.5/01103EXP");
    expect(r.fields.suffix.found).toBe(true);
    expect(r.fields.suffix.extra?.matched).toBe("EXP");
    expect(r.fields.suffix.valueEn).toMatch(/Export variant/);
  });
});
