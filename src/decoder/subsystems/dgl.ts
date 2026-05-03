import dglData from "@data/lookups/dgl.json";
import type { DecodedNumber, FieldResult } from "../types";

// Match either the dotted SAP form (e.g. "01884.15.5/00R11" or
// "01884D15.5/00R11") or the joined form after dots/spaces are stripped.
// Compact backbone after normalize:
//   018 + connection(2) + [optional pressure-letter D|F] + size(2) + material(1)
//        + [optional /] + seq(2) + R<n>
// Pressure column is `.` in the canonical PS25/40-ambiguous case (which our
// normalize strips), and `D` (PS40) or `F` (PS64) when explicit. The slash is
// kept by normalize so we use it as an anchor when present.
const DGL_RE =
  /^018(?<conn>\d{2})(?<press>[DF])?(?<size>\d{2})(?<mat>[578])\/?(?<seq>[0-9A-Z]{2})(?<rubric>R\d{1,2})$/i;

type Field = {
  position: string;
  fieldDe: string;
  fieldEn: string;
  rawCode: string;
  found: boolean;
  valueDe?: string;
  valueEn?: string;
  extra?: Record<string, unknown>;
};

const lookup = dglData as unknown as {
  type: Record<string, { labelDe: string; labelEn: string }>;
  connection: Record<string, { labelDe: string; labelEn: string }>;
  pressure: Record<string, { labelDe: string; labelEn: string; bar: number | null }>;
  size: Record<string, { label: string; dn: number }>;
  material: Record<string, { labelDe: string; labelEn: string }>;
};

function field(
  position: string,
  de: string,
  en: string,
  raw: string,
  resolved?: { de?: string; en?: string; extra?: Record<string, unknown> }
): Field {
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

export function isDgl(normalized: string): boolean {
  return DGL_RE.test(normalized);
}

export function decodeDgl(input: string, normalized: string): DecodedNumber | null {
  const m = DGL_RE.exec(normalized);
  if (!m || !m.groups) return null;

  const { conn, press, size, mat, seq, rubric } = m.groups as {
    conn: string;
    press?: string;
    size: string;
    mat: string;
    seq: string;
    rubric: string;
  };

  const t = lookup.type["018"];
  const c = lookup.connection[conn];
  const s = lookup.size[size];
  const ma = lookup.material[mat];

  const productType = field(
    "1-3",
    "Armaturentyp",
    "Type",
    "018",
    t ? { de: t.labelDe, en: t.labelEn, extra: { family: "DGL" } } : undefined
  );
  const connectionType = field(
    "4-5",
    "Anschlußart",
    "Connection",
    conn,
    c ? { de: c.labelDe, en: c.labelEn } : undefined
  );
  const sz = field(
    "6-7",
    "Nennweite",
    "Size (DN)",
    size,
    s ? { de: s.label, en: s.label, extra: { dn: s.dn } } : undefined
  );
  const material = field(
    "9",
    "Werkstoff",
    "Material",
    mat,
    ma ? { de: ma.labelDe, en: ma.labelEn } : undefined
  );
  const sequence = field(
    "10-11",
    "Laufende Nummer",
    "Sequence number",
    seq,
    { de: `Lfd. Nr. ${seq}`, en: `running number ${seq}` }
  );
  const rubricField = field(
    "12-",
    "Rubrik (Zeichnungsreferenz)",
    "Drawing rubric",
    rubric,
    { de: `${rubric} — Rubrik 1-35 (siehe DGL-Ausführungsvorgaben PDF)`, en: `${rubric} — drawing rubric 1-35 (see DGL execution specs PDF)` }
  );

  // Build the standard DecodedNumber shape — DGL has no Pos 6 pressure in the same
  // place, no screw material, etc. We use the existing fields slot but mark unused
  // slots as not-applicable rather than leaving them undefined.
  const na = (pos: string, de: string, en: string): FieldResult => ({
    position: pos,
    fieldDe: de,
    fieldEn: en,
    rawCode: "",
    found: true,
    valueDe: "(nicht anwendbar in DGL)",
    valueEn: "(not applicable in DGL)",
  });

  // Pressure column: explicit D / F or implicit "." (which was stripped by normalize)
  const pr = press ? lookup.pressure[press.toUpperCase()] : lookup.pressure["."];
  const pressureField = field(
    "6",
    "Nenndruck",
    "Nominal pressure",
    press ?? ".",
    pr ? { de: pr.labelDe, en: pr.labelEn, extra: pr.bar !== null ? { bar: pr.bar } : undefined } : undefined
  );

  return {
    input,
    normalized,
    valid:
      productType.found && connectionType.found && sz.found && material.found,
    warnings: [],
    errors: [],
    fields: {
      productType,
      connectionType,
      pressure: pressureField,
      size: sz,
      screwMaterial: na("9", "Schraubenwerkstoff", "Screw material"),
      bodyMaterial: material,
      medium: na("11", "Medium", "Medium"),
      handwheelCap: sequence,
      connectionDetails: rubricField,
      suffix: na("suffix", "SonderKürzel", "Special suffix"),
    },
  };
}
