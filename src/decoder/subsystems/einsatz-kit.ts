import einsatzData from "@data/lookups/einsatz-kit.json";
import type { DecodedNumber, FieldResult } from "../types";

// AVR/AVB Einsatz-Kit format. Examples:
//   26300E24.5110B01    → AVR insert kit DN250 PS40 steel ...
//   16300E18.511C041   → AVB insert kit DN80 PS40 steel ...
//
// Compact backbone (after normalize() strips the dot at Pos 9):
//   <163|263>(2 digits)(letter)(2 digits)(material 5/7/8)(6 chars)  = 15 chars
//
// We anchor on Pos 1-3 ∈ {163, 263} AND a Pos 6 letter from the kit pressure
// table (E/B/F/K/L) AND a Pos 10 material in {5,7,8}. Pos 4-5 can also be
// alphanumeric (A0, 0A-0E, 0J-2J), so it's matched as 2 chars from {0-9, A-Z}.

const EINSATZ_RE =
  /^(?<typ>163|263)(?<pos45>[0-9A-Z]{2})(?<pos6>[EBFKL])(?<dn>\d{2})(?<mat>[578])(?<rest>[0-9A-Z]{6})$/;

const data = einsatzData as unknown as {
  type: Record<string, { labelDe: string; labelEn: string }>;
  pos45: Record<string, { labelDe: string; labelEn: string }>;
  pos6: {
    values: Record<string, { label: string; bar: number; screws: string }>;
  };
  pos10: { values: Record<string, { labelDe: string; labelEn: string }> };
  pos14_ringMaterial: Record<string, { labelDe: string; labelEn: string }>;
  pos15_variant: Record<string, { labelDe: string; labelEn: string }>;
  pos16_sparePartVariant: Record<string, { labelDe: string; labelEn: string }>;
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
  valueDe: "(im Einsatz-Kit nicht anwendbar)",
  valueEn: "(not applicable in Einsatz-Kit)",
});

export function isEinsatzKit(normalized: string): boolean {
  return EINSATZ_RE.test(normalized);
}

export function decodeEinsatzKit(input: string, normalized: string): DecodedNumber | null {
  const m = EINSATZ_RE.exec(normalized);
  if (!m || !m.groups) return null;

  const { typ, pos45, pos6, dn, mat, rest } = m.groups as Record<string, string>;
  // rest = pos11 + pos12 + pos13 + pos14 + pos15 + pos16
  const [c11, c12, c13, c14, c15, c16] = rest.split("");

  const t = data.type[typ];
  const productType = f(
    "1-3",
    "Armaturentyp (Einsatz-Kit)",
    "Valve type (insert kit)",
    typ,
    t
      ? {
          de: `${t.labelDe} (Einsatz-Kit)`,
          en: `${t.labelEn} (insert kit)`,
          extra: { family: "Einsatz-Kit", baseFamily: typ === "163" ? "AVB" : "AVR" },
        }
      : undefined
  );

  const c45 = data.pos45[pos45];
  const connectionType = f(
    "4-5",
    "Deckel-/Antriebsoption",
    "Cover / actuator option",
    pos45,
    c45 ? { de: c45.labelDe, en: c45.labelEn } : undefined
  );

  const p6 = data.pos6.values[pos6];
  const pressure = f(
    "6",
    "Nenndruck (Einsatz-Kit)",
    "Nominal pressure (insert kit)",
    pos6,
    p6
      ? {
          de: `${p6.label} — Schrauben ${p6.screws}`,
          en: `${p6.label} — screws ${p6.screws}`,
          extra: { bar: p6.bar, screws: p6.screws },
        }
      : undefined
  );

  // Size uses the standard DN code lookup but we resolve inline to keep this
  // sub-system self-contained. The mapping mirrors data/lookups/position-7-8.json.
  const dnMap: Record<string, number> = {
    "06": 6, "07": 8, "08": 10, "10": 15, "11": 20, "12": 25, "13": 32,
    "14": 40, "15": 50, "17": 65, "18": 80, "19": 100, "20": 125, "21": 150,
    "23": 200, "24": 250, "25": 300, "26": 350, "27": 400, "28": 500,
  };
  const dnVal = dnMap[dn];
  const size = f(
    "7-8",
    "Nennweite",
    "Size (DN)",
    dn,
    dnVal !== undefined
      ? { de: `DN ${dnVal}`, en: `DN ${dnVal}`, extra: { dn: dnVal } }
      : undefined
  );

  const matEntry = data.pos10.values[mat];
  const bodyMaterial = f(
    "10",
    "Werkstoff Einsatz",
    "Insert material",
    mat,
    matEntry ? { de: matEntry.labelDe, en: matEntry.labelEn } : undefined
  );

  // Pos 11-13: Kit-class identifiers — not enumerated in the source legend,
  // surface raw values for traceability.
  const kitClass = f(
    "11-13",
    "Kit-Klasse",
    "Kit class identifier",
    `${c11}${c12}${c13}`,
    {
      de: `Pos 11-13: ${c11}${c12}${c13} (interner Kit-Identifikator, nicht im Legend-Auszug enumeriert)`,
      en: `Pos 11-13: ${c11}${c12}${c13} (internal kit identifier, not enumerated in source legend)`,
    }
  );

  const ring = data.pos14_ringMaterial[c14];
  const ringField = f(
    "14",
    "Rundring-Material",
    "O-ring material",
    c14,
    ring ? { de: ring.labelDe, en: ring.labelEn } : undefined
  );

  const variant = data.pos15_variant[c15];
  const variantField = f(
    "15",
    "Sitzdichtung / Antriebs-Variante",
    "Seat seal / actuator variant",
    c15,
    variant ? { de: variant.labelDe, en: variant.labelEn } : undefined
  );

  const sparePart = data.pos16_sparePartVariant[c16];
  const sparePartField = f(
    "16",
    "Ersatzteil-Variante",
    "Spare-part variant",
    c16,
    sparePart ? { de: sparePart.labelDe, en: sparePart.labelEn } : undefined
  );

  // Compose detailed connection-details summary across positions 14-16
  const summaryEn: string[] = [];
  const summaryDe: string[] = [];
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
  addPart("14", "Rundring", "O-ring", c14, ring);
  addPart("15", "Variante", "Variant", c15, variant);
  addPart("16", "Ersatzteil", "Spare part", c16, sparePart);

  const connectionDetails = f(
    "14-16",
    "Einsatz-Kit Optionen (Pos 14-16)",
    "Insert-kit options (Pos 14-16)",
    `${c14}${c15}${c16}`,
    {
      de: summaryDe.length ? summaryDe.join(" · ") : undefined,
      en: summaryEn.length ? summaryEn.join(" · ") : undefined,
      extra: { perPosition, einsatzKitOverride: true },
    }
  );

  void ringField;
  void variantField;
  void sparePartField;

  const allFound =
    productType.found &&
    connectionType.found &&
    pressure.found &&
    size.found &&
    bodyMaterial.found &&
    !!ring &&
    !!variant &&
    !!sparePart;

  return {
    input,
    normalized,
    valid: allFound,
    warnings: [],
    errors: [],
    fields: {
      productType,
      connectionType,
      pressure,
      size,
      screwMaterial: kitClass,
      bodyMaterial,
      medium: na("11", "Medium", "Medium"),
      handwheelCap: na("12", "Handrad / Kappe", "Handwheel / cap"),
      connectionDetails,
      suffix: na("suffix", "SonderKürzel", "Special suffix"),
    },
  };
}
