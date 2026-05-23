---
title: Barley
area: commodity
status: maintained
updated: 2026-05-23
sources: [SmartBuy Compras ES briefing, Damm barley dataset (6 mo), demo dataset (src/data/mock.ts)]
---

# Barley

The malting input for brewing (see [[glossary]]). The one commodity with a **first-party Damm
dataset** (6 months of history) — so it's the natural place to backtest the
[[recommendation-framework]] before trusting it on the others.

## Snapshot

> Figures are **representative demo values** [^demo] pending ingestion of the real 6-mo dataset.

- Spot: **218 EUR/t** · +0.2% 24h · +1.3% 30d · trend **flat**.
- **Standing recommendation: MONITOR** — horizon **reassess after crop reports**.
- Risk/opportunity score **52 / 100** · confidence **55%**.
- Rationale: signals are balanced — weather is benign so far and stocks are adequate, but the
  growing season is the swing factor. No edge yet; monitor drought indices and the next
  crop-progress reports.

## Drivers

Net contribution to the call (weights from the demo dataset). See [[market-signals]].

**Downward pressure**
- **Benign growing weather** (26%) — weather & climate; favourable conditions point to decent
  yields. [^ba-expana]
- **Adequate carryover stocks** (20%) — inventory & flows; comfortable vs. demand. [^ba-damm]

**Upward pressure**
- **Drought risk in key regions** (24%) — weather & climate; tail risk if dry conditions develop
  mid-season. [^ba-wx]
- **Firm export demand** (18%) — macro; competing buyers keep a floor under price. [^ba-cala]

The near-offsetting up/down balance is exactly why the call is **monitor**, not buy or wait.

## Leading signals

- **Weather & drought indices** over key growing regions (seasonal lead).
- **Grain futures curve** and calendar spreads (see [[glossary]]).
- **COT positioning** in grains.
- **Crop-progress / yield reports**.

## Sources

| Source | Reliability | Feeds |
|---|---|---|
| Expana [^ba-expana] | High | crop-progress & weather |
| Damm dataset [^ba-damm] | High | barley balance / stocks |
| Weather feed [^ba-wx] | Medium | drought index |
| Cala.ai feed [^ba-cala] | High | export demand |

See [[data-sources]] for reliability definitions.

## Historical episodes

- **2018 European drought** — 48% match. A hot, dry summer cut yields and spiked malting barley —
  the cautionary analogue that flips the call from monitor to buy if drought builds.

## Open questions

- Ingest the real 6-mo Damm dataset (currently demo values) and derive home-grown analogues.
- Dataset shape: malting vs. feed grade? Spot, contract, or index? Region?
- Is 6 months enough to capture seasonality, or do we need an external multi-year series?

[^demo]: Representative figures from the demo dataset (`src/data/mock.ts`), used for the
    hackathon demo until the real dataset is ingested.
[^ba-expana]: Expana — crop conditions rated favourable; dry pockets watched (2026-05-21).
[^ba-damm]: Damm dataset — carryover stocks adequate vs. demand (2026-05-15).
[^ba-wx]: Weather feed — drought index, dry pockets emerging, not yet yield-threatening (2026-05-22).
[^ba-cala]: Cala.ai feed — steady export interest from competing importers (2026-05-20).
