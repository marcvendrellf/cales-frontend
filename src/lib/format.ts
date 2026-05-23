import type { Action, Reliability, SignalImpact } from "@/types"

export function fmtNumber(n: number, digits = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function fmtPrice(n: number, unit?: string): string {
  const v = fmtNumber(n, n < 100 ? 2 : 0)
  return unit ? `${v} ${unit}` : v
}

export function fmtPct(n: number, withSign = true): string {
  const sign = withSign && n > 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

/** Tailwind text color token per recommendation action. */
export const actionColor: Record<Action, string> = {
  buy: "text-buy",
  wait: "text-wait",
  hedge: "text-hedge",
  monitor: "text-monitor",
}

export const impactColor: Record<SignalImpact, string> = {
  bullish: "text-positive",
  bearish: "text-negative",
  neutral: "text-muted-foreground",
}

export const reliabilityLabel: Record<Reliability, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}
