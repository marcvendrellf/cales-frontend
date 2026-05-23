---
title: Aluminium
area: commodity
status: maintained
updated: 2026-05-23
sources: [SmartBuy Compras ES briefing, demo dataset (src/data/mock.ts)]
---

# Aluminium

The highest-economic-weight category for Damm procurement per the brief — cans and packaging.
Decisions here move cost and margin the most, so the bar for an explainable call is highest.

## Snapshot

> Figures are **representative demo values** [^demo] pending the live Cala.ai / LME feed.

- Spot: **2,685 USD/t** · +0.8% 24h · +6.4% 30d · trend **up**.
- **Standing recommendation: BUY** — horizon **next 3 months**.
- Risk/opportunity score **78 / 100** · confidence **74%**.
- Rationale: upward pressure building from European smelter curtailments and a firming
  energy curve while LME stocks draw down; the setup rhymes with 2021. Secure base volume
  now; hedge the tail to Q3.

## Drivers

Net contribution to the call (weights from the demo dataset). See [[market-signals]].

**Upward pressure**
- **Smelter curtailments** (32%) — sector news. Two EU smelters cut on power economics. [^al-fm]
- **Energy forward curve firming** (26%) — upstream feedstock; smelting is power-intensive, so
  [[energy]] cost passes through. [^al-cala]
- **LME warehouse stocks drawing down** (21%) — inventory & flows; on-warrant stocks down a 5th
  straight week. [^al-lme]
- **Managed-money net long rising** (12%) — speculative positioning; funds adding length ahead
  of spot. [^al-cot]

**Downward pressure**
- **Soft Chinese industrial demand** (9%) — macro; weaker PMI caps the upside. [^al-pmi]

(Latent, not yet active: CBAM / carbon costs on imports, see [[glossary]]; geopolitics /
sanctions on producing regions; a stronger EUR vs. USD lowering the euro cost.)

## Leading signals

- **LME warehouse stock trend** + **calendar spread** (contango/backwardation, see [[glossary]]).
- **COT positioning** — managed-money net long/short.
- **Energy forward curve** ([[energy]]) — smelter economics lead metal supply.
- **Regional premiums** (Fastmarkets) on top of LME base.

## Sources

| Source | Reliability | Feeds |
|---|---|---|
| Fastmarkets [^al-fm] | High | smelter / premium news |
| Cala.ai feed [^al-cala] | High | power forward curve, spot |
| LME [^al-lme] | High | on-warrant stocks |
| CFTC (COT) [^al-cot] | Medium | speculative positioning |
| Macro feed [^al-pmi] | Medium | China PMI |

See [[data-sources]] for reliability definitions.

## Historical episodes

- **2021–22 energy-crisis smelter curtailments** — 81% match to the current setup. Surging
  European power forced shutdowns; aluminium ran **+34% over ~4 months**. Buyers who waited paid
  materially more — the core argument for the standing BUY.

## Open questions

- Which premium series (duty-paid Rotterdam?) does Damm actually pay against?
- Wire snapshot to the live Cala.ai / LME feed (currently demo values).

[^demo]: Representative figures from the demo dataset (`src/data/mock.ts`), used for the
    hackathon demo until the live feed is connected.
[^al-fm]: Fastmarkets — EU smelter curtailment announcements (2026-05-20).
[^al-cala]: Cala.ai feed — power forward curve, front-quarter +9% MoM (2026-05-22).
[^al-lme]: LME — on-warrant aluminium stocks down a 5th consecutive week (2026-05-21).
[^al-cot]: CFTC Commitments of Traders — managed-money net length up WoW (2026-05-16).
[^al-pmi]: Macro feed — China manufacturing PMI below 50 (2026-05-18).
