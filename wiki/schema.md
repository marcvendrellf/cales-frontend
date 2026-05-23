# Wiki Schema

> The constitution for this wiki. Read this first, every session, before ingesting,
> querying, or editing. If a rule here conflicts with an instinct, the rule wins.
> Pattern: Karpathy's "LLM Wiki" — a persistent, interlinked, LLM-maintained knowledge base.

## What this wiki is

A living knowledge base about the commodity markets **SmartBuy** reasons over —
**aluminium, PET, energy, barley** — and the signals, drivers, and sources that drive
a *buy / wait / hedge / monitor* decision for Damm's procurement team.

It is **not** the app. The app (this `cales-frontend`) renders recommendations. This wiki
is the *why* behind them: the durable, explainable, source-cited reasoning the hackathon
brief demands. When the app needs to justify a call, the justification lives here.

## The three layers

1. **Raw sources** (`sources/`) — immutable. Datasets, articles, reports, price pulls,
   COT releases. Never edit a source; it is evidence. Add new ones, never rewrite.
2. **The wiki** (`pages/`) — LLM-written markdown. Synthesised, interlinked, always current.
   This is the layer that compounds.
3. **This schema** (`schema.md`) — the rules and workflows below.

Navigation lives in two files at the root: [index.md](index.md) (catalogue) and
[log.md](log.md) (chronological ledger).

## Directory layout

```
wiki/
  schema.md                  ← you are here
  index.md                   ← catalogue of every page, grouped by area
  log.md                     ← append-only ledger of ingests / queries / lints
  pages/
    commodities/
      aluminium.md
      pet.md
      energy.md
      barley.md
    market-signals.md        ← cross-commodity signal taxonomy
    data-sources.md          ← every source we trust, with reliability ratings
    recommendation-framework.md  ← how buy/wait/hedge/monitor is decided
    glossary.md              ← domain terms (contango, COT, TTF, vPET…)
  sources/                   ← raw, immutable evidence (see sources/README.md)
```

## Page format

Every page in `pages/` starts with this frontmatter:

```yaml
---
title: Human-readable title
area: commodity | signals | sources | framework | reference
status: stub | draft | maintained
updated: YYYY-MM-DD
sources: [list of sources/ filenames or URLs this page draws on]
---
```

Then the body. Conventions for the body:

- **Wikilinks**: cross-reference other pages with `[[page-name]]` (slug without `.md`).
  Link liberally. A `[[link]]` to a page that doesn't exist yet is a *to-do marker*, not an error.
- **Cite evidence inline**: when a claim rests on a source, mark it `[^src]` and footnote it
  at the bottom pointing to the `sources/` file or URL. Unsourced claims are allowed but should
  be flagged with `(unverified)`.
- **Lead with the decision-relevant fact.** This wiki exists to inform a buy/wait/hedge/monitor
  call. Bury nothing that changes a recommendation.
- **Date anything time-sensitive.** Prices, positions, forecasts rot fast. Write absolute
  dates (`2026-05-23`), never "last week".

## Commodity page structure

Each `commodities/*.md` page should converge on these sections (create stubs early, fill over time):

1. **Snapshot** — current price level, trend, and the standing recommendation with horizon.
2. **Drivers** — what pushes price up / down, each linked to [[market-signals]].
3. **Leading signals** — the *advance* indicators that move before the spot market reacts.
   This is the heart of the brief: see signals before the market does.
4. **Sources** — where we get data, linked to [[data-sources]] with reliability.
5. **Historical episodes** — past analogues worth pattern-matching against today.
6. **Open questions** — gaps, unverified claims, things to ingest next.

## Operations

### Ingest (new source arrives)

1. Drop the raw artifact in `sources/` (or record its URL + access date there).
2. Read it. Decide which 1–15 wiki pages it touches.
3. Update **each** affected page: fold in the new fact, add the `[^src]` citation, fix any
   cross-reference it changes. Do not create a new page when an existing one should grow.
4. Append one line to [log.md](log.md): date, source, pages touched, one-sentence why.
5. If the source contradicts an existing claim, resolve it now (newer/more-reliable wins) and
   note the resolution. Never leave two pages disagreeing.

### Query (a question is asked)

1. Check [index.md](index.md) → open the relevant pages → synthesise the answer from them.
2. If the answer required real work (new synthesis, a non-obvious connection), **file it back**:
   add it to the right page so the next query is free.
3. If you couldn't answer because of a gap, record it under that page's *Open questions* and
   in [log.md](log.md) as a query-miss — that's the ingest backlog.

### Lint (periodic health check)

Run when the wiki feels stale or before a demo. Check for:
- **Contradictions** — two pages stating incompatible facts.
- **Orphans** — pages no `[[link]]` points to, or links pointing to nonexistent pages.
- **Staleness** — `updated:` older than the data it describes; prices/positions past their shelf life.
- **Unsourced load-bearing claims** — anything driving a recommendation that lacks a `[^src]`.
- **Index drift** — pages missing from [index.md](index.md), or index entries for deleted pages.

Record the lint pass in [log.md](log.md) with what was fixed.

## Conventions

- **Slugs** are lowercase-kebab, matching filenames (`market-signals`, `aluminium`).
- **One concept per page.** If a section grows past ~a screen and earns its own cross-links, split it out.
- **Recommendations are explainable or they don't ship.** Every standing recommendation on a
  commodity page must trace through [[recommendation-framework]] to named drivers and cited sources.
- **Confidential data stays here.** Damm-provided datasets are confidential to this hackathon —
  reference them in `sources/`, never paste them into the app or anything that leaves the repo.
