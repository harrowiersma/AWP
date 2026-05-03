import svData from "@data/lookups/safety-valves.json";
import type { FieldResult } from "../types";

const data = svData as unknown as {
  appliesToFamilies: string[];
  appliesToPos1to3Prefixes: string[];
  pos12_connectionVariants: {
    values: Record<string, { labelDe: string; labelEn: string }>;
  };
  pos1316_inletOutletAccessories: {
    pos13_inlet: Record<string, { labelDe: string; labelEn: string }>;
    pos14_outlet: Record<string, { labelDe: string; labelEn: string }>;
    pos15_inletFittings: Record<string, { labelDe: string; labelEn: string }>;
    pos16_outletFittings: Record<string, { labelDe: string; labelEn: string }>;
  };
};

export function isSafetyValveFamily(
  family: string | undefined,
  pos1to3: string
): boolean {
  if (family && data.appliesToFamilies.includes(family)) return true;
  return data.appliesToPos1to3Prefixes.some((p) => pos1to3.startsWith(p));
}

function setPressureField(
  base: FieldResult,
  rawCode: string
): FieldResult {
  // Interpret as numeric bar value (most safety-valve set pressures are direct).
  const num = Number.parseInt(rawCode, 10);
  if (!Number.isNaN(num)) {
    return {
      ...base,
      fieldDe: "Einstelldruck",
      fieldEn: "Set pressure",
      found: true,
      valueDe: `Einstelldruck ${num} bar (Code ${rawCode})`,
      valueEn: `set pressure ${num} bar (code ${rawCode})`,
      extra: { setPressureBar: num, raw: rawCode },
    };
  }
  return {
    ...base,
    fieldDe: "Einstelldruck",
    fieldEn: "Set pressure",
    found: false,
    valueDe: `Einstelldruck-Code ${rawCode} (nicht numerisch)`,
    valueEn: `set pressure code ${rawCode} (non-numeric)`,
    extra: { raw: rawCode },
  };
}

function connectionVariantField(
  base: FieldResult,
  rawCode: string
): FieldResult {
  const entry = data.pos12_connectionVariants.values[rawCode];
  if (entry) {
    return {
      ...base,
      fieldDe: "Anschlussvariante",
      fieldEn: "Connection variant",
      found: true,
      valueDe: entry.labelDe,
      valueEn: entry.labelEn,
    };
  }
  return {
    ...base,
    fieldDe: "Anschlussvariante",
    fieldEn: "Connection variant",
    found: false,
    valueDe: `Anschlussvariante ${rawCode} (nicht in Tabelle)`,
    valueEn: `connection variant ${rawCode} (not in table)`,
  };
}

function detailsPerPosition(pos1316: string, base: FieldResult): FieldResult {
  const [c13, c14, c15, c16] = pos1316.split("");
  const e13 = data.pos1316_inletOutletAccessories.pos13_inlet[c13];
  const e14 = data.pos1316_inletOutletAccessories.pos14_outlet[c14];
  const e15 = data.pos1316_inletOutletAccessories.pos15_inletFittings[c15];
  const e16 = data.pos1316_inletOutletAccessories.pos16_outletFittings[c16];

  const summaryDe: string[] = [];
  const summaryEn: string[] = [];
  const perPosition: Array<Record<string, unknown>> = [];

  function addPart(
    pos: string,
    de: string,
    en: string,
    code: string,
    e?: { labelDe: string; labelEn: string }
  ) {
    if (e) {
      summaryDe.push(`${de}: ${e.labelDe}`);
      summaryEn.push(`${en}: ${e.labelEn}`);
    }
    perPosition.push({
      pos,
      code,
      fieldDe: de,
      fieldEn: en,
      found: !!e,
      labelDe: e?.labelDe,
      labelEn: e?.labelEn,
    });
  }

  addPart("13", "Eingang", "Inlet", c13 ?? "", e13);
  addPart("14", "Ausgang", "Outlet", c14 ?? "", e14);
  addPart("15", "Zubehör Eingang", "Inlet fittings", c15 ?? "", e15);
  addPart("16", "Zubehör Ausgang", "Outlet fittings", c16 ?? "", e16);

  const found = !!e13 && !!e14 && !!e15 && !!e16;
  return {
    ...base,
    fieldDe: "Eingang/Ausgang + Zubehör",
    fieldEn: "Inlet/outlet + fittings",
    found,
    valueDe: summaryDe.length ? summaryDe.join(" · ") : base.valueDe,
    valueEn: summaryEn.length ? summaryEn.join(" · ") : base.valueEn,
    extra: { perPosition, safetyValveOverride: true },
  };
}

export function applySafetyValveOverrides(
  fields: {
    connectionType: FieldResult;
    handwheelCap: FieldResult;
    connectionDetails: FieldResult;
  },
  pos45: string,
  pos12: string,
  pos1316: string
): typeof fields {
  return {
    connectionType: setPressureField(fields.connectionType, pos45),
    handwheelCap: connectionVariantField(fields.handwheelCap, pos12),
    connectionDetails: detailsPerPosition(pos1316, fields.connectionDetails),
  };
}
