import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { useCommodities, useSignals } from "@/api/hooks"
import { WarehouseChart } from "@/components/common/WarehouseChart"
import { NewsModal, signalToNews } from "@/components/common/NewsModal"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
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
import { impactColor, relativeTime } from "@/lib/format"
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
  useBreadcrumbs([{ label: "Overview" }])

  const relativeTrendData = useMemo(() => makeRelativeTrendData(data ?? []), [data])

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
                setSignalOpen(true)
              }}
            />
          ))
        )}
      </section>

      <NewsModal
        news={selectedSignal ? signalToNews(selectedSignal) : null}
        open={signalOpen}
        onOpenChange={setSignalOpen}
      />
    </div>
  )
}
