import pos13Data from "@data/lookups/position-1-3.json";
import pos45Data from "@data/lookups/position-4-5.json";
import pos6Data from "@data/lookups/position-6.json";
import pos78Data from "@data/lookups/position-7-8.json";
import pos9Data from "@data/lookups/position-9.json";
import pos10Data from "@data/lookups/position-10.json";
import pos11Data from "@data/lookups/position-11.json";
import pos12Data from "@data/lookups/position-12.json";
import pos1316Data from "@data/lookups/position-13-16.json";
import suffixData from "@data/lookups/suffixes.json";
import versionData from "@data/lookups/version.json";

export const lookups = {
  pos13: pos13Data,
  pos45: pos45Data,
  pos6: pos6Data,
  pos78: pos78Data,
  pos9: pos9Data,
  pos10: pos10Data,
  pos11: pos11Data,
  pos12: pos12Data,
  pos1316: pos1316Data,
  suffix: suffixData,
  version: versionData,
} as const;

export type Pos13Entry = {
  family: string;
  labelDe?: string;
  labelEn?: string;
  tempRangeC?: string;
  register?: string | null;
};

export function lookupProductType(code: string): {
  found: boolean;
  entry?: Pos13Entry;
  isCastIron: boolean;
} {
  const values = pos13Data.values as unknown as Record<string, Pos13Entry>;
  const cast = pos13Data.castIronVariants as unknown as Record<string, Pos13Entry>;
  if (code in values && values[code]) {
    return { found: true, entry: values[code], isCastIron: false };
  }
  if (code.endsWith("G") && code in cast && cast[code]) {
    return { found: true, entry: cast[code], isCastIron: true };
  }
  return { found: false, isCastIron: code.endsWith("G") };
}

export function lookupConnectionType(code: string) {
  const values = pos45Data.values as Record<
    string,
    { inlet: string; outlet: string; coverExtension: boolean }
  >;
  const abbr = pos45Data.abbreviations as Record<
    string,
    { de: string; en: string }
  >;
  const entry = values[code];
  if (!entry) return { found: false as const };
  return {
    found: true as const,
    entry,
    inletDe: abbr[entry.inlet]?.de ?? entry.inlet,
    inletEn: abbr[entry.inlet]?.en ?? entry.inlet,
    outletDe: abbr[entry.outlet]?.de ?? entry.outlet,
    outletEn: abbr[entry.outlet]?.en ?? entry.outlet,
  };
}

export function lookupPressure(code: string) {
  const values = pos6Data.values as Record<string, { label: string; bar: number }>;
  return values[code];
}

export function lookupSize(code: string) {
  const values = pos78Data.values as Record<string, { label: string; dn: number }>;
  return values[code];
}

export function lookupScrewMaterial(code: string) {
  const values = pos9Data.values as Record<
    string,
    { label: string; labelEn?: string }
  >;
  return values[code];
}

export function lookupBodyMaterial(code: string) {
  const values = pos10Data.values as Record<
    string,
    { labelDe: string; labelEn: string; materials: string[] }
  >;
  return values[code];
}

export function lookupMedium(code: string) {
  const values = pos11Data.values as Record<
    string,
    { labelDe: string; labelEn: string }
  >;
  return values[code];
}

type Pos12Override = {
  field: string;
  fieldDe: string;
  fieldEn: string;
  values: Record<string, { label?: string; labelDe?: string; labelEn?: string }>;
};

export function lookupHandwheelCap(code: string, family: string | undefined) {
  const overrides = (pos12Data.familyOverrides ?? {}) as unknown as Record<
    string,
    Pos12Override
  >;
  const override = family ? overrides[family] : undefined;
  if (override) {
    const entry = override.values[code];
    return {
      override: true as const,
      fieldDe: override.fieldDe,
      fieldEn: override.fieldEn,
      entry,
    };
  }
  const values = pos12Data.values as Record<
    string,
    { labelDe: string; labelEn: string }
  >;
  return {
    override: false as const,
    fieldDe: pos12Data.fieldDe,
    fieldEn: pos12Data.fieldEn,
    entry: values[code],
  };
}

type Pos1316PositionTable = {
  field: string;
  fieldEn: string;
  values: Record<string, { labelDe: string; labelEn: string }>;
};

type Pos1316Rule = {
  _id?: string;
  type?: "block" | "per-position";
  match?: { pos45In?: string[]; pos1to3?: string };
  appliesToFamilies?: string[];
  values?: Record<string, { labelDe: string; labelEn: string }>;
  positions?: Record<string, Pos1316PositionTable>;
};

export function lookupConnectionDetails(
  pos1316: string,
  pos45: string,
  pos1to3: string,
  family: string | undefined
): {
  found: boolean;
  labelDe?: string;
  labelEn?: string;
  matchedRule?: string;
  perPosition?: Array<{
    pos: string;
    code: string;
    fieldDe: string;
    fieldEn: string;
    found: boolean;
    labelDe?: string;
    labelEn?: string;
  }>;
} {
  const rules = (pos1316Data.rules ?? []) as unknown as Pos1316Rule[];
  for (const rule of rules) {
    const m = rule.match ?? {};
    if (m.pos45In && !m.pos45In.includes(pos45)) continue;
    if (m.pos1to3 && m.pos1to3 !== pos1to3) continue;
    if (rule.appliesToFamilies && family && !rule.appliesToFamilies.includes(family)) {
      continue;
    }
    const ruleType = rule.type ?? "block";

    if (ruleType === "block" && rule.values) {
      const entry = rule.values[pos1316];
      if (entry) {
        return {
          found: true,
          labelDe: entry.labelDe,
          labelEn: entry.labelEn,
          matchedRule: m.pos45In
            ? `Pos 4-5 ∈ {${m.pos45In.join(",")}}`
            : `Pos 1-3 = ${m.pos1to3 ?? "*"}`,
        };
      }
    }

    if (ruleType === "per-position" && rule.positions) {
      // pos1316 has 4 chars representing positions 13, 14, 15, 16
      const chars = pos1316.split("");
      const positions = ["13", "14", "15", "16"];
      const perPosition: Array<{
        pos: string;
        code: string;
        fieldDe: string;
        fieldEn: string;
        found: boolean;
        labelDe?: string;
        labelEn?: string;
      }> = [];
      const summaryDe: string[] = [];
      const summaryEn: string[] = [];
      let allFound = true;

      for (let i = 0; i < 4; i++) {
        const pos = positions[i];
        const code = chars[i] ?? "";
        const table = rule.positions[pos];
        if (!table) {
          perPosition.push({
            pos,
            code,
            fieldDe: `Pos ${pos}`,
            fieldEn: `Pos ${pos}`,
            found: false,
          });
          allFound = false;
          continue;
        }
        const entry = table.values[code];
        if (entry) {
          perPosition.push({
            pos,
            code,
            fieldDe: table.field,
            fieldEn: table.fieldEn,
            found: true,
            labelDe: entry.labelDe,
            labelEn: entry.labelEn,
          });
          summaryDe.push(`${table.field}: ${entry.labelDe}`);
          summaryEn.push(`${table.fieldEn}: ${entry.labelEn}`);
        } else {
          perPosition.push({
            pos,
            code,
            fieldDe: table.field,
            fieldEn: table.fieldEn,
            found: false,
          });
          allFound = false;
        }
      }

      if (perPosition.some((p) => p.found)) {
        return {
          found: allFound,
          labelDe: summaryDe.join(" · "),
          labelEn: summaryEn.join(" · "),
          matchedRule: `family=${family} per-position`,
          perPosition,
        };
      }
    }
  }
  return { found: false };
}

type SuffixEntry = { labelDe: string; labelEn: string; addedCodes?: string };

export function lookupSuffix(suffix: string): {
  found: boolean;
  matched?: string;
  entry?: SuffixEntry;
  remainder?: string;
} {
  if (!suffix) return { found: false };
  const values = suffixData.values as unknown as Record<string, SuffixEntry>;
  // Try longest-first match (RMRS before RM, TÜV before T, etc.)
  const keys = Object.keys(values).sort((a, b) => b.length - a.length);
  // Strip a leading comma+digits like "26300C19A5A30100,5" — half-bar pressure variant — preserve as remainder.
  const trimmed = suffix.replace(/^,\d+/, "");
  for (const k of keys) {
    if (trimmed.toUpperCase() === k || trimmed.toUpperCase().startsWith(k)) {
      const remainder = trimmed.slice(k.length) || (suffix !== trimmed ? suffix.replace(trimmed, "") : "");
      return { found: true, matched: k, entry: values[k], remainder };
    }
  }
  return { found: false, remainder: suffix };
}
