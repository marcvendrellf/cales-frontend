import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { ExternalLink, X } from "lucide-react"
import { useCommodities, useSignals } from "@/api/hooks"
import { WarehouseChart } from "@/components/common/WarehouseChart"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  NewsListSkeleton,
  OverviewChartSkeleton,
} from "@/components/common/PageSkeletons"
import { fmtDate, impactColor, reliabilityLabel, relativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Commodity, MarketSignal } from "@/types"

type TrendTooltipPayload = {
  color?: string
  dataKey?: string | number
  name?: string | number
  value?: number | string
}

const chartConfig = {
  aluminium: {
    label: "Aluminium",
    color: "var(--chart-1)",
  },
  pet: {
    label: "PET",
    color: "var(--chart-2)",
  },
  energy: {
    label: "Energy",
    color: "var(--chart-3)",
  },
  barley: {
    label: "Barley",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

function makeRelativeTrendData(commodities: Commodity[]) {
  const firstSeries = commodities[0]?.series ?? []
  if (!firstSeries.length) return []

  const sampledIndexes = Array.from({ length: 7 }, (_, index) =>
    Math.round((index / 6) * (firstSeries.length - 1)),
  )

  return sampledIndexes.map((seriesIndex, pointIndex) => {
    const point: Record<string, string | number> = {
      month: firstSeries[seriesIndex]?.date ?? "",
    }

    commodities.forEach((commodity) => {
      const commodityIndex = Math.round(
        (pointIndex / 6) * Math.max(commodity.series.length - 1, 0),
      )
      const ath = Math.max(...commodity.series.map((entry) => entry.value))
      const value = commodity.series[commodityIndex]?.value

      if (ath && value != null) {
        point[commodity.id] = Math.round((value / ath) * 1000) / 10
      }
    })

    return point
  })
}

function RelativeTrendTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string | number
  payload?: TrendTooltipPayload[]
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-48 rounded-lg border border-border/70 bg-background px-3 py-2.5 text-xs shadow-xl">
      <p className="mb-2 font-medium text-foreground">
        {new Date(String(label)).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </p>
      <div className="space-y-2">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "")
          const config = chartConfig[key as keyof typeof chartConfig]
          const value = Number(item.value)

          return (
            <div key={key} className="flex items-center justify-between gap-5">
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color ?? config?.color }}
                />
                <span className="truncate">{config?.label ?? key}</span>
              </span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {Number.isFinite(value) ? value.toLocaleString() : item.value}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const reliabilityStyle = {
  high: "text-buy border-buy/30",
  medium: "text-hedge border-hedge/30",
  low: "text-monitor border-monitor/30",
} as const

function signalSearchUrl(signal: MarketSignal) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${signal.source} ${signal.headline}`)}`
}

function SignalPreviewDialog({
  signal,
  open,
  closing,
  onOpenChange,
  onRequestClose,
}: {
  signal: MarketSignal | null
  open: boolean
  closing: boolean
  onOpenChange: (open: boolean) => void
  onRequestClose: () => void
}) {
  if (!signal) return null

  const isCala = signal.source.toLowerCase().includes("cala")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        forceMount
        showCloseButton={false}
        className={cn(
          "h-[82vh] max-h-[760px] w-[88vw] max-w-6xl gap-0 overflow-hidden p-0 sm:max-w-6xl",
          closing && "animate-out fade-out-0 zoom-out-95 duration-200",
        )}
      >
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onRequestClose()
          }}
          className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-md border border-border bg-background/50 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>
        <div className="border-b border-border/70 bg-card/60 px-7 py-4">
          <DialogHeader className="gap-2 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-sm font-semibold", isCala ? "text-cala" : "text-foreground")}>
                {signal.source}
              </span>
              <span className={cn("rounded-xs border px-1.5 py-px text-[10px] uppercase tracking-wide", reliabilityStyle[signal.reliability])}>
                {reliabilityLabel[signal.reliability]}
              </span>
              <span className={cn("font-mono text-[11px] uppercase", impactColor[signal.impact])}>
                {signal.impact}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {fmtDate(signal.time)}
              </span>
            </div>
            <DialogTitle className="display-serif max-w-5xl pr-12 text-left text-2xl leading-tight">
              {signal.headline}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6 px-7 py-7 lg:px-10">
            <DialogDescription asChild>
              <div className="max-w-5xl space-y-6">
                <p className="text-xl leading-9 text-foreground/90">{signal.detail}</p>
              </div>
            </DialogDescription>

            <section className="max-w-5xl rounded-lg border border-border/60 bg-background/35 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Market signal
              </p>
              <h3 className="mt-3 text-2xl font-medium text-foreground">{signal.category}</h3>
              <p className="mt-3 text-lg leading-8 text-muted-foreground">
                This signal is tagged to {signal.commodityId === "macro" ? "macro exposure" : signal.commodityId} and is currently classified as {signal.impact}.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-xs border border-border px-2 py-1">{signal.category}</span>
                <span>{reliabilityLabel[signal.reliability]} reliability</span>
                <span>{relativeTime(signal.time)}</span>
              </div>
            </section>

            <section className="max-w-5xl rounded-lg border border-border/60 bg-background/35 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Why this matters
              </p>
              <p className="mt-3 text-lg leading-8 text-muted-foreground">
                This news item updates one of the live market signals used on the dashboard. Use it to understand whether the latest pressure is bullish, bearish, or neutral before opening a commodity report.
              </p>
            </section>
          </div>

          <aside className="border-t border-border/70 bg-background/25 px-7 py-7 md:border-l md:border-t-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Source details
            </p>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Publisher</dt>
                <dd className={cn("mt-1 text-sm font-medium", isCala ? "text-cala" : "text-foreground")}>
                  {signal.source}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Reliability</dt>
                <dd className="mt-1 text-sm font-medium">{reliabilityLabel[signal.reliability]}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Published</dt>
                <dd className="mt-1 font-mono text-sm">{fmtDate(signal.time)}</dd>
              </div>
            </dl>
            <a
              href={signalSearchUrl(signal)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
            >
              <ExternalLink className="size-3.5" />
              Open in new tab
            </a>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewsItem({
  signal,
  onSelect,
}: {
  signal: MarketSignal
  onSelect: (signal: MarketSignal) => void
}) {
  const dot =
    signal.impact === "bullish"
      ? "bg-positive"
      : signal.impact === "bearish"
        ? "bg-negative"
        : "bg-muted-foreground"
  return (
    <button
      type="button"
      onClick={() => onSelect(signal)}
      className="block w-full border-b border-border/70 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
    >
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className={cn("size-1.5 rounded-full", dot)} />
        <span className="font-mono uppercase">{signal.commodityId}</span>
        <span>·</span>
        <span>{relativeTime(signal.time)}</span>
        <span className={cn("ml-auto font-mono uppercase", impactColor[signal.impact])}>
          {signal.impact}
        </span>
      </div>
      <h2 className="mt-2 text-sm font-medium text-foreground">{signal.headline}</h2>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{signal.detail}</p>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>{signal.source}</span>
      </div>
    </button>
  )
}

export function Overview() {
  const { data, isLoading } = useCommodities()
  const { data: signals, isLoading: signalsLoading } = useSignals()
  const [selectedSignal, setSelectedSignal] = useState<MarketSignal | null>(null)
  const [signalOpen, setSignalOpen] = useState(false)
  const [signalClosing, setSignalClosing] = useState(false)
  useBreadcrumbs([{ label: "Overview" }])

  const relativeTrendData = useMemo(() => makeRelativeTrendData(data ?? []), [data])

  const closeSignal = () => {
    document
      .querySelector('[role="dialog"]')
      ?.classList.add("animate-out", "fade-out-0", "zoom-out-95", "duration-200")
    window.setTimeout(() => {
      setSignalOpen(false)
      setSignalClosing(false)
      setSelectedSignal(null)
    }, 200)
  }

  return (
    <div className="space-y-6">
      <section>
        <div>
          <h1 className="display-serif text-4xl sm:text-5xl">
            Hello, <span className="text-muted-foreground">Marc</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Current price movement and market news for tracked elements.
          </p>
        </div>
      </section>

      <Card className="rounded-lg border-border/70 bg-card/40 py-5 shadow-none">
        <CardContent className="px-3 sm:px-5">
          {isLoading ? (
            <OverviewChartSkeleton />
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="min-w-0 flex-1">
                <div className="mb-4 px-2">
                  <p className="text-sm font-medium text-foreground">Relative trend</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Six-month price trend indexed against each element's observed ATH.
                  </p>
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart
                    accessibilityLayer
                    data={relativeTrendData}
                    margin={{ left: 12, right: 12, top: 12 }}
                  >
                <CartesianGrid vertical={false} />
                <YAxis
                  width={48}
                  domain={[70, 100]}
                  ticks={[70, 80, 90, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}%`}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Date(String(value)).toLocaleDateString("en-US", { month: "short" })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<RelativeTrendTooltip />}
                />
                <defs>
                  {Object.keys(chartConfig).map((key) => (
                    <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.55} />
                      <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                {Object.keys(chartConfig).map((key) => (
                  <Area
                    key={key}
                    dataKey={key}
                    type="natural"
                    connectNulls
                    fill={`url(#fill-${key})`}
                    fillOpacity={0.4}
                    stroke={`var(--color-${key})`}
                    strokeWidth={2.2}
                    dot={{ r: 3, strokeWidth: 0, fill: `var(--color-${key})` }}
                    activeDot={{ r: 4 }}
                  />
                ))}
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </div>
              <div className="flex flex-col lg:w-[260px] lg:shrink-0 lg:border-l lg:border-border/70 lg:pl-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground">Warehouse fill</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Current fill level by storable element.
                  </p>
                </div>
                <WarehouseChart commodities={data ?? []} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="overflow-hidden rounded-lg border border-border/70 bg-card/40">
        <div className="flex items-end justify-between gap-4 border-b border-border/70 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-medium">News</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest market signals affecting tracked elements.
            </p>
          </div>
        </div>
        {signalsLoading ? (
          <NewsListSkeleton count={4} />
        ) : (
          signals?.slice(0, 4).map((signal) => (
            <NewsItem
              key={signal.id}
              signal={signal}
              onSelect={(nextSignal) => {
                setSelectedSignal(nextSignal)
                setSignalClosing(false)
                setSignalOpen(true)
              }}
            />
          ))
        )}
      </section>

      <SignalPreviewDialog
        signal={selectedSignal}
        open={signalOpen || signalClosing}
        closing={signalClosing}
        onOpenChange={(open) => {
          if (open) {
            setSignalClosing(false)
            setSignalOpen(true)
            return
          }
          closeSignal()
        }}
        onRequestClose={closeSignal}
      />
    </div>
  )
}
