import hrsData from "@data/lookups/hrs.json";
import hrsConnections from "@data/lookups/hrs-connections.json";
import type { FieldResult } from "../types";

const connections = hrsConnections as unknown as {
  thread: Record<string, { spec: string; labelEn: string }>;
  weldingDimension: Record<string, { dn: string; spec: string; labelEn: string }>;
  flange: Record<string, { dn: string; spec: string; labelEn: string }>;
  fittings: Record<string, { labelDe: string; labelEn: string }>;
};

const data = hrsData as unknown as {
  pos45: Record<string, { labelDe: string; labelEn: string }>;
  pos6: Record<string, { label: string; bar: number }>;
  pos9_inletTable: Record<string, { labelDe: string; labelEn: string }>;
  pos10_ringMaterialTable: Record<string, { labelDe: string; labelEn: string }>;
  pos11_outletTable: Record<string, { labelDe: string; labelEn: string }>;
  pos12_testPort: Record<string, { labelDe: string; labelEn: string }>;
  pos13_inletAccessory: Record<string, { labelDe: string; labelEn: string }>;
  pos14_outletAccessory: Record<string, { labelDe: string; labelEn: string }>;
  pos1516_testPortAccessory: Record<string, { labelDe: string; labelEn: string }>;
};

function entry(table: Record<string, { labelDe: string; labelEn: string }>, code: string) {
  return table[code];
}

function override(
  base: FieldResult,
  table: Record<string, { labelDe: string; labelEn: string }> | undefined,
  fieldDe: string,
  fieldEn: string
): FieldResult {
  if (!table) return base;
  const e = entry(table, base.rawCode);
  if (!e) {
    // Keep base; just rebrand the field labels so the user sees the HRS-specific name.
    return { ...base, fieldDe, fieldEn };
  }
  return {
    ...base,
    fieldDe,
    fieldEn,
    found: true,
    valueDe: e.labelDe,
    valueEn: e.labelEn,
  };
}

// Scan a string for any 2-character substring that's a known thread / welding /
// flange code; return the matching reference rows. Used to surface likely
// connection meanings within the variable HRS Pos 9-16 zone.
export function scanHrsConnectionCodes(s: string): Array<{
  code: string;
  kind: "thread" | "weldingDimension" | "flange";
  labelEn: string;
}> {
  const hits: Array<{
    code: string;
    kind: "thread" | "weldingDimension" | "flange";
    labelEn: string;
  }> = [];
  for (let i = 0; i < s.length - 1; i++) {
    const slice = s.slice(i, i + 2).toUpperCase();
    if (connections.thread[slice]) {
      hits.push({ code: slice, kind: "thread", labelEn: connections.thread[slice].spec });
    } else if (connections.weldingDimension[slice]) {
      hits.push({
        code: slice,
        kind: "weldingDimension",
        labelEn: connections.weldingDimension[slice].labelEn,
      });
    } else if (connections.flange[slice]) {
      hits.push({
        code: slice,
        kind: "flange",
        labelEn: connections.flange[slice].labelEn,
      });
    }
  }
  return hits;
}

export function applyHrsOverrides(
  fields: {
    connectionType: FieldResult;
    pressure: FieldResult;
    screwMaterial: FieldResult;
    bodyMaterial: FieldResult;
    medium: FieldResult;
    handwheelCap: FieldResult;
    connectionDetails: FieldResult;
  },
  pos1316: string,
  pos9to16: string
): typeof fields {
  // Pos 4-5 family table is mostly identical to the standard one but with the
  // 6A code added — only override if the standard lookup didn't find it.
  const cType = data.pos45[fields.connectionType.rawCode];
  const connectionType: FieldResult = cType
    ? {
        ...fields.connectionType,
        found: true,
        valueDe: cType.labelDe,
        valueEn: cType.labelEn,
      }
    : fields.connectionType;

  // Pressure: HRS adds PS120 ("H") which is not in the standard table.
  const p = data.pos6[fields.pressure.rawCode];
  const pressure: FieldResult = p
    ? {
        ...fields.pressure,
        found: true,
        valueDe: p.label,
        valueEn: p.label,
        extra: { bar: p.bar },
      }
    : fields.pressure;

  // Pos 9: HRS connection-table letter (A/L/R)
  const screwMaterial = override(
    fields.screwMaterial,
    data.pos9_inletTable,
    "Anschluss-Tabelle Eingang",
    "Inlet connection table"
  );

  // Pos 10: ring material × table
  const bodyMaterial = override(
    fields.bodyMaterial,
    data.pos10_ringMaterialTable,
    "Anschluss-Tabelle × Rundring (Eingang)",
    "Inlet table × O-ring material"
  );

  // Pos 11: outlet codification
  const medium = override(
    fields.medium,
    data.pos11_outletTable,
    "Anschluss-Codierung Ausgang",
    "Outlet connection code"
  );

  // Pos 12: test-port
  const handwheelCap = override(
    fields.handwheelCap,
    data.pos12_testPort,
    "Prüfanschluss-Codierung",
    "Test-port code"
  );

  // Pos 13-16: per-position accessory codes
  const [c13, c14, c1516a, c1516b] = pos1316.split("");
  const inletAcc = data.pos13_inletAccessory[c13];
  const outletAcc = data.pos14_outletAccessory[c14];
  const testAcc = data.pos1516_testPortAccessory[`${c1516a ?? ""}${c1516b ?? ""}`];

  const summaryDe: string[] = [];
  const summaryEn: string[] = [];
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
  addPart("13", "Zubehör Eingang", "Inlet accessory", c13 ?? "", inletAcc);
  addPart("14", "Zubehör Ausgang", "Outlet accessory", c14 ?? "", outletAcc);
  addPart(
    "15-16",
    "Prüfanschluss-Zubehör",
    "Test-port accessory",
    `${c1516a ?? ""}${c1516b ?? ""}`,
    testAcc
  );

  const found = !!inletAcc && !!outletAcc && !!testAcc;

  // Reference scan: surface any thread / welding / flange code embedded in Pos 9-16
  const refHits = scanHrsConnectionCodes(pos9to16);
  if (refHits.length) {
    const dedup = Array.from(new Map(refHits.map((h) => [h.code, h])).values());
    const note = dedup
      .map((h) => `${h.code}=${h.labelEn} (${h.kind})`)
      .join(" · ");
    summaryEn.push(`Anschlusscodierung-Treffer: ${note}`);
    summaryDe.push(`Anschlusscodierung-Treffer: ${note}`);
  }

  const connectionDetails: FieldResult = {
    ...fields.connectionDetails,
    fieldDe: "HRS Pos 13-16 Zubehör",
    fieldEn: "HRS Pos 13-16 accessories",
    found,
    valueDe: summaryDe.length ? summaryDe.join(" · ") : fields.connectionDetails.valueDe,
    valueEn: summaryEn.length ? summaryEn.join(" · ") : fields.connectionDetails.valueEn,
    extra: {
      perPosition,
      hrsOverride: true,
      connectionCodeReference: refHits.length ? refHits : undefined,
    },
  };

  return {
    connectionType,
    pressure,
    screwMaterial,
    bodyMaterial,
    medium,
    handwheelCap,
    connectionDetails,
  };
}
