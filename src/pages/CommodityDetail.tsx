import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { FileText, Info, ListChecks } from "lucide-react"
import { useCommodity } from "@/api/hooks"
import { AGENT_CONFIGURED } from "@/api/client"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"
import { Card } from "@/components/ui/card"
import { CommodityDetailSkeleton } from "@/components/common/PageSkeletons"
import { DriversCall } from "@/components/common/DriversCall"
import { RelatedNews } from "@/components/common/RelatedNews"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ReportBuilder } from "@/components/common/ReportBuilder"
import { ReportList } from "@/components/common/ReportList"
import { PriceChart } from "@/components/common/PriceChart"
import { TrendArrow } from "@/components/common/TrendArrow"
import { AnimatedNumber } from "@/components/common/AnimatedNumber"
import { getGeneratingStart, onGeneratingDone } from "@/lib/generating-state"
import type { Commodity, CommodityId } from "@/types"

// In the app/dashboard, price direction follows the standard market convention:
// up = green (positive), down = red (negative). Derived from the displayed series
// so the color always matches what the chart visually shows. (Only the cinematic
// report inverts this to the buyer's perspective, where a price rise is "bad".)
function priceIsUp(c: Commodity): boolean {
  const s = c.series
  if (s.length > 1) return s[s.length - 1].value >= s[0].value
  return c.trend === "up"
}

function GeneralInfo({ c }: { c: Commodity }) {
  const sparkColor = priceIsUp(c) ? "positive" : "negative"

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

      <Card className="p-5">
        <RelatedNews items={c.evidence} drivers={c.drivers} />
      </Card>
    </div>
  )
}

function Loaded({ c }: { c: Commodity }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [generatingStartedAt, setGeneratingStartedAt] = useState<number | null>(
    () => getGeneratingStart(c.id)
  )

  useEffect(() => onGeneratingDone(c.id, () => setGeneratingStartedAt(null)), [c.id])
  const isCreateReport =
    location.pathname.endsWith("/create-report") || location.pathname.endsWith("/report")
  const isReportList =
    location.pathname.endsWith("/reports") || location.pathname.endsWith("/preview")
  const tab = isReportList ? "report-list" : isCreateReport ? "create-report" : "general"

  useBreadcrumbs(
    isReportList
      ? [
          { label: "Reports", onClick: () => navigate("/reports") },
          { label: c.name, onClick: () => navigate(`/c/${c.id}`) },
          { label: "Report List" },
        ]
      : isCreateReport
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
          <div className={`font-mono text-3xl tabular-nums ${priceIsUp(c) ? "text-positive" : "text-negative"}`}>
            <AnimatedNumber value={c.spot} digits={c.spot < 100 ? 2 : 0} />
            <span className="ml-1.5 text-sm text-muted-foreground">{c.unit}</span>
          </div>
          <div className="mt-1 flex items-center justify-end gap-3">
            <TrendArrow change={c.change24h} /> <span className="text-[11px] text-muted-foreground">24h</span>
            <TrendArrow change={c.change30d} /> <span className="text-[11px] text-muted-foreground">30d</span>
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) =>
          navigate(
            v === "create-report"
              ? `/c/${c.id}/create-report`
              : v === "report-list"
                ? `/c/${c.id}/reports`
                : `/c/${c.id}/general-information`,
          )
        }
      >
        <TabsList>
          <TabsTrigger value="general">
            <Info /> General information
          </TabsTrigger>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <TabsTrigger value="create-report" disabled={AGENT_CONFIGURED}>
                    <FileText /> Create Report
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              {AGENT_CONFIGURED && (
                <TooltipContent>
                  Live report generation is disabled in this demo. No LLM API key is connected.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TabsTrigger value="report-list">
            <ListChecks /> Report List
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <GeneralInfo c={c} />
        </TabsContent>
        <TabsContent value="create-report" className="mt-6">
          <ReportBuilder
            c={c}
            onGenerateStart={() => setGeneratingStartedAt(Date.now())}
            onGenerateError={() => setGeneratingStartedAt(null)}
          />
        </TabsContent>
        <TabsContent value="report-list" className="mt-6">
          <ReportList
            c={c}
            pendingTitle={generatingStartedAt ? `${c.name} procurement report` : null}
            generatingSince={generatingStartedAt}
          />
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
