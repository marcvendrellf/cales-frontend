import { Link } from "react-router-dom"
import { Boxes, Gauge, PackageCheck } from "lucide-react"
import { useCommodities } from "@/api/hooks"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"
import { CommodityArt } from "@/components/common/CommodityArt"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Commodity } from "@/types"

function fillStatus(fill: number) {
  if (fill >= 85) return { label: "Critical", className: "text-negative" }
  if (fill >= 65) return { label: "High", className: "text-hedge" }
  if (fill >= 35) return { label: "Normal", className: "text-buy" }
  return { label: "Low", className: "text-monitor" }
}

function WarehouseRow({ commodity }: { commodity: Commodity }) {
  const status = fillStatus(commodity.warehouseFillPct)

  return (
    <Link
      to={`/c/${commodity.id}`}
      className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border/70 px-4 py-3 transition-colors last:border-b-0 hover:bg-card/65 sm:px-5"
    >
      <CommodityArt id={commodity.id} className="size-10" />
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-4">
          <h2 className="truncate text-sm font-medium">{commodity.name}</h2>
          <span className={cn("text-xs", status.className)}>{status.label}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${commodity.warehouseFillPct}%` }}
          />
        </div>
      </div>
      <div className="w-14 text-right font-mono text-lg tabular-nums">
        {commodity.warehouseFillPct}%
      </div>
    </Link>
  )
}

export function Overview() {
  const { data, isLoading } = useCommodities()
  useBreadcrumbs([{ label: "Overview" }])

  const averageFill =
    data && data.length > 0
      ? Math.round(
          data.reduce((total, commodity) => total + commodity.warehouseFillPct, 0) /
            data.length,
        )
      : 0
  const highFillCount =
    data?.filter((commodity) => commodity.warehouseFillPct >= 65).length ?? 0

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-serif text-4xl sm:text-5xl">
            Hello, <span className="text-muted-foreground">Marc</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Current warehouse fill level for each element.
          </p>
        </div>
        <Link
          to="/elements"
          className="rounded-md border border-border bg-card px-4 py-2 text-sm transition-colors hover:border-foreground/25"
        >
          Open Elements
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-card/55 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gauge className="size-4" />
            Average fill
          </div>
          {isLoading ? (
            <Skeleton className="mt-4 h-9 w-24" />
          ) : (
            <p className="mt-3 font-mono text-4xl tabular-nums">{averageFill}%</p>
          )}
        </div>

        <div className="rounded-lg border border-border/70 bg-card/55 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PackageCheck className="size-4" />
            Elements tracked
          </div>
          {isLoading ? (
            <Skeleton className="mt-4 h-9 w-16" />
          ) : (
            <p className="mt-3 font-mono text-4xl tabular-nums">{data?.length ?? 0}</p>
          )}
        </div>

        <div className="rounded-lg border border-border/70 bg-card/55 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Boxes className="size-4" />
            High fill
          </div>
          {isLoading ? (
            <Skeleton className="mt-4 h-9 w-16" />
          ) : (
            <p className="mt-3 font-mono text-4xl tabular-nums">{highFillCount}</p>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border/70 bg-card/40">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border/70 px-5 py-3 last:border-b-0"
              >
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-6 w-14" />
              </div>
            ))
          : data?.map((commodity) => (
              <WarehouseRow key={commodity.id} commodity={commodity} />
            ))}
      </section>
    </div>
  )
}
