---
title: Market Signals
area: signals
status: draft
updated: 2026-05-23
sources: [SmartBuy Compras ES briefing]
---

# Market Signals

Taxonomy of the signals SmartBuy reasons over. The brief's central ambition: find the
**leading** signals that move *before* the spot market reacts — the information big funds and
market agents use to position early. Lagging signals only confirm what price already shows.

## Leading vs. lagging

- **Leading** — predictive; moves ahead of spot. The edge lives here.
- **Coincident** — moves with spot; useful for confirmation, not anticipation.
- **Lagging** — moves after spot; useful for context and historical pattern-matching.

## Signal categories

| Category | Examples | Lead/lag | Applies to |
|---|---|---|---|
| **Futures curve shape** | Contango vs. backwardation, calendar spreads | leading | [[aluminium]], [[energy]], [[barley]] |
| **Speculative positioning** | COT reports, net long/short of managed money | leading | [[aluminium]], [[energy]], grains |
| **Upstream feedstock prices** | PTA, MEG, crude oil for [[pet]]; gas for power | leading | [[pet]], [[energy]] |
| **Inventory & flows** | LME warehouse stocks, import/export volumes, Asia/Turkey PET imports | leading→coincident | [[aluminium]], [[pet]] |
| **Regulation** | EU recycled-content mandates, CBAM, energy policy | leading (slow) | [[pet]], [[aluminium]], [[energy]] |
| **Geopolitics** | Sanctions, supply-region conflict, trade routes | leading (shock) | all |
| **Weather & climate** | Drought/yield for [[barley]]; cold snaps for [[energy]] | leading (seasonal) | [[barley]], [[energy]] |
| **Logistics costs** | Freight rates, shipping bottlenecks | coincident | all |
| **Macro** | FX (EUR), rates, industrial demand | leading→coincident | all |
| **Sector news** | Smelter closures, plant outages, capacity adds | leading (event) | [[aluminium]], [[pet]] |

## How signals feed a recommendation

Each commodity page lists its active drivers and tags each to a category above. The
[[recommendation-framework]] nets the leading signals into a direction and a risk/opportunity
score. Weighting principle: **a leading signal with a documented source beats a louder
coincident one.**

## Open questions

- Which speculative-positioning feeds (COT release cadence) are usable within the demo window?
- Quantitative lead-time per signal — needs backtesting against the [[barley]] dataset first.
