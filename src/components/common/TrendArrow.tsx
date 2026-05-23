import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtPct } from "@/lib/format"
import type { Trend } from "@/types"

interface Props {
  change: number
  trend?: Trend
  className?: string
}

export function TrendArrow({ change, trend, className }: Props) {
  const dir: Trend = trend ?? (change > 0.05 ? "up" : change < -0.05 ? "down" : "flat")
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : ArrowRight
  const color =
    dir === "up" ? "text-positive" : dir === "down" ? "text-negative" : "text-muted-foreground"
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono text-xs", color, className)}>
      <Icon className="size-3.5" />
      {fmtPct(change)}
    </span>
  )
}
