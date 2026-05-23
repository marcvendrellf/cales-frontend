import { Link, useNavigate, useParams } from "react-router-dom"
import { ExternalLink, History, TrendingDown, TrendingUp } from "lucide-react"
import { useCommodity } from "@/api/hooks"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { PriceChart } from "@/components/common/PriceChart"
import { ScoreGauge } from "@/components/common/ScoreGauge"
import { ActionBadge } from "@/components/common/ActionBadge"
import { TrendArrow } from "@/components/common/TrendArrow"
import { AnimatedNumber } from "@/components/common/AnimatedNumber"
import { WhatIfPanel } from "@/components/common/WhatIfPanel"
import { CommodityArt } from "@/components/common/CommodityArt"
import { fmtDate, reliabilityLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Commodity, CommodityId, Driver, Evidence } from "@/types"

const reliabilityStyle = {
  high: "text-buy border-buy/30",
  medium: "text-hedge border-hedge/30",
  low: "text-monitor border-monitor/30",
} as const

function DriverBar({ d, max }: { d: Driver; max: number }) {
  const Icon = d.direction === "up" ? TrendingUp : TrendingDown
  const color = d.direction === "up" ? "bg-positive" : "bg-negative"
  const text = d.direction === "up" ? "text-positive" : "text-negative"
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm">
          <Icon className={cn("size-4", text)} />
          {d.label}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {Math.round(d.weight * 100)}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${(d.weight / max) * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {d.category} · {d.rationale}
      </p>
    </div>
  )
}

function EvidenceRow({ e }: { e: Evidence }) {
  const isCala = e.source.toLowerCase().includes("cala")
  return (
    <div className="flex gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              isCala && "text-cala",
            )}
          >
            {e.source}
          </span>
          <span
            className={cn(
              "rounded-xs border px-1.5 py-px text-[10px] uppercase tracking-wide",
              reliabilityStyle[e.reliability],
            )}
          >
            {reliabilityLabel[e.reliability]}
          </span>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {fmtDate(e.date)}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground/90">{e.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{e.excerpt}</p>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

function Loaded({ c }: { c: Commodity }) {
  const navigate = useNavigate()
  const maxWeight = Math.max(...c.drivers.map((d) => d.weight))
  const up = c.drivers.filter((d) => d.direction === "up")
  const down = c.drivers.filter((d) => d.direction === "down")
  const rec = c.recommendation
  const sparkColor =
    c.trend === "up" ? "positive" : c.trend === "down" ? "negative" : "muted-foreground"

  useBreadcrumbs([
    { label: "Elements", onClick: () => navigate("/elements") },
    { label: c.name },
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <CommodityArt id={c.id} className="size-14 shrink-0" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="display-serif text-3xl">{c.name}</h1>
              <ActionBadge action={rec.action} size="lg" />
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{c.blurb}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl tabular-nums">
            <AnimatedNumber value={c.spot} digits={c.spot < 100 ? 2 : 0} />
            <span className="ml-1.5 text-sm text-muted-foreground">{c.unit}</span>
          </div>
          <div className="mt-1 flex items-center justify-end gap-3">
            <TrendArrow change={c.change24h} /> <span className="text-[11px] text-muted-foreground">24h</span>
            <TrendArrow change={c.change30d} trend={c.trend} /> <span className="text-[11px] text-muted-foreground">30d</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">Price · 6 months</h2>
              <span className="font-mono text-[11px] text-cala">Cala.ai feed</span>
            </div>
            <PriceChart data={c.series} color={sparkColor} priceLine={c.spot} unit={c.unit} />
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-medium">What's driving the call</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Net of forces pushing price up vs. down — each tagged to a signal category.
            </p>
            <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-positive">
                  <TrendingUp className="size-3.5" /> Upward pressure
                </p>
                <Separator className="mb-1" />
                {up.map((d) => (
                  <DriverBar key={d.id} d={d} max={maxWeight} />
                ))}
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-negative">
                  <TrendingDown className="size-3.5" /> Downward pressure
                </p>
                <Separator className="mb-1" />
                {down.map((d) => (
                  <DriverBar key={d.id} d={d} max={maxWeight} />
                ))}
              </div>
            </div>
          </Card>

          {c.history.length > 0 && (
            <Card className="p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-medium">
                <History className="size-4" /> Historical analogue
              </h2>
              {c.history.map((h) => (
                <div key={h.id} className="mt-3 rounded-md border border-border bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{h.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {Math.round(h.similarity * 100)}% match
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{h.period}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{h.summary}</p>
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Outcome: </span>
                    {h.outcome}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-col items-center">
              <ScoreGauge score={rec.score} />
              <ActionBadge action={rec.action} size="lg" className="mt-2" />
              <p className="mt-2 font-mono text-xs text-muted-foreground">{rec.horizon}</p>
            </div>
            <Separator className="my-4" />
            <p className="text-sm leading-relaxed text-foreground/90">{rec.summary}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Confidence</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-foreground/70"
                    style={{ width: `${rec.confidence * 100}%` }}
                  />
                </div>
                <span className="font-mono">{Math.round(rec.confidence * 100)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <WhatIfPanel c={c} />
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Evidence</h2>
              <span className="font-mono text-[11px] text-muted-foreground">
                {c.evidence.length} sources
              </span>
            </div>
            <div className="mt-1 divide-y divide-border">
              {c.evidence.map((e) => (
                <EvidenceRow key={e.id} e={e} />
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
              <ExternalLink className="size-3" />
              Provenance documented per source — see the wiki.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function CommodityDetail() {
  const { id } = useParams<{ id: CommodityId }>()
  const { data, isLoading, isError } = useCommodity(id as CommodityId)

  if (isLoading) return <DetailSkeleton />
  if (isError || !data)
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Commodity not found.</p>
        <Link to="/elements" className="mt-2 inline-block text-sm underline">
          Back to Elements
        </Link>
      </div>
    )

  return <Loaded c={data} />
}
