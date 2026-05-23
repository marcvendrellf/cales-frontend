import { useId } from "react"
import type { PricePoint } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  data: PricePoint[]
  width?: number
  height?: number
  color?: string
  className?: string
}

/** Hand-rolled SVG sparkline — no chart lib, fast for card grids. */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "var(--foreground)",
  className,
}: Props) {
  const gradId = useId()
  if (data.length < 2) return null

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const pts = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - 4) - 2
    return [x, y] as const
  })

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}
