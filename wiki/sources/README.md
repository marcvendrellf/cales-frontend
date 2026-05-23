# Raw Sources

> The immutable evidence layer. **Never edit a file in here** — a source is a record of
> what was true at a point in time. Add new ones; never rewrite. See [../schema.md](../schema.md).

Every source must be logged in the manifest below with: origin, date acquired, frequency,
expected reliability, and how it influences a recommendation. This mirrors the brief's
documentation requirement (every external source must record *origin, fecha, frecuencia,
fiabilidad esperada, cómo influye*).

## Confidentiality

Damm-provided datasets are **confidential to this hackathon weekend**. Keep them in this
folder, reference them from wiki pages, and never paste their contents into the app bundle,
logs, or anything that leaves the repo.

## Manifest

| File / URL | Origin | Acquired | Frequency | Reliability | Influences |
|---|---|---|---|---|---|
| _(pending)_ barley dataset | Damm (confidential) | — | one-off (6 mo history) | high (first-party) | [[barley]] price baseline & seasonality |
| _(pending)_ Cala.ai price feed | Cala.ai | — | structured, ongoing | high | all commodity [[market-signals|spot/forward levels]] |

Add a row the moment a source lands. Reliability ratings are defined in [[data-sources]].
