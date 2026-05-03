import { z } from "zod";

export const FieldResultSchema = z.object({
  position: z.string(),
  fieldDe: z.string(),
  fieldEn: z.string(),
  rawCode: z.string(),
  found: z.boolean(),
  valueDe: z.string().optional(),
  valueEn: z.string().optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

export const DecodedNumberSchema = z.object({
  input: z.string(),
  normalized: z.string(),
  valid: z.boolean(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  fields: z.object({
    productType: FieldResultSchema,
    connectionType: FieldResultSchema,
    pressure: FieldResultSchema,
    size: FieldResultSchema,
    screwMaterial: FieldResultSchema,
    bodyMaterial: FieldResultSchema,
    medium: FieldResultSchema,
    handwheelCap: FieldResultSchema,
    connectionDetails: FieldResultSchema,
    suffix: FieldResultSchema,
  }),
});

export type FieldResult = z.infer<typeof FieldResultSchema>;
export type DecodedNumber = z.infer<typeof DecodedNumberSchema>;
