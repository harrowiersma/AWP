import ofData from "@data/lookups/oil-filter.json";
import type { FieldResult } from "../types";

const data = ofData as unknown as {
  appliesToFamilies: string[];
  pos11_ringMaterial: {
    values: Record<string, { labelDe: string; labelEn: string }>;
  };
  pos12_meshSize: {
    values: Record<string, { labelDe: string; labelEn: string; micrometers?: number }>;
  };
};

export function isOilFilterFamily(family: string | undefined): boolean {
  return !!family && data.appliesToFamilies.includes(family);
}

export function applyOilFilterOverrides(
  fields: { medium: FieldResult; handwheelCap: FieldResult },
  pos11: string,
  pos12: string
): typeof fields {
  // Pos 11: O-ring material instead of medium
  const ring = data.pos11_ringMaterial.values[pos11];
  const medium: FieldResult = ring
    ? {
        ...fields.medium,
        fieldDe: "Dichtungsmaterial (Rundring)",
        fieldEn: "Sealing material (O-ring)",
        found: true,
        valueDe: ring.labelDe,
        valueEn: ring.labelEn,
      }
    : {
        ...fields.medium,
        fieldDe: "Dichtungsmaterial (Rundring)",
        fieldEn: "Sealing material (O-ring)",
        found: false,
        valueDe: `Rundring-Code ${pos11} (nicht in Tabelle)`,
        valueEn: `O-ring code ${pos11} (not in table)`,
      };

  // Pos 12: mesh size instead of handwheel/cap
  const mesh = data.pos12_meshSize.values[pos12];
  const handwheelCap: FieldResult = mesh
    ? {
        ...fields.handwheelCap,
        fieldDe: "Maschenweite",
        fieldEn: "Mesh size",
        found: true,
        valueDe: mesh.labelDe,
        valueEn: mesh.labelEn,
        extra: mesh.micrometers !== undefined ? { micrometers: mesh.micrometers } : undefined,
      }
    : {
        ...fields.handwheelCap,
        fieldDe: "Maschenweite",
        fieldEn: "Mesh size",
        found: false,
      };

  return { medium, handwheelCap };
}
