import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react"
import { ActionBadge } from "@/components/common/ActionBadge"
import { ReportMaps } from "@/components/common/ReportMaps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fmtDate } from "@/lib/format"
import type { Action, Commodity } from "@/types"

type ReportRow = {
  id: string
  title: string
  action: Action
  horizon: string
  confidence: number
  sourceCount: number
  owner: string
  updatedAt: string
  status: "Ready" | "Archived"
}

const PAGE_SIZE = 5

function buildReportRows(c: Commodity): ReportRow[] {
  const historyRows = c.recommendationHistory
    .slice()
    .reverse()
    .map((entry, index) => ({
      id: `${c.id}-${entry.date}-${index}`,
      title: `${c.name} procurement report`,
      action: entry.action,
      horizon: index === 0 ? c.recommendation.horizon : "Previous call",
      confidence: Math.max(58, Math.round(c.recommendation.confidence * 100) - index * 7),
      sourceCount: Math.max(1, c.evidence.length - Math.min(index, 2)),
      owner: "Marc Vendrell",
      updatedAt: entry.date,
      status: index === 0 ? "Ready" : "Archived",
    })) satisfies ReportRow[]

  if (historyRows.length) return historyRows

  return [
    {
      id: `${c.id}-current`,
      title: `${c.name} procurement report`,
      action: c.recommendation.action,
      horizon: c.recommendation.horizon,
      confidence: Math.round(c.recommendation.confidence * 100),
      sourceCount: c.evidence.length,
      owner: "Marc Vendrell",
      updatedAt: c.recommendation.updatedAt,
      status: "Ready",
    },
  ]
}

export function ReportList({ c }: { c: Commodity }) {
  const [query, setQuery] = useState("")
  const [pageIndex, setPageIndex] = useState(0)
  const rows = useMemo(() => buildReportRows(c), [c])

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
      <ReportMaps c={c} />

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
            <col className="w-[28%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[6%]" />
          </colgroup>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="px-4">Report</TableHead>
              <TableHead className="px-4">Decision</TableHead>
              <TableHead className="px-4">Horizon</TableHead>
              <TableHead className="px-4">Confidence</TableHead>
              <TableHead className="px-4">Updated</TableHead>
              <TableHead className="px-4">Sources</TableHead>
              <TableHead className="px-4 text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length ? (
              visibleRows.map((row) => (
                <TableRow key={row.id} className="h-[53px]">
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
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-foreground/70"
                          style={{ width: `${row.confidence}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{row.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {fmtDate(row.updatedAt)}
                  </TableCell>
                  <TableCell className="px-4 py-2 font-mono text-xs tabular-nums text-muted-foreground">
                    {row.sourceCount}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    <Button variant="ghost" size="icon-xs" aria-label={`View ${row.title}`}>
                      <Eye />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
