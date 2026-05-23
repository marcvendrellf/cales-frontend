import { useMemo, useState } from "react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { Card } from "@/components/ui/card"
import { ScoreGauge } from "@/components/common/ScoreGauge"
import { AnimatedNumber } from "@/components/common/AnimatedNumber"
import { TrendArrow } from "@/components/common/TrendArrow"
import {
  dailyChangeFill,
  monthlyReturnStyle,
  priceDirectionHex,
} from "@/lib/chart-colors"
import { DriversCall } from "@/components/common/DriversCall"
import { RelatedNews } from "@/components/common/RelatedNews"
import { fmtDate, fmtPct, actionColor } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Action, Commodity, PricePoint } from "@/types"

/* ─── Accent palette per action ────────────────────────────────── */

const ACCENT: Record<Action, string> = {
  buy: "#22c55e",
  hedge: "#e0b341",
  wait: "#60a5fa",
  monitor: "#94a3b8",
}

const GLOW: Record<Action, string> = {
  buy: "rgba(34,197,94,0.13)",
  hedge: "rgba(224,179,65,0.13)",
  wait: "rgba(96,165,250,0.10)",
  monitor: "rgba(148,163,184,0.08)",
}

/* ─── Calendar heatmap ──────────────────────────────────────────── */

interface DayCell { date: string; value: number; pct: number }

function buildCalendar(series: PricePoint[]) {
  if (series.length < 2) return []
  const daily: DayCell[] = series.map((p, i) => ({
    date: p.date,
    value: p.value,
    pct: i === 0 ? 0 : ((p.value - series[i - 1].value) / series[i - 1].value) * 100,
  }))
  const firstDow = new Date(daily[0].date + "T12:00:00Z").getUTCDay()
  const padded: (DayCell | null)[] = [...Array(firstDow).fill(null), ...daily]
  const weeks: (DayCell | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))
  return weeks
}

function CalendarHeatmap({ series }: { series: PricePoint[] }) {
  const weeks = useMemo(() => buildCalendar(series), [series])
  const [hovered, setHovered] = useState<DayCell | null>(null)

  if (!weeks.length) return null

  const CELL = 13; const GAP = 3; const STEP = CELL + GAP
  const DOW_W = 20; const HEAD_H = 18
  const svgW = DOW_W + weeks.length * STEP
  const svgH = HEAD_H + 7 * STEP

  const monthSeen = new Set<string>()
  const monthLabels: { wi: number; label: string }[] = []
  weeks.forEach((week, wi) => {
    const c = week.find(Boolean)
    if (!c) return
    const d = new Date(c.date + "T12:00:00Z")
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    if (!monthSeen.has(key)) {
      monthSeen.add(key)
      monthLabels.push({ wi, label: d.toLocaleString("en-US", { month: "short" }) })
    }
  })

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Daily price change
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            6-month calendar · each cell = 1 trading day
          </p>
        </div>
        {hovered && (
          <div className="text-right">
            <p className="font-mono text-[11px] text-muted-foreground">{fmtDate(hovered.date)}</p>
            <p
              className={cn(
                "font-mono text-sm font-medium",
                hovered.pct >= 0 ? "text-positive" : "text-negative",
              )}
            >
              {hovered.pct > 0 ? "+" : ""}{hovered.pct.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: "block", width: "100%", maxHeight: 155 }}>
          {["S","M","T","W","T","F","S"].map((d, i) => (
            i % 2 === 1 && (
              <text key={i} x={DOW_W - 4} y={HEAD_H + i * STEP + CELL * 0.78}
                textAnchor="end" fontSize={8} fill="#6b6560">{d}</text>
            )
          ))}
          {monthLabels.map(({ wi, label }) => (
            <text key={wi} x={DOW_W + wi * STEP} y={13} fontSize={8} fill="#6b6560">{label}</text>
          ))}
          {weeks.map((week, wi) =>
            week.map((cell, di) => (
              <rect
                key={`${wi}-${di}`}
                x={DOW_W + wi * STEP} y={HEAD_H + di * STEP}
                width={CELL} height={CELL} rx={2.5}
                fill={cell ? dailyChangeFill(cell.pct) : "#211e1b"}
                opacity={cell ? 1 : 0.35}
                onMouseEnter={() => cell && setHovered(cell)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: cell ? "pointer" : "default" }}
              />
            ))
          )}
        </svg>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Down</span>
        {["#b91c1c", "#f87171", "#4ade80", "#15803d"].map((fill) => (
          <div key={fill} className="size-3 rounded-sm" style={{ background: fill }} />
        ))}
        <span>Up</span>
      </div>
    </div>
  )
}

/* ─── Monthly returns strip ─────────────────────────────────────── */

function MonthlyStrip({ series }: { series: PricePoint[] }) {
  const months = useMemo(() => {
    const byMonth: Record<string, number[]> = {}
    series.forEach(p => { (byMonth[p.date.slice(0, 7)] ??= []).push(p.value) })
    return Object.entries(byMonth).map(([m, vals]) => ({
      label: new Date(m + "-15").toLocaleString("en-US", { month: "short" }),
      pct: ((vals[vals.length - 1] - vals[0]) / vals[0]) * 100,
    }))
  }, [series])

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Monthly returns</p>
      <div className="flex gap-2">
        {months.map(({ label, pct }) => (
          <div key={label} className="flex-1 space-y-1.5 text-center">
            <div
              className="flex items-center justify-center rounded-md"
              style={{ height: 52, ...monthlyReturnStyle(pct) }}
            >
              <span
                className={cn(
                  "font-mono text-xs font-semibold",
                  pct >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {fmtPct(pct)}
              </span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Driver radar ──────────────────────────────────────────────── */

function DriverRadar({ c, accent }: { c: Commodity; accent: string }) {
  const data = useMemo(() => {
    const byCategory: Record<string, number> = {}
    c.drivers.forEach(d => {
      byCategory[d.category] = (byCategory[d.category] ?? 0) + d.weight * 100
    })
    const max = Math.max(...Object.values(byCategory))
    return Object.entries(byCategory).map(([cat, val]) => ({
      subject: cat.replace(" & ", "\n& "),
      value: Math.round(val),
      fullMark: Math.ceil(max) + 5,
    }))
  }, [c.drivers])

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Signal category breakdown
      </p>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
            <PolarGrid stroke="#3a3530" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#6b6560" }} />
            <Radar
              dataKey="value" stroke={accent} fill={accent}
              fillOpacity={0.18} strokeWidth={1.5}
            />
            <RechartsTooltip
              contentStyle={{ background: "#211e1b", border: "1px solid #4a443d", borderRadius: 6, fontSize: 12 }}
              formatter={(value) => [`${Number(value ?? 0)}%`, "Weight"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ─── Main export ───────────────────────────────────────────────── */

export function ReportPreview({ c }: { c: Commodity }) {
  const rec = c.recommendation
  const chartAccent = priceDirectionHex(c.trend, c.change30d)
  const accent = ACCENT[rec.action]
  const glow = GLOW[rec.action]

  return (
    <div className="space-y-5 pb-28">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-xl border border-border/60"
        style={{ background: `radial-gradient(ellipse 65% 130% at 90% 50%, ${glow}, transparent 68%), hsl(var(--card))` }}
      >
        {/* dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative grid gap-8 p-8 lg:grid-cols-[1fr_auto]">
          {/* Left */}
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Cales · Procurement report · {fmtDate(rec.updatedAt)}
              </p>
              <h1 className="display-serif mt-2 text-5xl leading-[1.05] lg:text-6xl">{c.name}</h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
            </div>

            <div className="flex flex-wrap items-end gap-8">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Spot price</p>
                <p className="mt-1 font-mono text-3xl tabular-nums">
                  <AnimatedNumber value={c.spot} digits={c.spot < 100 ? 2 : 0} />
                  <span className="ml-1.5 text-sm text-muted-foreground">{c.unit}</span>
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <TrendArrow change={c.change24h} /> 24h
                  <TrendArrow change={c.change30d} trend={c.trend} /> 30d
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Horizon</p>
                <p className="mt-1 text-sm font-medium">{rec.horizon}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Confidence</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${rec.confidence * 100}%`, background: accent }} />
                  </div>
                  <span className="font-mono text-sm">{Math.round(rec.confidence * 100)}%</span>
                </div>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-relaxed text-foreground/80">{rec.summary}</p>
          </div>

          {/* Right: gauge */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div style={{ filter: `drop-shadow(0 0 32px ${glow})` }}>
              <ScoreGauge score={rec.score} size={180} />
            </div>
            <p className={cn("font-mono text-xs font-bold uppercase tracking-[0.25em]", actionColor[rec.action])}>
              {rec.action}
            </p>
          </div>
        </div>
      </div>

      {/* ── Calendar heatmap ── */}
      <Card className="p-5">
        <CalendarHeatmap series={c.series} />
      </Card>

      <Card className="p-5">
        <DriversCall commodity={c} variant="report" />
      </Card>

      {/* ── Monthly strip + radar / news ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="space-y-6 p-5">
          <MonthlyStrip series={c.series} />
          <div className="border-t border-border/40 pt-5">
            <DriverRadar c={c} accent={chartAccent} />
          </div>
        </Card>

        <Card className="p-5">
          <RelatedNews items={c.evidence} drivers={c.drivers} variant="report" />
        </Card>
      </div>

    </div>
  )
}
