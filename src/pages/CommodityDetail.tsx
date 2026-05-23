import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { Activity, BarChart3, Database, FileText, Gauge, History, Info, ListChecks, Scale } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useCommodity } from "@/api/hooks"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"
import { Card } from "@/components/ui/card"
import { CommodityDetailSkeleton } from "@/components/common/PageSkeletons"
import { DriversCall } from "@/components/common/DriversCall"
import { RelatedNews } from "@/components/common/RelatedNews"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportBuilder } from "@/components/common/ReportBuilder"
import { ReportList } from "@/components/common/ReportList"
import { PriceChart } from "@/components/common/PriceChart"
import { TrendArrow } from "@/components/common/TrendArrow"
import { AnimatedNumber } from "@/components/common/AnimatedNumber"
import { fmtDate, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Commodity, CommodityId } from "@/types"

function seriesChange(c: Commodity) {
  const first = c.series[0]?.value
  const last = c.series.at(-1)?.value
  if (!first || !last) return 0
  return ((last - first) / first) * 100
}

function recentVolatility(c: Commodity) {
  const tail = c.series.slice(-31)
  if (tail.length < 2) return 0

  const moves = tail.slice(1).map((point, index) => {
    const previous = tail[index].value
    return Math.abs(((point.value - previous) / previous) * 100)
  })

  return moves.reduce((sum, move) => sum + move, 0) / moves.length
}

function latestEvidenceDate(c: Commodity) {
  return c.evidence.reduce<string | null>(
    (latest, item) => (latest == null || item.date > latest ? item.date : latest),
    null,
  )
}

function GeneralIndicator({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default",
}: {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  tone?: "default" | "positive" | "negative" | "cala"
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/35 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div
        className={cn(
          "mt-3 font-mono text-2xl tabular-nums",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
          tone === "cala" && "text-cala",
        )}
      >
        {value}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  )
}

function IndicatorSections({ c }: { c: Commodity }) {
  const sixMonthChange = seriesChange(c)
  const volatility = recentVolatility(c)
  const upwardPressure = c.drivers
    .filter((driver) => driver.direction === "up")
    .reduce((sum, driver) => sum + driver.weight, 0)
  const downwardPressure = c.drivers
    .filter((driver) => driver.direction === "down")
    .reduce((sum, driver) => sum + driver.weight, 0)
  const highReliabilityCount = c.evidence.filter((item) => item.reliability === "high").length
  const strongestAnalogue = [...c.history].sort((a, b) => b.similarity - a.similarity)[0]
  const evidenceDate = latestEvidenceDate(c)

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="p-5">
        <div>
          <h2 className="text-sm font-medium">Market indicators</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Fast read on momentum, volatility and physical coverage.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <GeneralIndicator
            icon={BarChart3}
            label="6M move"
            value={fmtPct(sixMonthChange)}
            detail="Total price move across the loaded six-month series."
            tone={sixMonthChange > 0 ? "positive" : sixMonthChange < 0 ? "negative" : "default"}
          />
          <GeneralIndicator
            icon={Activity}
            label="30D volatility"
            value={`${volatility.toFixed(1)}%`}
            detail="Average absolute daily move over the latest month."
          />
          <GeneralIndicator
            icon={Database}
            label="Warehouse"
            value={c.warehouseFillPct != null ? `${c.warehouseFillPct}%` : "N/A"}
            detail={
              c.warehouseFillPct != null
                ? "Current fill level for storable exposure."
                : "No warehouse fill signal for this market."
            }
            tone={c.warehouseFillPct != null && c.warehouseFillPct < 40 ? "negative" : "default"}
          />
        </div>
      </Card>

      <Card className="p-5">
        <div>
          <h2 className="text-sm font-medium">Signal indicators</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How the current call is supported by drivers and sources.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <GeneralIndicator
            icon={Scale}
            label="Driver balance"
            value={`${Math.round(upwardPressure * 100)} / ${Math.round(downwardPressure * 100)}`}
            detail="Upward vs. downward weighted pressure in the current call."
            tone={upwardPressure > downwardPressure ? "positive" : "negative"}
          />
          <GeneralIndicator
            icon={Gauge}
            label="Source strength"
            value={`${highReliabilityCount}/${c.evidence.length}`}
            detail={evidenceDate ? `High-reliability items. Latest update: ${fmtDate(evidenceDate)}.` : "No cited source updates."}
            tone="cala"
          />
          {strongestAnalogue ? (
            <GeneralIndicator
              icon={History}
              label="Analogue match"
              value={`${Math.round(strongestAnalogue.similarity * 100)}%`}
              detail={`${strongestAnalogue.title} (${strongestAnalogue.period}).`}
            />
          ) : null}
        </div>
      </Card>
    </div>
  )
}

function GeneralInfo({ c }: { c: Commodity }) {
  const sparkColor =
    c.trend === "up" ? "positive" : c.trend === "down" ? "negative" : "muted-foreground"

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="mb-2">
          <h2 className="text-sm font-medium">Price · 6 months</h2>
        </div>
        <PriceChart data={c.series} color={sparkColor} priceLine={c.spot} unit={c.unit} />
      </Card>

      <Card className="p-5">
        <DriversCall commodity={c} />
      </Card>

      <IndicatorSections c={c} />

      <Card className="p-5">
        <RelatedNews items={c.evidence} drivers={c.drivers} />
      </Card>
    </div>
  )
}

function Loaded({ c }: { c: Commodity }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isReport = location.pathname.endsWith("/report")
  const isPreview = location.pathname.endsWith("/preview")
  const tab = isPreview ? "preview" : isReport ? "report" : "general"

  useBreadcrumbs(
    isPreview
      ? [
          { label: "Reports", onClick: () => navigate("/reports") },
          { label: c.name, onClick: () => navigate(`/c/${c.id}`) },
          { label: "Report List" },
        ]
      : isReport
        ? [
            { label: "Reports", onClick: () => navigate("/reports") },
            { label: c.name, onClick: () => navigate(`/c/${c.id}`) },
            { label: "Create Report" },
          ]
        : [
            { label: "Reports", onClick: () => navigate("/reports") },
            { label: c.name, onClick: () => navigate(`/c/${c.id}`) },
            { label: "General information" },
          ],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="display-serif text-3xl">{c.name}</h1>
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

      <Tabs
        value={tab}
        onValueChange={(v) =>
          navigate(v === "report" ? `/c/${c.id}/report` : v === "preview" ? `/c/${c.id}/preview` : `/c/${c.id}`)
        }
      >
        <TabsList>
          <TabsTrigger value="general">
            <Info /> General information
          </TabsTrigger>
          <TabsTrigger value="report">
            <FileText /> Create Report
          </TabsTrigger>
          <TabsTrigger value="preview">
            <ListChecks /> Report List
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <GeneralInfo c={c} />
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <ReportBuilder c={c} />
        </TabsContent>
        <TabsContent value="preview" className="mt-6">
          <ReportList c={c} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function CommodityDetail() {
  const { id } = useParams<{ id: CommodityId }>()
  const { data, isLoading, isError } = useCommodity(id as CommodityId)

  if (isLoading) return <CommodityDetailSkeleton />
  if (isError || !data)
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Commodity not found.</p>
        <Link to="/reports" className="mt-2 inline-block text-sm underline">
          Back to Reports
        </Link>
      </div>
    )

  return <Loaded c={data} />
}
