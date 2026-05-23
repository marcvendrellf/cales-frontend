import { useMemo, useState } from "react"
import { RotateCcw, TrendingDown, TrendingUp } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ActionBadge } from "@/components/common/ActionBadge"
import { AnimatedNumber } from "@/components/common/AnimatedNumber"
import { runScenario } from "@/lib/scenario"
import { cn } from "@/lib/utils"
import type { Commodity } from "@/types"

export function WhatIfPanel({ c }: { c: Commodity }) {
  // Top drivers become the scenario levers.
  const levers = useMemo(
    () => [...c.drivers].sort((a, b) => b.weight - a.weight).slice(0, 3),
    [c.drivers],
  )
  const [intensities, setIntensities] = useState<Record<string, number>>({})

  const result = useMemo(() => runScenario(c, intensities), [c, intensities])
  const dirty = Object.values(intensities).some((v) => v !== 1)

  const reset = () => setIntensities({})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">What-if scenario</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Drag a driver's intensity to see the call shift live.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={!dirty}
          className="h-7 gap-1.5 text-xs"
        >
          <RotateCcw className="size-3" />
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {levers.map((d) => {
          const val = intensities[d.id] ?? 1
          const Icon = d.direction === "up" ? TrendingUp : TrendingDown
          return (
            <div key={d.id}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "size-3.5",
                      d.direction === "up" ? "text-positive" : "text-negative",
                    )}
                  />
                  {d.label}
                </span>
                <span className="font-mono text-muted-foreground">
                  {Math.round(val * 100)}%
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[val * 100]}
                min={0}
                max={200}
                step={5}
                onValueChange={([v]) =>
                  setIntensities((s) => ({ ...s, [d.id]: v / 100 }))
                }
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Scenario score
          </span>
          <span className="font-mono text-2xl">
            <AnimatedNumber value={result.score} duration={400} />
          </span>
          {result.delta !== 0 && (
            <span
              className={cn(
                "font-mono text-xs",
                result.delta > 0 ? "text-positive" : "text-negative",
              )}
            >
              {result.delta > 0 ? "+" : ""}
              {result.delta}
            </span>
          )}
        </div>
        <ActionBadge action={result.action} size="lg" />
      </div>
    </div>
  )
}
