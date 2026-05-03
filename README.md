# GEA AWP Speaking Number Decoder — V1.2 AWP PoC

Decode GEA AWP material codes (Erzeugnisnummernschlüssel / ENS) — 16-character "speaking numbers" where each position encodes a specification (product family, connection type, pressure, size, materials, medium, options).

## What's covered

- **Single-number decode** via web form at `/`
- **Batch decode** of CSV / XLS / XLSX files at `/batch` — runs entirely in the browser, files are not uploaded
- **JSON API** at `/api/decode?code=...` — same decoder, served as a Netlify Function
- **Privacy** & **EULA** pages

### Decoded variants

| Family / Format | Status |
|---|---|
| AVRS, AVR, AVB, HRAR, HRAB, RV, RVA, RVAK, WVR, WVB, SS standard codes | ✅ All 16 positions |
| Cast-iron G-variants (16G, 22G, 26G, 27G, 28G, 29G, 52G) | ✅ |
| 24 SonderKürzel suffixes (RM, CF, HR, GR, TR, XR, NZ, TÜV, ABS, KR, RMRS, NK, DNV, LR, AD, AL, AM, DS, CI, EU, HT, P, EXP, comma-decimal half-bar) | ✅ |
| Production-status prefixes (X / Y / Z) | ✅ |
| DGL pressure-gas-line sub-system (with explicit D/F pressure or `.` ambiguous) | ✅ |
| BS-Kit burst-disc sub-system (44201, 44202) | ✅ |
| Flange / accessory kits (15752, 45752, 15760, 17760, 44660, 152, 157, 452) | ✅ |
| ANSI S+M+D-Kit (063 prefix) — Pos 12 thread system + Pos 13-14 ANSI class/face | ✅ |
| Schraubverbindungen kits (000 prefix) | ✅ |
| HRS / HRSN family override (Pos 9-16 reinterpreted) + ~200 reference connection codes | ✅ |
| Safety-valve override (SVA / SVU) — Pos 4-5 = set pressure, Pos 12 = connection variant | ✅ |
| AUMA actuator pattern detection (`A5AD` at Pos 9-12) | ✅ flagged with note |

## Documented but pending real-world sample codes

The following families are confirmed in the customer catalogues at [awpvalves.com](https://awpvalves.com/products/) but their internal Pos 1-3 prefixes are not in any source we have. Once a real material number from any of these is supplied, wiring it up is straightforward.

- **SSO** — Schnellschlußventile / quick-closing valves for oil drainage
- **UVU**, **UVA**, **UVR**, **UVRK** — overflow valves
- **ORV / ORVA** — oil-pressure-regulating valves
- **OF / DOF** — oil filters / double oil filters
- **TR / TRplus** — thermostatic 3-way valves
- **WVR-SVA / WVR-SVU / WVR-AL-SVA / WVR-AL-SVU** — dual safety-valve combinations (catalogue page 18.4 layout: Pos 6 = pressure × handwheel, Pos 9 = temperature × screw material — different from standalone safety valves)
- **KV, KVplus, AK, KVE, KVP, AKE, AKP** — ball / butterfly valves
- **SF, SFR, SF-AVR, SFR-AVR, SFCS** — suction filters
- **FT** — filter driers
- **HSX** — high-pressure float valves
- **DA, SGL** — flow indicators / sight glasses
- **GPV** — gas-powered valves
- **RVZ** — flange check valves
- **AVR-MAV / HRAR-MAV** — electric-actuator combinations

## Run locally

```bash
npm install --legacy-peer-deps
npm run validate:lookups   # check JSON lookup tables against Zod schemas
npm test                   # decoder + batch unit tests
npm run dev                # http://localhost:3000
```

## Smoke-test the API

```bash
curl 'http://localhost:3000/api/decode?code=24020C14A5A30100' | jq
curl 'http://localhost:3000/api/decode?code=26G00C15A5A30000' | jq
curl 'http://localhost:3000/api/decode?code=01884.15.5/00R11' | jq
curl 'http://localhost:3000/api/decode?code=44201.10.5/xx001' | jq
curl 'http://localhost:3000/api/decode?code=Y26300C19A5A30000' | jq
curl 'http://localhost:3000/api/decode?code=06301D13A5A11000' | jq
```

## Project layout

```
data/lookups/      Position 1-13-16, suffixes, dgl, bskit, kits, hrs, hrs-connections,
                   safety-valves — 16 JSON files validated by Zod schemas.
src/decoder/       Pure-TS decoder + sub-system modules
src/schemas/       Zod schemas for lookup data and decoded output
src/batch/         CSV + XLSX parsing and the decode pipeline
src/app/           Next.js App Router pages: /, /batch, /privacy, /eula, /api/decode
src/components/    React UI components
tests/             Vitest unit tests
```

## Sources

- `Example part number definition AWP.pdf` (pages 18.0-18.7)
- `AW: GEA AWP - Decoding speaking numbers.pdf`
- `Auszug ENS Technischer Katalog AWP 21.08.2003.pdf`
- `ENS-System 16Steller mit SonderKürzel.xlsx`
- `ENS-System Druckgasleitung.xlsx`
- `ENS-System HRS_Anschlüsse und Zubehör.xlsx` (3 sheets)
- `ENS-System WV-SV-Kombinationen.xlsx` (5 sheets)

## Deploy to Netlify

The repo includes `netlify.toml` configured for `@netlify/plugin-nextjs`. Push to GitHub, connect the repo in Netlify — API routes deploy automatically as Netlify Functions.

---

© 2026 XAPPO Enterprises Ltd. — V1.2 AWP PoC
