# GEA AWP Speaking Number Decoder

Decode GEA AWP material codes (Erzeugnisnummernschlüssel / ENS) — 16-character "speaking numbers" where each position encodes a specification (product family, connection type, pressure, size, materials, medium, options).

## What's in v1 (Phase 1 MVP)

- **Single-number decode** via web form at `/`
- **Batch decode** of CSV / XLS / XLSX files at `/batch` — runs entirely in the browser, files are not uploaded
- **JSON API** at `/api/decode?code=...` — same decoder, served as a Netlify Function
- Decodes **positions 1 to 12** of the standard 16-character code, including the `G`-suffix cast-iron variant (e.g. `26G00...`) and the strainer mesh-size override at position 12

Positions 13-16 (context-dependent connection details), SonderKürzel suffixes, and the DGL/HRS/WV-SV sub-systems are deferred to later phases.

## Run locally

```bash
npm install --legacy-peer-deps
npm run validate:lookups   # check JSON lookup tables against Zod schemas
npm test                   # run decoder + batch unit tests
npm run dev                # http://localhost:3000
```

## Smoke-test the API

```bash
curl 'http://localhost:3000/api/decode?code=24020C14A5A30100' | jq
curl 'http://localhost:3000/api/decode?code=26G00C15A5A30000' | jq
```

## Project layout

```
data/lookups/      Position 1-12 lookup tables (JSON, hand-transcribed from PDF)
scripts/           Build-time validation
src/decoder/       Pure-TS decoder (runs identically client + server)
src/schemas/       Zod schemas for lookup data and decoded output
src/batch/         CSV + XLSX parsing and the decode pipeline
src/app/           Next.js App Router pages and API route
src/components/    React UI components
tests/             Vitest unit tests with fixtures from source PDFs
```

## Sources

Lookup tables are transcribed from:

- `Example part number definition AWP.pdf` (pages 18.0-18.7)
- `AW: GEA AWP - Decoding speaking numbers.pdf`
- `Auszug ENS Technischer Katalog AWP 21.08.2003.pdf`

`data/lookups/version.json` records source provenance for the current data.

## Deploy to Netlify

The repo includes `netlify.toml` configured for `@netlify/plugin-nextjs`. Push to GitHub, connect the repo in Netlify — API routes deploy automatically as Netlify Functions.
