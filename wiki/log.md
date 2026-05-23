# Wiki Log

> Append-only, chronological ledger. Newest at the top. One line per operation.
> Format: `YYYY-MM-DD · OP · pages touched · one-sentence why`
> OP ∈ {INIT, INGEST, QUERY, QUERY-MISS, LINT}

---

- **2026-05-23 · INGEST** · aluminium, pet, energy, barley, recommendation-framework · Ingested the demo dataset (`src/data/mock.ts`) the app ships with: filled each commodity Snapshot with the standing call (Al=BUY 78 · PET=WAIT 41 · Energy=HEDGE 69 · Barley=MONITOR 52), weighted drivers, cited evidence, and the historical analogue; status draft→maintained. Documented the implemented score/scenario ladder in the framework and resolved the scoring + confidence-band open questions. Snapshot figures flagged as representative pending the live Cala.ai feed.
- **2026-05-23 · INIT** · schema, index, log, all commodity stubs, market-signals, data-sources, recommendation-framework, glossary, sources/README · Bootstrapped the LLM Wiki from the SmartBuy hackathon brief; commodity pages seeded with brief-derived drivers, awaiting first real source ingest (Cala.ai prices, barley dataset).
