import { useEffect, useRef, useState } from "react"

interface Props {
  value: number
  /** decimal places */
  digits?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

/** Count-up ticker — a small "wow" detail for scores and prices. */
export function AnimatedNumber({
  value,
  digits = 0,
  duration = 900,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (value - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
  }, [value, duration])

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
