import dualSvData from "@data/lookups/dual-sv.json";
import type { FieldResult } from "../types";

const data = dualSvData as unknown as {
  appliesToFamilies: string[];
  pos6_nominalPressure: {
    values: Record<string, { label: string; bar: number }>;
  };
  pos78_dualDn: {
    values: Record<string, { labelDe: string; labelEn: string }>;
  };
};

export function isDualSvFamily(family: string | undefined): boolean {
  return !!family && data.appliesToFamilies.includes(family);
}

export function applyDualSvOverrides(
  fields: {
    connectionType: FieldResult;
    pressure: FieldResult;
    size: FieldResult;
  },
  pos45: string,
  pos6: string,
  pos78: string
): typeof fields {
  // Pos 4-5: set pressure (numeric bar value)
  const setPressureNum = Number.parseInt(pos45, 10);
  const connectionType: FieldResult = !Number.isNaN(setPressureNum)
    ? {
        ...fields.connectionType,
        fieldDe: "Einstelldruck (Sicherheitsventil)",
        fieldEn: "Set pressure (safety valve)",
        found: true,
        valueDe: `Einstelldruck ${setPressureNum} bar (Code ${pos45})`,
        valueEn: `set pressure ${setPressureNum} bar (code ${pos45})`,
        extra: { setPressureBar: setPressureNum },
      }
    : {
        ...fields.connectionType,
        fieldDe: "Einstelldruck",
        fieldEn: "Set pressure",
        found: false,
      };

  // Pos 6: nominal pressure with dual-SV table (B=PS25 etc.)
  const p = data.pos6_nominalPressure.values[pos6];
  const pressure: FieldResult = p
    ? {
        ...fields.pressure,
        fieldDe: "Nenndruck (Dual-SV)",
        fieldEn: "Nominal pressure (dual SV)",
        found: true,
        valueDe: p.label,
        valueEn: p.label,
        extra: { bar: p.bar },
      }
    : { ...fields.pressure, found: false };

  // Pos 7-8: dual DN code
  const dn = data.pos78_dualDn.values[pos78];
  const size: FieldResult = dn
    ? {
        ...fields.size,
        fieldDe: "Nennweiten (WV/SV)",
        fieldEn: "Nominal sizes (WV/SV)",
        found: true,
        valueDe: dn.labelDe,
        valueEn: dn.labelEn,
      }
    : {
        ...fields.size,
        fieldDe: "Nennweiten (WV/SV)",
        fieldEn: "Nominal sizes (WV/SV)",
        found: false,
        valueDe: `DN-Kombi-Code ${pos78} (nicht in Tabelle)`,
        valueEn: `dual-DN code ${pos78} (not in table)`,
      };

  return { connectionType, pressure, size };
}
