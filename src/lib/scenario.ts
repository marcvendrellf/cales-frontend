import type { Action, Commodity, Driver } from "@/types"

/** A driver's signed contribution at a given intensity (1 = as-is). */
function contribution(d: Driver, intensity: number): number {
  const sign = d.direction === "up" ? 1 : -1
  return sign * d.weight * intensity
}

/** Map a 0..100 score to a recommended action (urgency ladder). */
export function scoreToAction(score: number): Action {
  if (score >= 68) return "buy"
  if (score >= 56) return "hedge"
  if (score >= 44) return "monitor"
  return "wait"
}

const SCALE = 70 // how strongly scenario shifts move the score

export interface ScenarioResult {
  score: number
  action: Action
  delta: number
}

/**
 * Recompute score/action given per-driver intensities (default 1 each).
 * Baseline (all intensities = 1) reproduces the commodity's standing score.
 */
export function runScenario(
  c: Commodity,
  intensities: Record<string, number>,
): ScenarioResult {
  const base = c.drivers.reduce((s, d) => s + contribution(d, 1), 0)
  const now = c.drivers.reduce(
    (s, d) => s + contribution(d, intensities[d.id] ?? 1),
    0,
  )
  const score = Math.round(
    Math.max(0, Math.min(100, c.recommendation.score + (now - base) * SCALE)),
  )
  return {
    score,
    action: scoreToAction(score),
    delta: score - c.recommendation.score,
  }
}
