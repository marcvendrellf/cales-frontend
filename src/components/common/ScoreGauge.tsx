import { AnimatedNumber } from "@/components/common/AnimatedNumber"
import { cn } from "@/lib/utils"

interface Props {
  /** 0..100 */
  score: number
  size?: number
  label?: string
  colorVar?: string
  className?: string
}

/** Semicircular risk/opportunity gauge drawn as an SVG arc. */
export function ScoreGauge({
  score,
  size = 140,
  label = "Risk / Opportunity",
  colorVar,
  className,
}: Props) {
  const stroke = 9
  const r = (size - stroke) / 2
  const cy = size / 2
  // semicircle from 180deg -> 0deg
  const circumference = Math.PI * r
  const pct = Math.max(0, Math.min(100, score)) / 100
  const dash = circumference * pct

  const color =
    colorVar ??
    (score >= 70
      ? "var(--buy)"
      : score >= 45
        ? "var(--hedge)"
        : "var(--monitor)")

  const arc = (cls: string, dasharray: string, color: string) => (
    <path
      d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={dasharray}
      className={cls}
    />
  )

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div style={{ width: size, height: size / 2 + 6 }} className="relative">
        <svg width={size} height={size / 2 + stroke} className="overflow-visible">
          {arc("opacity-100", `${circumference}`, "var(--border)")}
          {arc(
            "transition-[stroke-dasharray] duration-1000 ease-out",
            `${dash} ${circumference}`,
            color,
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <AnimatedNumber
            value={score}
            className="font-mono text-3xl font-medium tabular-nums"
          />
        </div>
      </div>
      <span className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
