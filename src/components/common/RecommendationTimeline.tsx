import { ArrowRight } from "lucide-react"
import type { Action, Commodity } from "@/types"

interface ChangeEvent {
  commodityId: string
  commodityName: string
  from: Action
  to: Action
  date: string
  note: string
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(year, month - 1, day),
  )
}

export function RecommendationTimeline({ commodities }: { commodities: Commodity[] }) {
  const events: ChangeEvent[] = []

  for (const c of commodities) {
    const h = c.recommendationHistory
    for (let i = 1; i < h.length; i++) {
      events.push({
        commodityId: c.id,
        commodityName: c.name,
        from: h[i - 1].action,
        to: h[i].action,
        date: h[i].date,
        note: h[i].note,
      })
    }
  }

  events.sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Recommendation changes
      </h2>

      <div className="overflow-hidden rounded-lg border border-border/60">
        {events.map((e, i) => (
          <div
            key={`${e.commodityId}-${e.date}`}
            className={`flex items-start gap-4 px-4 py-3 ${i < events.length - 1 ? "border-b border-border/40" : ""}`}
          >
            <span className="w-14 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
              {formatDate(e.date)}
            </span>

            <span className="w-20 shrink-0 truncate pt-0.5 text-sm font-medium text-foreground">
              {e.commodityName}
            </span>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="font-mono text-xs uppercase text-muted-foreground">{e.from}</span>
              <ArrowRight className="size-3 text-muted-foreground/60" />
              <span className="font-mono text-xs uppercase text-muted-foreground">{e.to}</span>
            </div>

            <p className="min-w-0 text-sm leading-snug text-muted-foreground">{e.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
