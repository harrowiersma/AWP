import { decode, type DecodedNumber } from "@/decoder";

const HEADER_CANDIDATES = [
  "material",
  "materialnumber",
  "material no",
  "material_no",
  "material number",
  "materialnummer",
  "material-nr",
  "material nr",
  "code",
  "speaking number",
  "sprechende nummer",
  "ens",
  "art-nr",
  "artikelnummer",
  "part number",
];

export function detectCodeColumn(headers: string[]): number {
  const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "");
  for (let i = 0; i < headers.length; i++) {
    const h = norm(headers[i] ?? "");
    if (HEADER_CANDIDATES.some((c) => h === norm(c) || h.includes(norm(c)))) {
      return i;
    }
  }
  return -1;
}

export type DecodedRow = Record<string, string>;

export const APPENDED_COLUMNS = [
  "decoded_product_type",
  "decoded_connection_type",
  "decoded_pressure",
  "decoded_size",
  "decoded_screw_material",
  "decoded_body_material",
  "decoded_medium",
  "decoded_handwheel_cap",
  "decoded_connection_details",
  "decoded_suffix",
  "decode_warnings",
];

export function decodedToColumns(d: DecodedNumber): Record<string, string> {
  const fmt = (label: string | undefined, code: string, found: boolean) =>
    found ? `${label ?? ""} [${code}]` : `unknown [${code}]`;
  return {
    decoded_product_type: fmt(
      d.fields.productType.valueEn,
      d.fields.productType.rawCode,
      d.fields.productType.found
    ),
    decoded_connection_type: fmt(
      d.fields.connectionType.valueEn,
      d.fields.connectionType.rawCode,
      d.fields.connectionType.found
    ),
    decoded_pressure: fmt(
      d.fields.pressure.valueEn,
      d.fields.pressure.rawCode,
      d.fields.pressure.found
    ),
    decoded_size: fmt(d.fields.size.valueEn, d.fields.size.rawCode, d.fields.size.found),
    decoded_screw_material: fmt(
      d.fields.screwMaterial.valueEn,
      d.fields.screwMaterial.rawCode,
      d.fields.screwMaterial.found
    ),
    decoded_body_material: fmt(
      d.fields.bodyMaterial.valueEn,
      d.fields.bodyMaterial.rawCode,
      d.fields.bodyMaterial.found
    ),
    decoded_medium: fmt(d.fields.medium.valueEn, d.fields.medium.rawCode, d.fields.medium.found),
    decoded_handwheel_cap: fmt(
      d.fields.handwheelCap.valueEn,
      d.fields.handwheelCap.rawCode,
      d.fields.handwheelCap.found
    ),
    decoded_connection_details: fmt(
      d.fields.connectionDetails.valueEn,
      d.fields.connectionDetails.rawCode,
      d.fields.connectionDetails.found
    ),
    decoded_suffix: d.fields.suffix.rawCode
      ? fmt(d.fields.suffix.valueEn, d.fields.suffix.rawCode, d.fields.suffix.found)
      : "",
    decode_warnings: [...d.errors, ...d.warnings].join("; "),
  };
}

export function processRows(
  rows: Record<string, string>[],
  codeColumn: string
): Record<string, string>[] {
  return rows.map((row) => {
    const code = row[codeColumn] ?? "";
    if (!code.trim()) {
      return {
        ...row,
        ...Object.fromEntries(APPENDED_COLUMNS.map((c) => [c, ""])),
      };
    }
    const decoded = decode(code);
    return { ...row, ...decodedToColumns(decoded) };
  });
}
