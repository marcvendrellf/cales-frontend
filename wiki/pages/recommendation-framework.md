---
title: Recommendation Framework
area: framework
status: maintained
updated: 2026-05-23
sources: [SmartBuy Compras ES briefing, demo dataset (src/data/mock.ts)]
---

# Recommendation Framework

How SmartBuy turns signals into one of four actions. Every standing recommendation on a
commodity page must trace back through this framework to named [[market-signals]] and cited
[[data-sources]] — that is the brief's *explainability* bar.

## The four actions

| Action | Meaning | Typical trigger |
|---|---|---|
| **Buy** | Secure volume now. | Strong upward pressure building; leading signals point higher; price still below expected forward path. |
| **Wait** | Hold off; conditions favour buying later. | Downward pressure or oversupply; spot likely to fall within the horizon. |
| **Hedge** | Lock price via futures/forwards without taking physical now. | High two-sided uncertainty; tail risk to the upside you can't absorb. State *for how long* to hedge. |
| **Monitor** | No edge either way; keep watching named triggers. | Mixed / weak signals; no driver dominant. |

The brief is explicit: predicting the *exact price* is not the goal — **trend, risk,
opportunity, and an explainable action** are. Volume sizing is a nice-to-have, not required.

## Inputs to a decision

1. **Direction of leading signals** — see [[market-signals]]. Weight signals that move
   *before* the spot market over lagging confirmation.
2. **Risk / opportunity score** per commodity — a 0–100 read of how stretched the
   upside-vs-downside is. High score = act; low = monitor.
3. **Driver balance** — net of what's pushing up vs. down (each driver lives on the
   commodity page, tagged to a signal).
4. **Horizon** — over what window the call holds. A hedge recommendation *must* state duration.
5. **Historical analogue** — does the current setup rhyme with a past episode? (See each
   commodity's *Historical episodes*.)

## Output contract (what the app must show)

For the selected commodity, render:
- the **action** (buy / wait / hedge / monitor) + **horizon**,
- the **risk/opportunity score**,
- the **drivers** pushing up and down, each with its source,
- the **evidence** trail (cited sources), and
- a **historical comparison** when one exists.

A recommendation that can't show its drivers and sources is not shippable (see [[schema]]
and the brief's evaluation criteria: *accionabilidad, solidez técnica, explicabilidad*).

## Scoring (as implemented)

The app exposes a **0–100 risk/opportunity score** and a **confidence %** per commodity, plus a
live **what-if** that re-derives the score when a driver's intensity is changed (`src/lib/scenario.ts`).

- **Driver contribution** = `sign(direction) × weight × intensity`, summed across a commodity's
  drivers. Baseline intensity = 1 reproduces the standing score.
- **Scenario score** = `clamp(standingScore + (Σnow − Σbase) × 70, 0, 100)`.
- **Score → action ladder** (used by the what-if recompute): **≥68 buy · ≥56 hedge · ≥44 monitor ·
  <44 wait**.

> Note: the *standing* recommendations on the commodity pages are editorially set from the driver
> balance + historical analogue, and may differ from a pure threshold read (e.g. [[energy]] scores
> 69 yet the standing call is HEDGE because two-sided tail risk dominates). The ladder above governs
> the *interactive scenario*, not the baseline call.

## Open questions

- Wire the score to the live Cala.ai feed (currently driven by the demo dataset).
- Reconcile the editorial standing call with the threshold ladder, or document the override rule
  per commodity.
