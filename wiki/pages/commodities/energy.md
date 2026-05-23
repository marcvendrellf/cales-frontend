---
title: Energy
area: commodity
status: maintained
updated: 2026-05-23
sources: [SmartBuy Compras ES briefing, demo dataset (src/data/mock.ts)]
---

# Energy

Power and gas. Brewing and packaging are energy-intensive, and energy also passes through into
[[aluminium]] (smelting) and [[pet]] (petrochemical) costs — so it's both a direct cost and an
upstream driver of the other categories.

## Snapshot

> Figures are **representative demo values** [^demo] pending the live OMIP / TTF feeds.

- Spot: **92 EUR/MWh** · +1.6% 24h · +11.2% 30d · trend **up**.
- **Standing recommendation: HEDGE** — horizon **lock 6 months (through Q4)**.
- Risk/opportunity score **69 / 100** · confidence **70%**.
- Rationale: two-sided risk is high — low gas storage and a forecast cold snap skew the tail
  upward, but mild scenarios exist. Don't chase spot; hedge a 6-month strip to cap exposure into
  winter. The hedge horizon is explicit per the [[recommendation-framework]].

## Drivers

Net contribution to the call (weights from the demo dataset). See [[market-signals]].

**Upward pressure**
- **TTF gas spiking** (30%) — upstream feedstock; gas sets the marginal EU power price. [^en-cala]
- **Low gas storage levels** (24%) — inventory & flows; below the 5-yr seasonal norm. [^en-gie]
- **Forecast cold snap** (20%) — weather; lifts heating demand. [^en-wx]

**Downward pressure**
- **Strong renewable output** (16%) — macro; high wind/solar depresses wholesale power. [^en-omip]

## Leading signals

- **OMIP power forward curve** (Iberian) and **TTF gas curve** — see [[data-sources]].
- **Gas storage levels** and **weather forecasts** (seasonal lead).
- Curve shape: backwardation vs. contango (see [[glossary]]).

## Sources

| Source | Reliability | Feeds |
|---|---|---|
| Cala.ai feed [^en-cala] | High | TTF gas curve, spot |
| GIE / Macro feed [^en-gie] | High | gas storage levels |
| Weather feed [^en-wx] | Medium | heating-demand forecast |
| OMIP [^en-omip] | High | Iberian power forwards |

See [[data-sources]] for reliability definitions.

## Historical episodes

- **2021–22 European gas crisis** — 74% match. Gas and power spiked and cascaded into
  [[aluminium]] smelter curtailments — the canonical cross-commodity contagion analogue, and the
  reason exposure is hedged rather than left open.

## Open questions

- Damm's exposure: fixed contracts vs. spot share, and the exact strip to hedge.
- Iberian (OMIP) vs. broader EU power — which curve is the right reference?

[^demo]: Representative figures from the demo dataset (`src/data/mock.ts`), used for the
    hackathon demo until the live feed is connected.
[^en-cala]: Cala.ai feed — TTF front-month up double digits WoW (2026-05-22).
[^en-gie]: GIE / Macro feed — EU gas storage below the 5-year seasonal average (2026-05-21).
[^en-wx]: Weather feed — below-normal temperatures forecast across NW Europe (2026-05-22).
[^en-omip]: OMIP — Iberian power forwards firm but volatile on renewables (2026-05-22).
