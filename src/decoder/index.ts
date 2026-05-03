import type { DecodedNumber, FieldResult } from "./types";
import { tokenize } from "./tokenize";
import {
  lookupBodyMaterial,
  lookupConnectionType,
  lookupHandwheelCap,
  lookupMedium,
  lookupPressure,
  lookupProductType,
  lookupScrewMaterial,
  lookupSize,
  lookups,
} from "./lookup";

export type { DecodedNumber, FieldResult } from "./types";
export { lookups } from "./lookup";

function unknownField(
  position: string,
  fieldDe: string,
  fieldEn: string,
  rawCode: string
): FieldResult {
  return {
    position,
    fieldDe,
    fieldEn,
    rawCode,
    found: false,
    valueDe: undefined,
    valueEn: undefined,
  };
}

export function decode(input: string): DecodedNumber {
  const tokenResult = tokenize(input);

  if (!tokenResult.ok) {
    const errFields: DecodedNumber["fields"] = {
      productType: unknownField("1-3", "Armaturentyp + Temperaturbereich", "Valve type + temperature range", ""),
      connectionType: unknownField("4-5", "Anschlußart", "End connections", ""),
      pressure: unknownField("6", "Nenndruck", "Nominal pressure", ""),
      size: unknownField("7-8", "Nennweite", "Size (DN)", ""),
      screwMaterial: unknownField("9", "Schraubenwerkstoff", "Screw material", ""),
      bodyMaterial: unknownField("10", "Gehäusewerkstoff", "Body material", ""),
      medium: unknownField("11", "Medium", "Medium", ""),
      handwheelCap: unknownField("12", "Handrad / Kappe", "Handwheel / cap", ""),
    };
    return {
      input,
      normalized: tokenResult.normalized,
      valid: false,
      warnings: [],
      errors: [tokenResult.error],
      fields: errFields,
    };
  }

  const t = tokenResult.tokens;
  const warnings: string[] = [];
  const errors: string[] = [];

  // Pos 1-3: product type (with cast-iron variant handling)
  const ptResult = lookupProductType(t.pos1to3);
  let productType: FieldResult;
  if (ptResult.found && ptResult.entry) {
    const e = ptResult.entry;
    const tempPart = e.tempRangeC ? ` (${e.tempRangeC} °C)` : "";
    productType = {
      position: "1-3",
      fieldDe: lookups.pos13.fieldDe,
      fieldEn: lookups.pos13.fieldEn,
      rawCode: t.pos1to3,
      found: true,
      valueDe: `${e.labelDe ?? e.family}${tempPart}`,
      valueEn: `${e.labelEn ?? e.family}${tempPart}`,
      extra: { family: e.family, isCastIron: ptResult.isCastIron, register: e.register ?? null },
    };
    if (ptResult.isCastIron) {
      warnings.push("Cast iron (Gusseisen) housing variant — body material code may be overridden.");
    }
  } else {
    productType = unknownField("1-3", lookups.pos13.fieldDe, lookups.pos13.fieldEn, t.pos1to3);
    warnings.push(`Unknown product type code: ${t.pos1to3}`);
  }

  // Pos 4-5: connection type
  const ct = lookupConnectionType(t.pos4to5);
  let connectionType: FieldResult;
  if (ct.found) {
    const dvDe = ct.entry.coverExtension ? " mit Deckelverlängerung" : "";
    const dvEn = ct.entry.coverExtension ? " with cover extension" : "";
    connectionType = {
      position: "4-5",
      fieldDe: lookups.pos45.fieldDe,
      fieldEn: lookups.pos45.fieldEn,
      rawCode: t.pos4to5,
      found: true,
      valueDe: `${ct.inletDe} / ${ct.outletDe}${dvDe}`,
      valueEn: `${ct.inletEn} / ${ct.outletEn}${dvEn}`,
      extra: ct.entry as unknown as Record<string, unknown>,
    };
  } else {
    connectionType = unknownField("4-5", lookups.pos45.fieldDe, lookups.pos45.fieldEn, t.pos4to5);
    warnings.push(`Unknown connection type code: ${t.pos4to5}`);
  }

  // Pos 6: pressure
  const p = lookupPressure(t.pos6);
  const pressure: FieldResult = p
    ? {
        position: "6",
        fieldDe: lookups.pos6.fieldDe,
        fieldEn: lookups.pos6.fieldEn,
        rawCode: t.pos6,
        found: true,
        valueDe: p.label,
        valueEn: p.label,
        extra: { bar: p.bar },
      }
    : unknownField("6", lookups.pos6.fieldDe, lookups.pos6.fieldEn, t.pos6);
  if (!p) warnings.push(`Unknown pressure code: ${t.pos6}`);

  // Pos 7-8: size
  const s = lookupSize(t.pos7to8);
  const size: FieldResult = s
    ? {
        position: "7-8",
        fieldDe: lookups.pos78.fieldDe,
        fieldEn: lookups.pos78.fieldEn,
        rawCode: t.pos7to8,
        found: true,
        valueDe: s.label,
        valueEn: s.label,
        extra: { dn: s.dn },
      }
    : unknownField("7-8", lookups.pos78.fieldDe, lookups.pos78.fieldEn, t.pos7to8);
  if (!s) warnings.push(`Unknown size code: ${t.pos7to8}`);

  // Pos 9: screw material
  const sm = lookupScrewMaterial(t.pos9);
  const screwMaterial: FieldResult = sm
    ? {
        position: "9",
        fieldDe: lookups.pos9.fieldDe,
        fieldEn: lookups.pos9.fieldEn,
        rawCode: t.pos9,
        found: true,
        valueDe: sm.label,
        valueEn: sm.labelEn ?? sm.label,
      }
    : unknownField("9", lookups.pos9.fieldDe, lookups.pos9.fieldEn, t.pos9);
  if (!sm) warnings.push(`Unknown screw material code: ${t.pos9}`);

  // Pos 10: body material (with cast-iron override note)
  const bm = lookupBodyMaterial(t.pos10);
  let bodyMaterial: FieldResult;
  if (bm) {
    const isCastIron = ptResult.isCastIron;
    const castNoteDe = isCastIron
      ? " — Gusseisen-Variante (Pos 1-3 endet mit G)"
      : "";
    const castNoteEn = isCastIron ? " — cast iron variant (Pos 1-3 ends in G)" : "";
    bodyMaterial = {
      position: "10",
      fieldDe: lookups.pos10.fieldDe,
      fieldEn: lookups.pos10.fieldEn,
      rawCode: t.pos10,
      found: true,
      valueDe: `${bm.labelDe}${castNoteDe}`,
      valueEn: `${bm.labelEn}${castNoteEn}`,
      extra: { materials: bm.materials, isCastIron },
    };
  } else {
    bodyMaterial = unknownField("10", lookups.pos10.fieldDe, lookups.pos10.fieldEn, t.pos10);
    warnings.push(`Unknown body material code: ${t.pos10}`);
  }

  // Pos 11: medium
  const m = lookupMedium(t.pos11);
  const medium: FieldResult = m
    ? {
        position: "11",
        fieldDe: lookups.pos11.fieldDe,
        fieldEn: lookups.pos11.fieldEn,
        rawCode: t.pos11,
        found: true,
        valueDe: m.labelDe,
        valueEn: m.labelEn,
      }
    : unknownField("11", lookups.pos11.fieldDe, lookups.pos11.fieldEn, t.pos11);
  if (!m) warnings.push(`Unknown medium code: ${t.pos11}`);

  // Pos 12: handwheel/cap (family-dependent — strainers use mesh size)
  const family = ptResult.entry?.family;
  const familyKey = family && /^SS/.test(family) ? "SS" : family && /^RV$/.test(family) ? "RV" : family;
  const hw = lookupHandwheelCap(t.pos12, familyKey);
  const hwEntry = hw.entry as
    | { label?: string; labelDe?: string; labelEn?: string }
    | undefined;
  let handwheelCap: FieldResult;
  if (hwEntry && (hwEntry.labelDe || hwEntry.labelEn || hwEntry.label)) {
    handwheelCap = {
      position: "12",
      fieldDe: hw.fieldDe,
      fieldEn: hw.fieldEn,
      rawCode: t.pos12,
      found: true,
      valueDe: hwEntry.labelDe ?? hwEntry.label ?? "",
      valueEn: hwEntry.labelEn ?? hwEntry.label ?? "",
    };
  } else {
    handwheelCap = unknownField("12", hw.fieldDe, hw.fieldEn, t.pos12);
    if (familyKey !== "RV") warnings.push(`Unknown ${hw.fieldEn} code: ${t.pos12}`);
  }

  const allFound =
    productType.found &&
    connectionType.found &&
    pressure.found &&
    size.found &&
    screwMaterial.found &&
    bodyMaterial.found &&
    medium.found &&
    (handwheelCap.found || familyKey === "RV");

  return {
    input,
    normalized: tokenResult.normalized,
    valid: allFound,
    warnings,
    errors,
    fields: {
      productType,
      connectionType,
      pressure,
      size,
      screwMaterial,
      bodyMaterial,
      medium,
      handwheelCap,
    },
  };
}
