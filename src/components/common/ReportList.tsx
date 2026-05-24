import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react"
import { ActionBadge } from "@/components/common/ActionBadge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fmtDate } from "@/lib/format"
import { DEMO_REPORT_CONFIGS, DEMO_REPORT_ID } from "@/data/demo-reports"
import type { Action, Commodity, CommodityId } from "@/types"

type ReportRow = {
  id: string
  title: string
  action: Action
  horizon: string
  sourceCount: number
  owner: string
  updatedAt: string
  status: "Ready" | "Archived"
}

const PAGE_SIZE = 5

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function buildReportRows(c: Commodity): ReportRow[] {
  const demoId = DEMO_REPORT_ID[c.id as CommodityId]
  const demoConfig = demoId ? DEMO_REPORT_CONFIGS[demoId] : undefined
  const demoReport = demoConfig?.agentResponse?.report_json

  const rows: ReportRow[] = []

  if (demoConfig && demoReport) {
    rows.push({
      id: demoConfig.reportId,
      title: `${c.name} procurement report`,
      action: demoReport.recommendation.action.toLowerCase() as Action,
      horizon: demoReport.horizon_label,
      sourceCount: demoReport.evidence.length,
      owner: "Marc Vendrell",
      updatedAt: demoConfig.generatedAt.slice(0, 10),
      status: "Ready",
    })
  }

  const historyRows = c.recommendationHistory
    .slice()
    .reverse()
    .slice(demoConfig ? 1 : 0)
    .map((entry, index) => ({
      id: `${c.id}-${entry.date}-${index}`,
      title: `${c.name} procurement report`,
      action: entry.action,
      horizon: "Previous call",
      sourceCount: Math.max(1, c.evidence.length - Math.min(index + 1, 2)),
      owner: "Marc Vendrell",
      updatedAt: entry.date,
      status: "Archived" as const,
    }))

  rows.push(...historyRows)
  if (rows.length) return rows

  return [
    {
      id: `${c.id}-current`,
      title: `${c.name} procurement report`,
      action: c.recommendation.action,
      horizon: c.recommendation.horizon,
      sourceCount: c.evidence.length,
      owner: "Marc Vendrell",
      updatedAt: c.recommendation.updatedAt,
      status: "Ready",
    },
  ]
}

export function ReportList({ c, pendingTitle, generatingSince }: { c: Commodity; pendingTitle?: string | null; generatingSince?: number | null }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [pageIndex, setPageIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const rows = useMemo(() => buildReportRows(c), [c])

  useEffect(() => {
    if (!pendingTitle || !generatingSince) {
      setElapsed(0)
      return
    }
    setElapsed(Math.floor((Date.now() - generatingSince) / 1000))
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - generatingSince) / 1000)), 1000)
    return () => window.clearInterval(id)
  }, [pendingTitle, generatingSince])

  const openReport = (reportId: string) =>
    navigate(`/c/${c.id}/reports/${reportId}`, { viewTransition: true })

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return rows

    return rows.filter((row) =>
      [row.title, row.horizon, row.owner, row.status, row.action]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )
  }, [query, rows])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const boundedPage = Math.min(pageIndex, pageCount - 1)
  const visibleRows = filteredRows.slice(boundedPage * PAGE_SIZE, (boundedPage + 1) * PAGE_SIZE)

  const goPrevious = () => setPageIndex((current) => Math.max(0, current - 1))
  const goNext = () => setPageIndex((current) => Math.min(pageCount - 1, current + 1))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPageIndex(0)
            }}
            placeholder="Search reports..."
            aria-label="Search reports"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{filteredRows.length}</span>
          <span>{filteredRows.length === 1 ? "report" : "reports"}</span>
        </div>
      </div>

      <Card className="overflow-hidden rounded-lg border-border/70 bg-card/40 p-0 shadow-none">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
          </colgroup>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="px-4">Report</TableHead>
              <TableHead className="px-4">Decision</TableHead>
              <TableHead className="px-4">Horizon</TableHead>
              <TableHead className="px-4">Updated</TableHead>
              <TableHead className="px-4">Sources</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingTitle && boundedPage === 0 ? (
              <TableRow className="h-[53px] cursor-default opacity-60">
                <TableCell className="px-4 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-muted-foreground">{pendingTitle}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        Analyzing — this can take 1–2 min · <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Skeleton className="h-3 w-20" />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Skeleton className="h-3 w-16" />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Skeleton className="h-3 w-6" />
                </TableCell>
              </TableRow>
            ) : null}
            {visibleRows.length ? (
              visibleRows.map((row) => (
                <TableRow
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openReport(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      openReport(row.id)
                    }
                  }}
                  className="h-[53px] cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <TableCell className="px-4 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {row.owner} · {row.status}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <ActionBadge action={row.action} size="sm" />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">
                    {row.horizon}
                  </TableCell>
                  <TableCell className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {fmtDate(row.updatedAt)}
                  </TableCell>
                  <TableCell className="px-4 py-2 font-mono text-xs tabular-nums text-muted-foreground">
                    {row.sourceCount}
                  </TableCell>
                </TableRow>
              ))
            ) : pendingTitle && boundedPage === 0 ? null : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm font-medium">
          Page {boundedPage + 1} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goPrevious}
            disabled={boundedPage === 0}
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goNext}
            disabled={boundedPage >= pageCount - 1}
          >
            <span className="sr-only">Next page</span>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
