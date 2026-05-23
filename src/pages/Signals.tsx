import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useSignals } from "@/api/hooks"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Illustration } from "@/components/common/Illustration"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"
import { cn } from "@/lib/utils"
import { impactColor, relativeTime, reliabilityLabel } from "@/lib/format"
import type { CommodityId, MarketSignal, SignalImpact } from "@/types"

type CommodityFilter = CommodityId | "macro" | "all"
type ImpactFilter = SignalImpact | "all"

const COMMODITY_FILTERS: { id: CommodityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "aluminium", label: "Aluminium" },
  { id: "pet", label: "PET" },
  { id: "energy", label: "Energy" },
  { id: "barley", label: "Barley" },
  { id: "macro", label: "Macro" },
]

const IMPACT_FILTERS: { id: ImpactFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
  { id: "neutral", label: "Neutral" },
]

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground/30 bg-secondary text-foreground"
          : "border-border text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function SignalRow({ s }: { s: MarketSignal }) {
  const dot =
    s.impact === "bullish"
      ? "bg-positive"
      : s.impact === "bearish"
        ? "bg-negative"
        : "bg-muted-foreground"
  const isCommodity = s.commodityId !== "macro"
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <div className="mt-1.5">
        <span className={cn("block size-2 rounded-full", dot)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono">{relativeTime(s.time)}</span>
          <span>·</span>
          {isCommodity ? (
            <Link
              to={`/c/${s.commodityId}`}
              className="font-mono uppercase text-foreground/80"
            >
              {s.commodityId}
            </Link>
          ) : (
            <span className="font-mono uppercase">macro</span>
          )}
          <span>·</span>
          <span>{s.category}</span>
          <span className={cn("ml-auto font-mono uppercase", impactColor[s.impact])}>
            {s.impact}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">{s.headline}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{s.detail}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {s.source} · reliability {reliabilityLabel[s.reliability]}
        </p>
      </div>
    </div>
  )
}

export function Signals() {
  const { data, isLoading } = useSignals()
  const [commodity, setCommodity] = useState<CommodityFilter>("all")
  const [impact, setImpact] = useState<ImpactFilter>("all")
  useBreadcrumbs([{ label: "Signals" }])

  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (s) =>
          (commodity === "all" || s.commodityId === commodity) &&
          (impact === "all" || s.impact === impact),
      ),
    [data, commodity, impact],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-serif text-3xl">Signals Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Leading market signals — the edge is seeing them before spot reacts.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {COMMODITY_FILTERS.map((f) => (
          <Pill key={f.id} active={commodity === f.id} onClick={() => setCommodity(f.id)}>
            {f.label}
          </Pill>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {IMPACT_FILTERS.map((f) => (
          <Pill key={f.id} active={impact === f.id} onClick={() => setImpact(f.id)}>
            {f.label}
          </Pill>
        ))}
      </div>

      <Card className="px-5 py-2">
        {isLoading ? (
          <div className="space-y-3 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length ? (
          filtered.map((s) => <SignalRow key={s.id} s={s} />)
        ) : (
          <div className="flex flex-col items-center gap-3 py-12">
            <Illustration className="h-32 w-32" />
            <p className="text-sm text-muted-foreground">No signals match these filters.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
