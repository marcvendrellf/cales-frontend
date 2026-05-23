import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ExternalLink, FileText, Info, ListChecks, TrendingDown, TrendingUp } from "lucide-react"
import { useCommodity } from "@/api/hooks"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"
import { Card } from "@/components/ui/card"
import { CommodityDetailSkeleton } from "@/components/common/PageSkeletons"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportBuilder } from "@/components/common/ReportBuilder"
import { ReportList } from "@/components/common/ReportList"
import { PriceChart } from "@/components/common/PriceChart"
import { TrendArrow } from "@/components/common/TrendArrow"
import { AnimatedNumber } from "@/components/common/AnimatedNumber"
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

function GeneralInfo({ c }: { c: Commodity }) {
  const maxWeight = Math.max(...c.drivers.map((d) => d.weight))
  const up = c.drivers.filter((d) => d.direction === "up")
  const down = c.drivers.filter((d) => d.direction === "down")
  const sparkColor =
    c.trend === "up" ? "positive" : c.trend === "down" ? "negative" : "muted-foreground"

  return (
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

        </div>

        {/* Right column */}
        <div className="space-y-6">
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
            { label: c.name },
          ],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
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
