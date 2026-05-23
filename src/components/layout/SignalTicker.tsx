import { useSignals } from "@/api/hooks"
import { impactColor } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { MarketSignal } from "@/types"

function Item({ s }: { s: MarketSignal }) {
  const dot =
    s.impact === "bullish"
      ? "bg-positive"
      : s.impact === "bearish"
        ? "bg-negative"
        : "bg-muted-foreground"
  return (
    <span className="mx-6 inline-flex items-center gap-2 text-xs">
      <span className={cn("size-1.5 rounded-full", dot)} />
      <span className="font-mono uppercase text-muted-foreground">
        {s.commodityId}
      </span>
      <span className="text-foreground/90">{s.headline}</span>
      <span className={cn("font-mono", impactColor[s.impact])}>•</span>
      <span className="text-muted-foreground">{s.source}</span>
    </span>
  )
}

export function SignalTicker() {
  const { data } = useSignals()
  if (!data?.length) return null
  const loop = [...data, ...data]
  return (
    <div className="border-b border-border bg-card/40">
      <div className="flex items-center overflow-hidden px-6 py-2">
        <span className="mr-4 shrink-0 rounded-xs bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Live signals
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee whitespace-nowrap">
            {loop.map((s, i) => (
              <Item key={`${s.id}-${i}`} s={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
