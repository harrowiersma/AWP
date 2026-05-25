import trData from "@data/lookups/tr.json";
import type { FieldResult } from "../types";

const data = trData as unknown as {
  appliesToFamilies: string[];
  pos6_pressure: Record<string, { label: string; bar: number }>;
  pos9_nominalTemperature: {
    values: Record<string, { labelDe: string; labelEn: string }>;
  };
};

export function isTrFamily(family: string | undefined): boolean {
  return !!family && data.appliesToFamilies.includes(family);
}

export function applyTrOverrides(
  fields: { pressure: FieldResult; screwMaterial: FieldResult },
  pos6: string,
  pos9: string
): typeof fields {
  // Pos 6: TR uses B=PS25 (not C as in the standard valve table)
  const p = data.pos6_pressure[pos6];
  const pressure: FieldResult = p
    ? {
        ...fields.pressure,
        fieldDe: "Nenndruck (TR)",
        fieldEn: "Nominal pressure (TR)",
        found: true,
        valueDe: p.label,
        valueEn: p.label,
        extra: { bar: p.bar },
      }
    : { ...fields.pressure, found: false };

  // Pos 9: encodes Nenntemperatur (rated opening temperature), not screw material.
  const t = data.pos9_nominalTemperature.values[pos9];
  const screwMaterial: FieldResult = t
    ? {
        ...fields.screwMaterial,
        fieldDe: "Nenntemperatur",
        fieldEn: "Nominal opening temperature",
        found: true,
        valueDe: t.labelDe,
        valueEn: t.labelEn,
      }
    : {
        ...fields.screwMaterial,
        fieldDe: "Nenntemperatur",
        fieldEn: "Nominal opening temperature",
        found: false,
        valueDe: `Nenntemperatur-Code ${pos9} (nicht in Tabelle)`,
        valueEn: `nominal-temperature code ${pos9} (not in table)`,
      };

  return { pressure, screwMaterial };
}
