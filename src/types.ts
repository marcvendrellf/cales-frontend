// Domain model for Cales. Shaped to match what the backend (cales-backend)
// is expected to return, so swapping mock -> real API is a base-URL flip.

export type CommodityId = "aluminium" | "pet" | "energy" | "barley"

export type Action = "buy" | "wait" | "hedge" | "monitor"

export type SignalImpact = "bullish" | "bearish" | "neutral"

export type Reliability = "high" | "medium" | "low"

export type Direction = "up" | "down"

export type Trend = "up" | "down" | "flat"

export interface PricePoint {
  /** ISO date, "YYYY-MM-DD" */
  date: string
  value: number
}

export interface Driver {
  id: string
  label: string
  direction: Direction
  /** 0..1 — relative contribution to the recommendation */
  weight: number
  /** signal category, see wiki/pages/market-signals.md */
  category: string
  rationale: string
  sourceId?: string
}

export interface Evidence {
  id: string
  title: string
  /** e.g. "Cala.ai", "LME", "ICIS", "Fastmarkets" */
  source: string
  reliability: Reliability
  date: string
  url?: string
  excerpt: string
}

export interface HistoricalAnalogue {
  id: string
  title: string
  /** 0..1 pattern-match strength against the current setup */
  similarity: number
  period: string
  summary: string
  outcome: string
}

export interface RecommendationChange {
  action: Action
  /** ISO date "YYYY-MM-DD" */
  date: string
  note: string
}

export interface Recommendation {
  action: Action
  /** human horizon, e.g. "Next 3 months" */
  horizon: string
  /** 0..100 risk / opportunity score */
  score: number
  /** 0..1 */
  confidence: number
  summary: string
  updatedAt: string
}

export interface Commodity {
  id: CommodityId
  name: string
  /** quote unit, e.g. "USD/t", "EUR/MWh" */
  unit: string
  spot: number
  /** percent change */
  change24h: number
  change30d: number
  trend: Trend
  /** economic weight for Damm, 0..1 — drives ordering / emphasis */
  weight: number
  /** current warehouse fill level, 0..100. Omitted for non-storable elements (e.g. energy). */
  warehouseFillPct?: number
  blurb: string
  recommendation: Recommendation
  /** Chronological log of recommendation changes (oldest first). Last entry matches current recommendation.action. */
  recommendationHistory: RecommendationChange[]
  drivers: Driver[]
  evidence: Evidence[]
  history: HistoricalAnalogue[]
  series: PricePoint[]
}

export interface MarketSignal {
  id: string
  /** ISO timestamp */
  time: string
  commodityId: CommodityId | "macro"
  impact: SignalImpact
  category: string
  headline: string
  detail: string
  source: string
  reliability: Reliability
}

export const ACTION_LABELS: Record<Action, string> = {
  buy: "Buy",
  wait: "Wait",
  hedge: "Hedge",
  monitor: "Monitor",
}
