import { TrendingDown, TrendingUp } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Commodity, Driver } from "@/types"

function DriverBar({ d, max }: { d: Driver; max: number }) {
  const Icon = d.direction === "up" ? TrendingUp : TrendingDown
  const color = d.direction === "up" ? "bg-positive" : "bg-negative"
  const text = d.direction === "up" ? "text-positive" : "text-negative"

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm">
          <Icon className={cn("size-4", text)} />
          {d.label}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {Math.round(d.weight * 100)}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${(d.weight / max) * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {d.category} · {d.rationale}
      </p>
    </div>
  )
}

interface Props {
  commodity: Commodity
  className?: string
  variant?: "default" | "report"
}

export function DriversCall({ commodity: c, className, variant = "default" }: Props) {
  const maxWeight = Math.max(...c.drivers.map((d) => d.weight), 0.01)
  const up = c.drivers.filter((d) => d.direction === "up")
  const down = c.drivers.filter((d) => d.direction === "down")

  const title =
    variant === "report" ? (
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        What&apos;s driving the call
      </p>
    ) : (
      <>
        <h2 className="text-sm font-medium">What&apos;s driving the call</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Net of forces pushing price up vs. down — each tagged to a signal category.
        </p>
      </>
    )

  return (
    <div className={className}>
      <div className={variant === "report" ? "mb-3" : "mb-4"}>{title}</div>
      <div className="grid gap-x-8 sm:grid-cols-2">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-positive">
            <TrendingUp className="size-3.5" /> Upward pressure
          </p>
          <Separator className="mb-1" />
          {up.map((d) => (
            <DriverBar key={d.id} d={d} max={maxWeight} />
          ))}
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-negative">
            <TrendingDown className="size-3.5" /> Downward pressure
          </p>
          <Separator className="mb-1" />
          {down.map((d) => (
            <DriverBar key={d.id} d={d} max={maxWeight} />
          ))}
        </div>
      </div>
    </div>
  )
}
