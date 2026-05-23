import { Link } from "react-router-dom"
import { CommodityArt } from "@/components/common/CommodityArt"
import { ActionBadge } from "@/components/common/ActionBadge"
import { TrendArrow } from "@/components/common/TrendArrow"
import { AnimatedNumber } from "@/components/common/AnimatedNumber"
import { cn } from "@/lib/utils"
import type { Commodity } from "@/types"

export function CommodityCard({ c }: { c: Commodity; index?: number }) {
  const scoreColor =
    c.recommendation.score >= 70
      ? "text-buy"
      : c.recommendation.score >= 45
        ? "text-hedge"
        : "text-monitor"

  return (
    <Link
      to={`/c/${c.id}`}
      className="group block h-full rounded-xl border border-border/70 bg-card/55 transition-colors hover:border-foreground/25 hover:bg-card"
    >
      <article className="relative flex h-full min-h-72 flex-col items-center overflow-hidden rounded-xl px-5 pb-6 pt-5 text-center">
        <ActionBadge
          action={c.recommendation.action}
          size="sm"
          className="absolute left-1/2 top-4 -translate-x-1/2 bg-background/70 backdrop-blur"
        />

        {/* Hero visual — centered in the card */}
        <div className="flex flex-1 items-center justify-center pt-9">
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 scale-150 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
              style={{
                background: `radial-gradient(circle, var(--${c.recommendation.action}) 0%, transparent 70%)`,
              }}
            />
            <CommodityArt
              id={c.id}
              className="size-36 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Centered details */}
        <div className="mt-5 w-full">
          <h3 className="text-base font-medium tracking-tight">{c.name}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{c.unit}</p>

          <div className="mt-3 flex items-center justify-center gap-2.5">
            <span className="text-2xl tabular-nums">
              <AnimatedNumber value={c.spot} digits={c.spot < 100 ? 2 : 0} />
            </span>
            <TrendArrow change={c.change30d} trend={c.trend} />
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/40 px-3 py-1 text-[11px]">
            <span className={cn("font-medium tabular-nums", scoreColor)}>
              <AnimatedNumber value={c.recommendation.score} />
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{c.recommendation.horizon}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
