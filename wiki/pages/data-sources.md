---
title: Data Sources
area: sources
status: draft
updated: 2026-05-23
sources: [SmartBuy Compras ES briefing]
---

# Data Sources

Every source SmartBuy trusts, with a reliability rating and what it feeds. New raw artifacts
are logged in [sources/README.md](../sources/README.md); this page is the *interpretation* layer
— which sources matter for which decision, and how much to trust each.

## Reliability scale

| Rating | Meaning |
|---|---|
| **High** | First-party or authoritative market reference; use directly in recommendations. |
| **Medium** | Reputable but secondary / modelled; corroborate before it drives a call. |
| **Low** | Indicative / noisy / unverified; treat as a hint, flag `(unverified)`. |

## First-party (Damm / hackathon)

| Source | Reliability | Feeds |
|---|---|---|
| Damm barley dataset (6 mo) | High | [[barley]] baseline, seasonality, model backtest |
| Cala.ai structured price feed | High | spot/forward levels across all commodities |

## Reference markets & data providers (named in brief)

| Source | Covers | Reliability |
|---|---|---|
| **Fastmarkets** | Metals & raw-material price assessments | High |
| **Expana** (formerly Mintec) | Agri & food commodity prices | High |
| **OMIP** | Iberian power futures | High → [[energy]] |
| **TTF** | European gas benchmark hub | High → [[energy]] |
| **ICIS** | Petrochemicals (incl. ICIS LOR) | High → [[pet]] |

## External enrichment (to source ourselves)

The brief *expects* teams to add external public data. Candidates, each to be logged with
origin/date/frequency/reliability when ingested:

- **COT reports** (CFTC) — speculative positioning → [[market-signals]]. Medium-High.
- **LME** — aluminium stocks & prices → [[aluminium]]. High.
- **Crude / PTA / MEG** feedstock quotes → [[pet]]. Medium-High.
- **Weather / drought indices** → [[barley]], [[energy]]. Medium.
- **EU regulation trackers** (recycled-content, CBAM) → [[pet]], [[aluminium]]. High but slow.
- **Freight indices** → logistics cost across all. Medium.

## Open questions

- Which of Fastmarkets / Expana / OMIP / TTF / ICIS are actually accessible during the demo?
- Cala.ai feed schema — fields, update frequency, history depth.
