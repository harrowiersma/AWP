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
      _id: z.string().optional(),
      type: z.enum(["block", "per-position"]).optional(),
      match: z
        .object({
          pos45In: z.array(z.string()).optional(),
          pos1to3: z.string().optional(),
        })
        .optional(),
      appliesToFamilies: z.array(z.string()).optional(),
      values: z
        .record(z.string(), z.object({ labelDe: z.string(), labelEn: z.string() }))
        .optional(),
      positions: z
        .record(
          z.string(),
          z.object({
            field: z.string(),
            fieldEn: z.string(),
            values: z.record(
              z.string(),
              z.object({ labelDe: z.string(), labelEn: z.string() })
            ),
          })
        )
        .optional(),
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

export const DglSchema = z.object({
  subsystem: z.literal("DGL"),
  fieldDe: z.string(),
  fieldEn: z.string(),
  type: z.record(z.string(), z.object({ labelDe: z.string(), labelEn: z.string() })),
  connection: z.record(z.string(), z.object({ labelDe: z.string(), labelEn: z.string() })),
  pressure: z.record(
    z.string(),
    z.object({
      labelDe: z.string(),
      labelEn: z.string(),
      bar: z.number().nullable(),
    })
  ),
  size: z.record(z.string(), z.object({ label: z.string(), dn: z.number() })),
  material: z.record(z.string(), z.object({ labelDe: z.string(), labelEn: z.string() })),
  rubric: z.record(z.string(), z.unknown()),
});

const kitTable = z.record(
  z.string(),
  z.object({ labelDe: z.string(), labelEn: z.string() })
);

export const SafetyValveSchema = z.object({
  subsystem: z.literal("SafetyValve"),
  fieldDe: z.string(),
  fieldEn: z.string(),
  appliesToFamilies: z.array(z.string()),
  appliesToPos1to3Prefixes: z.array(z.string()),
  pos45_setPressure: z.object({
    interpretation: z.string(),
  }).passthrough(),
  pos12_connectionVariants: z.object({
    values: kitTable,
  }).passthrough(),
  pos1316_inletOutletAccessories: z.object({
    pos13_inlet: kitTable,
    pos14_outlet: kitTable,
    pos15_inletFittings: kitTable,
    pos16_outletFittings: kitTable,
  }).passthrough(),
});

export const HrsConnectionsSchema = z.object({
  subsystem: z.literal("HRS-Connections"),
  fieldDe: z.string(),
  fieldEn: z.string(),
  thread: z.record(
    z.string(),
    z.object({ spec: z.string(), labelEn: z.string() })
  ),
  weldingDimension: z.record(
    z.string(),
    z.object({ dn: z.string(), spec: z.string(), labelEn: z.string() })
  ),
  flange: z.record(
    z.string(),
    z.object({ dn: z.string(), spec: z.string(), labelEn: z.string() })
  ),
  fittings: kitTable,
});

export const HrsSchema = z.object({
  subsystem: z.literal("HRS"),
  fieldDe: z.string(),
  fieldEn: z.string(),
  pos45: kitTable,
  pos6: z.record(
    z.string(),
    z.object({ label: z.string(), bar: z.number() })
  ),
  pos9_inletTable: kitTable,
  pos10_ringMaterialTable: kitTable,
  pos11_outletTable: kitTable,
  pos12_testPort: kitTable,
  pos13_inletAccessory: kitTable,
  pos14_outletAccessory: kitTable,
  pos1516_testPortAccessory: kitTable,
});

export const KitsSchema = z.object({
  subsystem: z.literal("Kit"),
  fieldDe: z.string(),
  fieldEn: z.string(),
  prefix: z.record(
    z.string(),
    z.object({ labelDe: z.string(), labelEn: z.string(), appliesTo: z.string() })
  ),
  pressure: z.record(
    z.string(),
    z.object({ label: z.string(), bar: z.number().nullable() })
  ),
  screwOrA2: kitTable,
  outletDn: kitTable,
  outletThread: kitTable,
  flangeStandard: kitTable,
  accessoryCode: kitTable,
});

export const BsKitSchema = z.object({
  subsystem: z.literal("BS-Kit"),
  fieldDe: z.string(),
  fieldEn: z.string(),
  _variantNote: z.string().optional(),
  prefix: z.record(z.string(), z.object({ labelDe: z.string(), labelEn: z.string() })),
  size: z.record(z.string(), z.object({ labelDe: z.string(), labelEn: z.string() })),
  material: z.record(z.string(), z.object({ labelDe: z.string(), labelEn: z.string() })),
  variant: z.record(
    z.string(),
    z.object({
      labelDe: z.string(),
      labelEn: z.string(),
      tolerance: z.string().optional(),
    })
  ),
});
