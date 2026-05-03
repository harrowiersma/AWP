import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Pos13Schema,
  Pos45Schema,
  Pos6Schema,
  Pos78Schema,
  Pos9Schema,
  Pos10Schema,
  Pos11Schema,
  Pos12Schema,
  Pos1316Schema,
  SuffixSchema,
  DglSchema,
  BsKitSchema,
  KitsSchema,
  HrsSchema,
  SafetyValveSchema,
} from "../src/schemas/lookup";

const here = (rel: string) =>
  resolve(import.meta.dirname ?? new URL(".", import.meta.url).pathname, rel);

const files: Array<{ path: string; schema: { parse: (data: unknown) => unknown } }> = [
  { path: "../data/lookups/position-1-3.json", schema: Pos13Schema },
  { path: "../data/lookups/position-4-5.json", schema: Pos45Schema },
  { path: "../data/lookups/position-6.json", schema: Pos6Schema },
  { path: "../data/lookups/position-7-8.json", schema: Pos78Schema },
  { path: "../data/lookups/position-9.json", schema: Pos9Schema },
  { path: "../data/lookups/position-10.json", schema: Pos10Schema },
  { path: "../data/lookups/position-11.json", schema: Pos11Schema },
  { path: "../data/lookups/position-12.json", schema: Pos12Schema },
  { path: "../data/lookups/position-13-16.json", schema: Pos1316Schema },
  { path: "../data/lookups/suffixes.json", schema: SuffixSchema },
  { path: "../data/lookups/dgl.json", schema: DglSchema },
  { path: "../data/lookups/bskit.json", schema: BsKitSchema },
  { path: "../data/lookups/kits.json", schema: KitsSchema },
  { path: "../data/lookups/hrs.json", schema: HrsSchema },
  { path: "../data/lookups/safety-valves.json", schema: SafetyValveSchema },
];

let failures = 0;
for (const { path, schema } of files) {
  const fullPath = here(path);
  const raw = readFileSync(fullPath, "utf-8");
  const data = JSON.parse(raw);
  try {
    schema.parse(data);
    console.log(`OK  ${path}`);
  } catch (err) {
    failures += 1;
    console.error(`FAIL ${path}`);
    console.error(err);
  }
}

if (failures > 0) {
  console.error(`\n${failures} lookup file(s) failed validation`);
  process.exit(1);
}
console.log("\nAll lookup files valid.");
