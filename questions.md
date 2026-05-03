# Open Questions for the GEA AWP Speaking-Number Decoder

**Project:** AWP Speaking Number Decoder (V1.2 AWP PoC, Xappo)
**Live demo:** https://github.com/harrowiersma/AWP (deployed via Netlify)
**Date:** 2026-05-03
**To:** Erik Jacob (Director Engineering, GEA AWP) and team
**From:** Harro M. Wiersma (Xappo)

Hi Erik,

Following on from your December 2025 email and the catalog/Excel material we have, we've now decoded the bulk of GEA AWP speaking numbers — including all standard 16-position codes, sub-systems (DGL, BS-Kit, flange/screw-end kits), the cast-iron G-variant, all 24 documented SonderKürzel suffixes, the safety-valve override (Pos 4-5 = set pressure for 442/444/446/448/455-458) and the HRS Pos 9-16 family override.

There are a handful of product families and code variants that are clearly **referenced** in the AWP catalogues at awpvalves.com but whose **internal speaking-number prefixes** are not in any source document we have. We can't get them from ValveCalc either (the oneclick VDI session is gated by authentication).

Could you please share **one or two real material numbers** for each of the families below? With one example per family the decoding logic is straightforward to add (~10 min each). We don't need full tables — a single representative SAP material number is enough; we'll back-derive the encoding from the existing catalog data.

---

## 1. Quick-closing valves — SSO

> Catalog reference: *Oil Management Valves for Refrigeration*, page 5 (SSO / UVU / ORV / OF / DOF / TR), section "SSO".
> Documented variants: SSO AE, SSO AE NIRO, SSO FL, SSO-AVR D AE/DV, SSO-AVR D AE NIRO, SSO-AVR E AE, SSO-AVR D FL, SSO-AVR E FL.

**Question:** What is the Pos 1-3 prefix used for SSO codes? Is the standard 16-character layout used, or is there a sub-system layout (analogous to DGL or BS-Kit)?

**One sample SSO material number would resolve this.**

---

## 2. Overflow valves — UVA, UVU, UVR, UVRK

> Catalog reference: *Overflow Valves* (UVA / RVD / RVR / UVR / UVRK / GPV) and *Oil Management* (UVU).
> Documented variants: UVUA AE, UVUB AE, UVUA FL NIRO, UVUB SE NIRO, etc.

**Question:** Catalog page 18.3 of the master ENS spec describes a layout for *safety valves SVA, SVU, overflow valves UVA, UVU, oil-pressure-control valves ORV* — i.e. UVA/UVU share the safety-valve layout. Our decoder already applies the safety-valve override to families that begin with `44` or `45`. Do UVA/UVU material numbers also start with `44` / `45`, or do they use different Pos 1-3 prefixes?

**Sample numbers needed:** one UVA, one UVU.

---

## 3. Oil-pressure-regulating valves — ORV / ORVA

> Catalog reference: *Oil Management Valves*, ORV section.
> Documented variants: ORVA AE, ORVA FL.

**Question:** Same as UVA/UVU above — do ORV codes use the safety-valve / overflow layout (Pos 4-5 = set pressure), or a standard valve layout?

**Sample numbers needed:** one ORV / ORVA.

---

## 4. Oil filters — OF, DOF

> Catalog reference: *Oil Management Valves*, OF / DOF sections.
> Documented variants: OF AE, OF FL, OF LE, DOF FL, DOF FL EPE.

**Question:** What is the Pos 1-3 prefix for oil filters? Are they encoded as standalone valves, or as a special "filter" sub-system like SS strainers (Pos 12 = mesh size override)?

**Sample numbers needed:** one OF, one DOF.

---

## 5. Thermostatic 3-way valves — TR, TRplus

> Catalog reference: *Oil Management Valves*, TR / TRplus sections.
> Documented variants: TR AE, TR AE NH3, TR AE NIRO, TR FL, TRplus AE, TRplus FL NH3 NIRO, etc.

**Question:** What is the Pos 1-3 prefix for TR / TRplus codes? Are they treated as a WVR-style 3-way valve?

**Sample numbers needed:** one TR, one TRplus.

---

## 6. Dual safety-valve combinations — WVR-SVA, WVR-SVU, WVB-SVA, WVB-SVU

> Catalog reference: *Dual Safety Valves for Refrigeration*, table of contents lists 35 sub-variants (WVR-SVAA FL, WVR-SVUA FL NIRO, WVR-SVUA P FL, WVR AL-SVAA FL, WVR AL-SVUA FL, …).
> Master spec page 18.4 / 18.5 describes a unique combined layout for these:
>  - Pos 6 = nominal pressure **combined** with handwheel/cap
>  - Pos 9 = temperature range **combined** with screw material
>  - Pos 4-5 = set pressure (Einstelldruck), like single safety valves
>  - Pos 1 = "types" (different from single SV's "types + temperature range")

**Question:** Do dual combinations use a distinct Pos 1-3 prefix (different from `44x` / `45x`), or do they reuse the WVR/WVB family prefix (`24x` / `23x`) and switch to the combination layout via context? An example clarifying which case applies — and a real material number — would let us implement the page-18.4 layout precisely.

**Sample numbers needed:** one WVR-SVA combination, one WVR-AL-SVU combination.

---

## 7. Ball & butterfly valves — KV, KVplus, AK

> Catalog reference: *Service Valves* (HRS, HRSB, HRSN) is fully decoded already. Ball / butterfly valves (KV, KVplus, AK) and their actuator variants (KVE, KVP, AKE, AKP) are listed in the catalog but the SonderKürzel sheet only references KH/AK as 6-character codes (e.g. `xxxxxx` Mat with charge, `Zxxxxxx` FE-Teil — different format).

**Question:**
1. Are KV / KVplus / AK valves encoded as **standard 16-character ENS codes**, or do they use the **6-character KH/AK format** mentioned in the SonderKürzel sheet?
2. If the latter, can we get the encoding key for the 6-character format?

**Sample numbers needed:** one KV, one AK, one KVplus, one electric-actuator variant (KVE or AKE).

---

## 8. Suction filters — SF, SFR, SF-AVR, SFR-AVR, SFCS

> Catalog reference: *Suction Filters*.
> Documented variants: SF, SFR, SF-AVR, SFR-AVR, SFCS.

**Question:** What is the Pos 1-3 prefix for SF / SFR codes? Are SF-AVR variants encoded as a kit / combination?

**Sample numbers needed:** one SF, one SF-AVR.

---

## 9. Other documented but uncoded families

For each of these, **one sample material number** is enough to wire into the decoder:

- **FT** — filter driers
- **HSX** — high-pressure float valves
- **DA / SGL** — flow indicators / sight glasses
- **GPV** — gas-powered valves
- **RVZ** — flange check valves
- **AVR-MAV / HRAR-MAV** — electric-actuator combinations of AVR / HRAR

---

## 10. AUMA electric actuator suffix — full pattern

> Reference: SonderKürzel sheet row 68 — `xxxxx.xxA5ADxxxxA` with the note "AUMA-Antrieb D = AUMA-Antrieb SA14.2 (Antrieb-Größe und Typ); A = 230V 50Hz 1-ph AC, IP68, 4-20 mA".

We've added detection of the `A5AD` pattern at Pos 9-12 and surface a warning. For complete decoding we need:

1. The **full encoding scheme for Pos 9-12** under the AUMA pattern: are positions 9-12 always `A5AD`, or do they encode the actuator variant?
2. The **full alphabet of trailing-suffix letters** (after position 16): the example shows just `A` = 230V 50Hz 1-ph 4-20 mA, but presumably there are codes for 24 V DC, 400 V 3-phase, IP65 vs IP68, 0/4-20 mA / Profibus / Modbus, etc.

---

## 11. SonderKürzel sheet rows 70-87 — exotic prefixes / suffixes

For completeness and to handle the long tail, please confirm or supply the encoding for:

| Pattern | Sheet description | Example we'd like |
|---|---|---|
| `026xxx.xx.xxxxxM` | HRS-Antrieb (HRSN, HRSB) | one full code |
| `026xxx.xx.xxxxx00` | HRS / KH / AK Kaufteil (Mat mit Charge), no accessories | one full code |
| `026xxx.xx.xxxxxXX` | HRS / KH / AK FE-Teil with accessories (= 026xxx.xx.xxxxx00 + Zubehör) | one full code |
| `xxxxx_KS` | HZM (Heizmantel bei KH) — Gehäuseschalen | one full code |
| `xxxxx_V` | HZM (Heizmantel bei KH) — Inhalt Kleinteile | one full code |
| `xxxxx_Ch` | meaning unclear (Spindel und Ventilteller enthalten?) | clarification |
| `xxxxx_EK` | Dienstleistung — Fremdfertigung | clarification on encoding |
| `01884E20.5010R23FE` | Einzelteil oder Baugruppe als FE-Teil mit Produktions-Nr. | confirmation that `FE` is a trailing suffix |

---

## 12. Pos 13-16 details for AVR / HRAR / RV families

The catalog footers say **"Details bitte bei AWP nachfragen!"** for Pos 13-16 across many families. We've documented the standard cases (`0000`, `1100`, `EE00`, `8800`) and added a per-position fallback (Pos 13 = connection series, Pos 14 = flange variant, Pos 15-16 = inlet/outlet fittings analogous to AVRS) — but a more complete list of valid Pos 13-16 codes for each family would be useful.

**Question:** Is there an internal AWP table that enumerates all Pos 13-16 codes per (Pos 1-3 family, Pos 4-5 connection)? Even a couple of representative non-standard values per family would help us reduce the number of "Details please request from AWP" fall-backs.

---

## 13. HRS Anschlusscodierung — table B and table C

> Reference: HRS Anschlusscodierung sheet has codes AL, AY, A4-AZ, AC, A0-AD, AS, AT, AF-AK, AM, AJ, AQ, A1-A3, AN, AU-AX, AE, AP, AR, AI, B0-BU — that's table A.

We've ingested **table A** in full (~140 codes). The HRS Sondernummern sheet references **tables B** (BASF) and **C** (BASF variant) as well, but we don't have their content.

**Question:** Can you share the full thread / welding-end / dimension / flange code lists for tables B and C?

---

## 14. Comma-decimal half-bar variants

> Reference: SonderKürzel row 65 — `45818C12A5A20010,5` with the note "Stkl mit 18,5 bar anlegen".

We currently parse a trailing `,N` (where N is a single digit) as a half-bar offset on safety-valve set pressures. **Question:** Are there other comma-suffixed variants (e.g. `,25` for quarter-bar, or `,5` on non-safety-valve codes), or is `,5` always a half-bar offset on Pos 4-5 of a safety-valve code?

---

## 15. RVZ flange check valves — does this family exist as ENS codes?

> Catalog mentions RVZ but the master ENS spec doesn't have a Pos 1-3 entry for it. The RV/RVA/RVAK families are documented with prefixes 28x/98x/29x/27x, but RVZ has no listing.

**Question:** Are RVZ codes a separate Pos 1-3 family, or are they encoded as one of the existing RV variants with a specific Pos 13-16 marker?

---

## How to respond

Even partial answers help. The simplest format is just a list of real material numbers, e.g.:

```
SSO:        47100D15A5A30000
UVU:        46101F12A5A10000
ORV:        43205D10A5A20000
TR:         28800F15A5A30000
WVR-SVA:    13420C12A5A30100   (or whatever the prefix actually is)
KV DN50:    62010C155A          (or 6-char form, please clarify)
SF:         51200E18A5A30000
…
```

We'll wire each of these into the decoder within a day of receipt and republish the live demo.

Thanks in advance — looking forward to closing these last few gaps.

Best regards,
Harro M. Wiersma
Xappo Enterprises Ltd.
office@xappo.enterprises

---

*Generated from the V1.2 AWP PoC decoder — 63 unit tests passing across 16 lookup tables covering all 10 source Excel sheets and the 4 AWP catalog PDFs we have.*
