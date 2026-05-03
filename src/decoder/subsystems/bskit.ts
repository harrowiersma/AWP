import bskitData from "@data/lookups/bskit.json";
import type { DecodedNumber, FieldResult } from "../types";

// BS-Kit format example: 44201.10.5/xx001  (after dot-stripping in normalize:
// "44201105xx001" — 13 chars when xx is alphanumeric).
// Components: <prefix5>.<size2>.<material1>/<variant3-with-burst-pressure>
//
// We require the slash to remain after normalize (normalize strips dots and spaces
// but keeps slashes). The compact backbone is:
//   prefix(5) + size(2) + material(1) + "/" + bp(2) + form(1)
const BSKIT_RE = /^(?<prefix>4420[12])(?<size>\d{2})(?<mat>[58])\/(?<bp>[A-Z0-9]{2})(?<form>[A-Z0-9]{3})$/i;

const lookup = bskitData as unknown as {
  prefix: Record<string, { labelDe: string; labelEn: string }>;
  size: Record<string, { labelDe: string; labelEn: string }>;
  material: Record<string, { labelDe: string; labelEn: string }>;
  variant: Record<
    string,
    { labelDe: string; labelEn: string; tolerance?: string }
  >;
};

function f(
  position: string,
  de: string,
  en: string,
  raw: string,
  resolved?: { de?: string; en?: string; extra?: Record<string, unknown> }
): FieldResult {
  return {
    position,
    fieldDe: de,
    fieldEn: en,
    rawCode: raw,
    found: !!resolved,
    valueDe: resolved?.de,
    valueEn: resolved?.en,
    extra: resolved?.extra,
  };
}

const na = (pos: string, de: string, en: string): FieldResult => ({
  position: pos,
  fieldDe: de,
  fieldEn: en,
  rawCode: "",
  found: true,
  valueDe: "(nicht anwendbar in BS-Kit)",
  valueEn: "(not applicable in BS-Kit)",
});

export function isBsKit(normalized: string): boolean {
  return BSKIT_RE.test(normalized);
}

export function decodeBsKit(input: string, normalized: string): DecodedNumber | null {
  const m = BSKIT_RE.exec(normalized);
  if (!m || !m.groups) return null;

  const { prefix, size, mat, bp, form } = m.groups as Record<string, string>;
  const variantKey = `${form}`;

  const p = lookup.prefix[prefix];
  const s = lookup.size[size];
  const ma = lookup.material[mat];
  const v = lookup.variant[variantKey];

  const productType = f(
    "1-5",
    "Bersteinheit-Typ",
    "Burst-disc kit type",
    prefix,
    p ? { de: p.labelDe, en: p.labelEn, extra: { family: "BS-Kit" } } : undefined
  );

  const sz = f(
    "6-7",
    "Aufnahmetyp",
    "Housing type",
    size,
    s ? { de: s.labelDe, en: s.labelEn } : undefined
  );

  const material = f(
    "8",
    "Werkstoff",
    "Material",
    mat,
    ma ? { de: ma.labelDe, en: ma.labelEn } : undefined
  );

  // Burst pressure: literal "XX" means TBD (placeholder); numeric → bar value
  const burstResolved = (() => {
    if (/^XX$/i.test(bp)) {
      return {
        de: "Berstdruck noch festzulegen (XX-Platzhalter)",
        en: "Burst pressure to be specified (XX placeholder)",
      };
    }
    const num = parseInt(bp, 10);
    if (!isNaN(num)) {
      const formatted = bp.startsWith("0") || num >= 10 ? `${num} bar` : `${num} bar`;
      return {
        de: `Berstdruck ca. ${formatted} (Code ${bp})`,
        en: `Burst pressure approx. ${formatted} (code ${bp})`,
        extra: { burstPressureBar: num, raw: bp },
      };
    }
    return undefined;
  })();

  const burst = f("9-10", "Berstdruck", "Burst pressure", bp, burstResolved);

  const variant = f(
    "11-13",
    "Aufnahme-/Toleranz-Variante",
    "Housing / tolerance variant",
    form,
    v
      ? {
          de: v.labelDe + (v.tolerance ? ` — Toleranz ${v.tolerance}` : ""),
          en: v.labelEn + (v.tolerance ? ` — tolerance ${v.tolerance}` : ""),
          extra: v.tolerance ? { tolerance: v.tolerance } : undefined,
        }
      : undefined
  );

  // Variant lookup is best-effort: not every numeric form code is in the JSON
  // (the ENS spec has many unmapped variants). Don't fail validity on it.
  const warnings: string[] = [];
  if (!variant.found) {
    warnings.push(`BS-Kit variant code '${form}' not in lookup table — burst pressure parsed, form unknown.`);
  }

  return {
    input,
    normalized,
    valid: productType.found && sz.found && material.found,
    warnings,
    errors: [],
    fields: {
      productType,
      connectionType: na("4-5", "Anschlußart", "Connection"),
      pressure: na("6", "Nenndruck", "Nominal pressure"),
      size: sz,
      screwMaterial: na("9", "Schraubenwerkstoff", "Screw material"),
      bodyMaterial: material,
      medium: na("11", "Medium", "Medium"),
      handwheelCap: burst,
      connectionDetails: variant,
      suffix: na("suffix", "SonderKürzel", "Special suffix"),
    },
  };
}
