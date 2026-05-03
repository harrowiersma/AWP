import { z } from "zod";

const labelPair = {
  label: z.string().optional(),
  labelDe: z.string().optional(),
  labelEn: z.string().optional(),
};

export const Pos13Entry = z.object({
  family: z.string(),
  ...labelPair,
  tempRangeC: z.string().optional(),
  register: z.string().nullable().optional(),
});

export const Pos13Schema = z.object({
  position: z.literal("1-3"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  values: z.record(z.string(), Pos13Entry),
  castIronVariants: z.record(z.string(), z.unknown()).optional(),
});

export const Pos45Schema = z.object({
  position: z.literal("4-5"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  abbreviations: z.record(
    z.string(),
    z.object({ de: z.string(), en: z.string() })
  ),
  values: z.record(
    z.string(),
    z.object({
      inlet: z.string(),
      outlet: z.string(),
      coverExtension: z.boolean(),
    })
  ),
});

export const Pos6Schema = z.object({
  position: z.literal("6"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  values: z.record(
    z.string(),
    z.object({
      label: z.string(),
      bar: z.number(),
    })
  ),
});

export const Pos78Schema = z.object({
  position: z.literal("7-8"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  values: z.record(
    z.string(),
    z.object({
      label: z.string(),
      dn: z.number(),
    })
  ),
});

export const Pos9Schema = z.object({
  position: z.literal("9"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  values: z.record(
    z.string(),
    z.object({ label: z.string(), labelEn: z.string().optional() })
  ),
});

export const Pos10Schema = z.object({
  position: z.literal("10"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  values: z.record(
    z.string(),
    z.object({
      labelDe: z.string(),
      labelEn: z.string(),
      materials: z.array(z.string()),
    })
  ),
});

export const Pos11Schema = z.object({
  position: z.literal("11"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  values: z.record(
    z.string(),
    z.object({ labelDe: z.string(), labelEn: z.string() })
  ),
});

export const Pos12Schema = z.object({
  position: z.literal("12"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  values: z.record(
    z.string(),
    z.object({ labelDe: z.string(), labelEn: z.string() })
  ),
  familyOverrides: z.record(z.string(), z.unknown()).optional(),
});

export const Pos1316Schema = z.object({
  position: z.literal("13-16"),
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  rules: z.array(
    z.object({
      match: z
        .object({
          pos45In: z.array(z.string()).optional(),
          pos1to3: z.string().optional(),
        })
        .optional(),
      appliesToFamilies: z.array(z.string()).optional(),
      values: z.record(
        z.string(),
        z.object({ labelDe: z.string(), labelEn: z.string() })
      ),
    })
  ),
});

export const SuffixSchema = z.object({
  field: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  values: z.record(
    z.string(),
    z.object({
      labelDe: z.string(),
      labelEn: z.string(),
      addedCodes: z.string().optional(),
    })
  ),
});
