import type { DecodedNumber, FieldResult } from "./types";
import { normalize, tokenize } from "./tokenize";
import {
  lookupBodyMaterial,
  lookupConnectionDetails,
  lookupConnectionType,
  lookupHandwheelCap,
  lookupMedium,
  lookupPressure,
  lookupProductType,
  lookupScrewMaterial,
  lookupSize,
  lookupSuffix,
  lookups,
} from "./lookup";
import { isDgl, decodeDgl } from "./subsystems/dgl";
import { isBsKit, decodeBsKit } from "./subsystems/bskit";
import { isKit, decodeKit } from "./subsystems/kits";
import { applyHrsOverrides } from "./subsystems/hrs-override";
import {
  applySafetyValveOverrides,
  isSafetyValveFamily,
} from "./subsystems/safety-valve-override";

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
  // Try sub-system formats first (DGL, BS-Kit, kits) — they don't fit the
  // standard 16-character backbone shape. Strip any known suffix first so kit
  // codes with trailing approval/export markers (e.g. ...01103EXP) still match.
  const probe = normalize(input);
  let body = probe;
  let suffixHit: string | undefined;
  // Try to peel off a known suffix from the right.
  const suffixKeys = Object.keys(lookups.suffix.values).sort(
    (a, b) => b.length - a.length
  );
  for (const k of suffixKeys) {
    const kU = k.toUpperCase();
    if (probe.endsWith(kU) && probe.length > kU.length) {
      body = probe.slice(0, probe.length - kU.length);
      suffixHit = k;
      break;
    }
  }

  function attachSuffix(result: DecodedNumber): DecodedNumber {
    if (!suffixHit) return result;
    const entry = (lookups.suffix.values as Record<string, { labelDe: string; labelEn: string; addedCodes?: string }>)[suffixHit];
    return {
      ...result,
      fields: {
        ...result.fields,
        suffix: {
          position: "suffix",
          fieldDe: lookups.suffix.fieldDe,
          fieldEn: lookups.suffix.fieldEn,
          rawCode: suffixHit,
          found: true,
          valueDe: `${suffixHit} — ${entry.labelDe}`,
          valueEn: `${suffixHit} — ${entry.labelEn}`,
          extra: { matched: suffixHit, addedCodes: entry.addedCodes },
        },
      },
    };
  }

  if (isBsKit(body)) {
    const result = decodeBsKit(input, body);
    if (result) return attachSuffix(result);
  }
  if (isKit(body)) {
    const result = decodeKit(input, body);
    if (result) return attachSuffix(result);
  }
  if (isDgl(body)) {
    const result = decodeDgl(input, body);
    if (result) return attachSuffix(result);
  }

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
      connectionDetails: unknownField("13-16", "Spezifizierung der Anschlüsse", "Connection specification", ""),
      suffix: unknownField("suffix", "SonderKürzel", "Special suffix", ""),
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

  // Pos 13-16: connection details (context-dependent on Pos 4-5 + family)
  const cd = lookupConnectionDetails(t.pos13to16, t.pos4to5, t.pos1to3, family);
  let connectionDetails: FieldResult;
  if (cd.found || cd.perPosition?.some((p) => p.found)) {
    connectionDetails = {
      position: "13-16",
      fieldDe: lookups.pos1316.fieldDe,
      fieldEn: lookups.pos1316.fieldEn,
      rawCode: t.pos13to16,
      found: cd.found,
      valueDe: cd.labelDe,
      valueEn: cd.labelEn,
      extra: { matchedRule: cd.matchedRule, perPosition: cd.perPosition },
    };
    if (!cd.found && cd.perPosition) {
      warnings.push(
        `Pos 13-16: partial decode — ${cd.perPosition
          .filter((p) => !p.found)
          .map((p) => `Pos ${p.pos}='${p.code}'`)
          .join(", ")} unknown`
      );
    }
  } else {
    connectionDetails = {
      position: "13-16",
      fieldDe: lookups.pos1316.fieldDe,
      fieldEn: lookups.pos1316.fieldEn,
      rawCode: t.pos13to16,
      found: false,
      valueDe: "Details bitte bei AWP nachfragen",
      valueEn: "Details please request from AWP",
    };
  }

  // Suffix (SonderKürzel) — anything after the 16-character backbone
  const sx = lookupSuffix(tokenResult.suffix);
  let suffix: FieldResult;
  if (!tokenResult.suffix) {
    suffix = {
      position: "suffix",
      fieldDe: lookups.suffix.fieldDe,
      fieldEn: lookups.suffix.fieldEn,
      rawCode: "",
      found: true,
      valueDe: "(keiner)",
      valueEn: "(none)",
    };
  } else if (sx.found && sx.entry && sx.matched) {
    const remainderNote = sx.remainder
      ? ` (+ unparsed: '${sx.remainder}')`
      : "";
    suffix = {
      position: "suffix",
      fieldDe: lookups.suffix.fieldDe,
      fieldEn: lookups.suffix.fieldEn,
      rawCode: tokenResult.suffix,
      found: true,
      valueDe: `${sx.matched} — ${sx.entry.labelDe}${remainderNote}`,
      valueEn: `${sx.matched} — ${sx.entry.labelEn}${remainderNote}`,
      extra: {
        matched: sx.matched,
        addedCodes: sx.entry.addedCodes,
        remainder: sx.remainder ?? "",
      },
    };
    if (sx.remainder) {
      warnings.push(`Suffix has unparsed remainder: '${sx.remainder}'`);
    }
  } else {
    suffix = {
      position: "suffix",
      fieldDe: lookups.suffix.fieldDe,
      fieldEn: lookups.suffix.fieldEn,
      rawCode: tokenResult.suffix,
      found: false,
    };
    warnings.push(`Unknown suffix: '${tokenResult.suffix}'`);
  }

  // HRS / HRSN family override: positions 9-16 carry HRS-specific meanings
  // (connection-table letter, ring-material × table, test-port codes, etc.)
  let finalFields = {
    productType,
    connectionType,
    pressure,
    size,
    screwMaterial,
    bodyMaterial,
    medium,
    handwheelCap,
    connectionDetails,
    suffix,
  };
  if (family === "HRS" || family === "HRSN") {
    const pos9to16 =
      t.pos9 + t.pos10 + t.pos11 + t.pos12 + t.pos13to16;
    const overridden = applyHrsOverrides(
      {
        connectionType,
        pressure,
        screwMaterial,
        bodyMaterial,
        medium,
        handwheelCap,
        connectionDetails,
      },
      t.pos13to16,
      pos9to16
    );
    finalFields = { ...finalFields, ...overridden };
  } else if (isSafetyValveFamily(family, t.pos1to3)) {
    // Safety valves (SVA/SVU/UVA/UVU/ORV) reinterpret Pos 4-5 as set pressure,
    // Pos 12 as connection variant, and Pos 13-16 as inlet/outlet/fittings.
    const overridden = applySafetyValveOverrides(
      { connectionType, handwheelCap, connectionDetails },
      t.pos4to5,
      t.pos12,
      t.pos13to16
    );
    finalFields = { ...finalFields, ...overridden };
    // Drop the earlier "Unknown connection type code" warning since for safety
    // valves Pos 4-5 isn't a connection code at all.
    const drop = `Unknown connection type code: ${t.pos4to5}`;
    const idx = warnings.indexOf(drop);
    if (idx !== -1) warnings.splice(idx, 1);
  }

  const f = finalFields;
  const allFound =
    f.productType.found &&
    f.connectionType.found &&
    f.pressure.found &&
    f.size.found &&
    f.screwMaterial.found &&
    f.bodyMaterial.found &&
    f.medium.found &&
    (f.handwheelCap.found || familyKey === "RV");

  return {
    input,
    normalized: tokenResult.normalized,
    valid: allFound,
    warnings,
    errors,
    fields: finalFields,
  };
}
