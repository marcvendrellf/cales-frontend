import type { Trend } from "@/types"

/** Report charts only: green if price is up, red if down. */
export function priceIncreased(trend: Trend, change30d: number): boolean {
  if (trend === "up") return true
  if (trend === "down") return false
  return change30d >= 0
}

export function priceDirectionHex(trend: Trend, change30d: number): string {
  return priceIncreased(trend, change30d) ? "#74c79a" : "#d9737a"
}

/** Daily % change cell — green up, red down (report calendar). */
export function dailyChangeFill(pct: number): string {
  if (pct >= 0) {
    if (pct > 2.5) return "#15803d"
    if (pct > 1) return "#22c55e"
    return "#4ade80"
  }
  if (pct < -2.5) return "#b91c1c"
  if (pct < -1) return "#ef4444"
  return "#f87171"
}

export function monthlyReturnStyle(pct: number) {
  const up = pct >= 0
  return {
    background: up
      ? `rgba(34,197,94,${Math.min(0.85, Math.abs(pct) / 5)})`
      : `rgba(239,68,68,${Math.min(0.85, Math.abs(pct) / 5)})`,
    border: `1px solid ${up ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
  }
}
