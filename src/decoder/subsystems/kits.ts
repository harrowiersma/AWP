import kitsData from "@data/lookups/kits.json";
import type { DecodedNumber, FieldResult } from "../types";

// Kit format examples (after dot-stripping in normalize):
//   15752e125/04103   from 15752e12.5/04103
//   45752e125/041e3   from 45752e12.5/041e3
//   15760e105/21001   from 15760e10.5/21001
//   17760e105/11001   from 17760e10.5/11001
//   44660e105/10001   from 44660e10.5/10001
//   00060f07a5a0b601  the 00060... variant decodes through standard 16-char path
//
// Compact regex: <prefix5><pressure1><dn2><material1>/<5char-variant>
// Allowed prefixes: 15752, 45752, 15760, 17760, 44660 — all 5 chars.

const KIT_RE =
  /^(?<prefix>15752|45752|15760|17760|44660)(?<press>[a-z])(?<dn>\d{2})(?<mat>[58])\/(?<variant>[A-Z0-9a-z]{5})$/i;

const lookup = kitsData as unknown as {
  prefix: Record<string, { labelDe: string; labelEn: string; appliesTo: string }>;
  pressure: Record<string, { label: string; bar: number | null }>;
  screwOrA2: Record<string, { labelDe: string; labelEn: string }>;
  outletDn: Record<string, { labelDe: string; labelEn: string }>;
  outletThread: Record<string, { labelDe: string; labelEn: string }>;
  flangeStandard: Record<string, { labelDe: string; labelEn: string }>;
  accessoryCode: Record<string, { labelDe: string; labelEn: string }>;
};

// Use the shared FieldResult shape so the UI renders kits identically to other formats.
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
  valueDe: "(nicht anwendbar im Kit)",
  valueEn: "(not applicable in kit format)",
});

export function isKit(normalized: string): boolean {
  return KIT_RE.test(normalized);
}

export function decodeKit(input: string, normalized: string): DecodedNumber | null {
  const m = KIT_RE.exec(normalized);
  if (!m || !m.groups) return null;

  const { prefix, press, dn, mat, variant } = m.groups as {
    prefix: string;
    press: string;
    dn: string;
    mat: string;
    variant: string;
  };

  const p = lookup.prefix[prefix];
  const pr = lookup.pressure[press.toLowerCase()];
  const ma = mat === "5"
    ? { labelDe: "C-Stahl (Standard)", labelEn: "carbon steel (standard)" }
    : { labelDe: "NIRO (Edelstahl)", labelEn: "stainless (NIRO)" };

  const productType = f(
    "1-5",
    "Kit-Typ",
    "Kit type",
    prefix,
    p
      ? {
          de: p.labelDe,
          en: p.labelEn,
          extra: { family: "Kit", appliesTo: p.appliesTo, prefix },
        }
      : undefined
  );

  const pressure = f(
    "6",
    "Nenndruck",
    "Nominal pressure",
    press,
    pr
      ? {
          de: pr.label,
          en: pr.label,
          extra: pr.bar !== null ? { bar: pr.bar } : undefined,
        }
      : undefined
  );

  const sizeField = f("7-8", "Nennweite (Eingang)", "Inlet size (DN)", dn, {
    de: `DN-Code ${dn}`,
    en: `DN code ${dn}`,
    extra: { dnCode: dn },
  });

  const material = f("10", "Werkstoff", "Material", mat, { de: ma.labelDe, en: ma.labelEn });

  // Variant: 5 chars decoded as <screw><outletDn><outletThread><flangeStd><accessory>
  const [v12, v13, v14, v15, v16] = variant.split("");
  const screw = lookup.screwOrA2[v12];
  const outDn = lookup.outletDn[v13];
  const outTh = lookup.outletThread[v14];
  const flange = lookup.flangeStandard[v15.toLowerCase()];
  const acc = lookup.accessoryCode[v16];

  const summaryEn: string[] = [];
  const summaryDe: string[] = [];
  const perPosition: Array<Record<string, unknown>> = [];

  function addPart(
    pos: string,
    de: string,
    en: string,
    code: string,
    entry?: { labelDe: string; labelEn: string }
  ) {
    if (entry) {
      summaryEn.push(`${en}: ${entry.labelEn}`);
      summaryDe.push(`${de}: ${entry.labelDe}`);
    }
    perPosition.push({
      pos,
      code,
      fieldDe: de,
      fieldEn: en,
      found: !!entry,
      labelDe: entry?.labelDe,
      labelEn: entry?.labelEn,
    });
  }

  addPart("12", "Schraubenwerkstoff", "Screw material", v12, screw);
  addPart("13", "Austritt DN (SV)", "Outlet DN (SV)", v13, outDn);
  addPart("14", "Austritt Anschluss", "Outlet thread", v14, outTh);
  addPart("15", "Flanschnorm", "Flange standard", v15, flange);
  addPart("16", "Zubehör", "Accessory", v16, acc);

  const variantField = f(
    "12-16",
    "Kit-Variante",
    "Kit variant",
    variant,
    {
      de: summaryDe.join(" · "),
      en: summaryEn.join(" · "),
      extra: { perPosition },
    }
  );

  const allFound =
    productType.found && pressure.found && !!screw && !!outDn && !!outTh && !!flange && !!acc;

  return {
    input,
    normalized,
    valid: allFound,
    warnings: allFound ? [] : ["Kit variant has unmapped sub-positions — partial decode."],
    errors: [],
    fields: {
      productType,
      connectionType: na("4-5", "Anschlußart", "Connection"),
      pressure,
      size: sizeField,
      screwMaterial: f("12", "Schraubenwerkstoff", "Screw material", v12, screw ? { de: screw.labelDe, en: screw.labelEn } : undefined),
      bodyMaterial: material,
      medium: na("11", "Medium", "Medium"),
      handwheelCap: na("12", "Handrad / Kappe", "Handwheel / cap"),
      connectionDetails: variantField,
      suffix: na("suffix", "SonderKürzel", "Special suffix"),
    },
  };
}
