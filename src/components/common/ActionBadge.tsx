import { Clock, Eye, ShoppingCart, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { ACTION_LABELS, type Action } from "@/types"

const STYLES: Record<Action, string> = {
  buy: "bg-buy/15 text-buy border-buy/30",
  wait: "bg-wait/15 text-wait border-wait/30",
  hedge: "bg-hedge/15 text-hedge border-hedge/30",
  monitor: "bg-monitor/15 text-monitor border-monitor/30",
}

const ICONS: Record<Action, typeof Shield> = {
  buy: ShoppingCart,
  wait: Clock,
  hedge: Shield,
  monitor: Eye,
}

interface Props {
  action: Action
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ActionBadge({ action, size = "md", className }: Props) {
  const Icon = ICONS[action]
  const sizes = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  }[size]
  const icon = { sm: "size-3", md: "size-3.5", lg: "size-4" }[size]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border font-medium uppercase tracking-wide",
        STYLES[action],
        sizes,
        className,
      )}
    >
      <Icon className={icon} />
      {ACTION_LABELS[action]}
    </span>
  )
}
