---
title: PET
area: commodity
status: maintained
updated: 2026-05-23
sources: [SmartBuy Compras ES briefing, demo dataset (src/data/mock.ts)]
---

# PET

Bottle/packaging resin. Split into **vPET** (virgin) and **rPET** (recycled) — EU recycled-content
rules shift demand between them, so they must be tracked separately. See [[glossary]].

## Snapshot

> Figures are **representative demo values** [^demo] pending the live Cala.ai / ICIS feed.

- Spot: **1,180 USD/t** · -0.3% 24h · -2.1% 30d · trend **down**.
- **Standing recommendation: WAIT** — horizon **next 4–6 weeks**.
- Risk/opportunity score **41 / 100** · confidence **62%**.
- Rationale: feedstock (PTA/MEG) and crude are easing and Asian import availability is ample, so
  spot likely drifts lower near-term — wait before committing virgin volume. Watch **rPET**
  separately: regulation is decoupling it upward.

## Drivers

Net contribution to the call (weights from the demo dataset). See [[market-signals]].

**Downward pressure**
- **Crude & PTA easing** (30%) — upstream feedstock; lower crude flows into paraxylene → PTA. [^pet-icis]
- **Ample Asia/Turkey imports** (24%) — inventory & flows; arrivals into Europe remain high. [^pet-cala]
- **MEG oversupply** (18%) — upstream feedstock; MEG length caps resin. [^pet-meg]

**Upward pressure**
- **EU recycled-content mandate (rPET)** (28%) — regulation; lifts rPET demand against tight
  recycled supply, diverging from vPET. [^pet-eu]

## Leading signals

- **PTA & MEG spot/forward** and **crude oil** — feedstock leads resin price.
- **ICIS LOR** petrochemical references (see [[data-sources]]).
- **Asia/Turkey import volumes** into Europe — flows.
- **EU regulation calendar** on recycled content — slow but high-impact, esp. for rPET.

## Sources

| Source | Reliability | Feeds |
|---|---|---|
| ICIS (incl. ICIS LOR) [^pet-icis] [^pet-meg] | High | PTA, crude, MEG assessments |
| Cala.ai feed [^pet-cala] | High | PET import volumes, spot |
| EU regulation tracker [^pet-eu] | High | recycled-content thresholds |

See [[data-sources]] for reliability definitions.

## Historical episodes

- **2023 feedstock destocking** — 66% match. Falling crude/PTA pulled vPET **-11% over ~8 weeks**
  before stabilising — waiting was rewarded for virgin resin, the basis for the standing WAIT.

## Open questions

- Recommend separately for vPET vs. rPET, or a blended buy? (App currently shows one call.)
- Best accessible proxy for rPET supply tightness within the demo window.

[^demo]: Representative figures from the demo dataset (`src/data/mock.ts`), used for the
    hackathon demo until the live feed is connected.
[^pet-icis]: ICIS — PTA & crude assessment, PTA spot easing (2026-05-22).
[^pet-cala]: Cala.ai feed — PET import volumes into the EU remain elevated (2026-05-21).
[^pet-meg]: ICIS — MEG assessment, remains long (2026-05-20).
[^pet-eu]: EU regulation tracker — recycled-content thresholds tighten for 2027 (2026-05-12).
