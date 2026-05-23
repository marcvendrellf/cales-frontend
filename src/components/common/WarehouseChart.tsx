"use client"

import type { Commodity } from "@/types"

const FILL_COLORS: Record<string, string> = {
  aluminium: "var(--chart-1)",
  pet: "var(--chart-2)",
  barley: "var(--chart-4)",
}

const SIZE = 78
const STROKE = 9
const RADIUS = SIZE / 2 - STROKE / 2 - 1
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  commodities: Commodity[]
}

export function WarehouseChart({ commodities }: Props) {
  // Energy (power/gas) can't be warehoused, so it has no fill level and is skipped.
  const gauges = commodities
    .filter((c) => c.warehouseFillPct != null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      capacity: c.warehouseFillPct as number,
      fill: FILL_COLORS[c.id] ?? "var(--chart-5)",
    }))

  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      {gauges.map((gauge) => (
        <div key={gauge.id} className="flex items-center gap-4">
          <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE} className="-rotate-90">
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={STROKE}
              />
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={gauge.fill}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - gauge.capacity / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold tabular-nums text-foreground">
                {gauge.capacity}%
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{gauge.name}</div>
            <div className="text-xs text-muted-foreground">of capacity</div>
          </div>
        </div>
      ))}
    </div>
  )
}
