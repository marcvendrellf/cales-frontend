import { useState } from "react"
import { Check, FileText, Loader2, Sparkles, TrendingDown, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ActionBadge } from "@/components/common/ActionBadge"
import { ScoreGauge } from "@/components/common/ScoreGauge"
import { WhatIfPanel } from "@/components/common/WhatIfPanel"
import { fmtDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Commodity } from "@/types"

type SectionKey = "price" | "drivers" | "evidence" | "recommendation"

type SectionDef = { key: SectionKey; label: string; hint: string; available: boolean }

const HORIZONS = ["1M", "3M", "6M", "12M"] as const
type Horizon = (typeof HORIZONS)[number]

type GeneratedReport = {
  factors: Commodity["drivers"]
  sections: Record<SectionKey, boolean>
  horizon: Horizon
  at: string
}

function ToggleRow({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "flex w-full items-start gap-3 rounded-md border border-border/70 bg-background/40 px-3 py-2.5 text-left transition-colors",
        "hover:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-40",
        checked && "border-foreground/30 bg-foreground/[0.04]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
          checked ? "border-cala bg-cala text-background" : "border-border bg-transparent",
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

export function ReportBuilder({ c }: { c: Commodity }) {
  const sectionDefs: SectionDef[] = [
    { key: "price", label: "Price history & trend", hint: "6-month series, spot and momentum", available: true },
    { key: "drivers", label: "Driver breakdown", hint: "Weighted upward / downward forces", available: true },
    { key: "evidence", label: "Evidence & sources", hint: `${c.evidence.length} cited sources`, available: c.evidence.length > 0 },
    { key: "recommendation", label: "Recommendation & confidence", hint: "Action, score and rationale", available: true },
  ]

  const [factors, setFactors] = useState<Set<string>>(() => new Set(c.drivers.map((d) => d.id)))
  const [sections, setSections] = useState<Record<SectionKey, boolean>>(() => ({
    price: true,
    drivers: true,
    evidence: true,
    recommendation: true,
  }))
  const [horizon, setHorizon] = useState<Horizon>("3M")
  const [status, setStatus] = useState<"idle" | "generating" | "ready">("idle")
  const [report, setReport] = useState<GeneratedReport | null>(null)

  const toggleFactor = (id: string) =>
    setFactors((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleSection = (key: SectionKey) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const selectedFactorCount = factors.size
  const canGenerate = selectedFactorCount > 0 && status !== "generating"

  function generate() {
    if (!canGenerate) return
    setStatus("generating")
    setReport(null)
    window.setTimeout(() => {
      setReport({
        factors: c.drivers.filter((d) => factors.has(d.id)),
        sections: { ...sections },
        horizon,
        at: new Date().toISOString(),
      })
      setStatus("ready")
      toast.success("Report generated", { description: `${c.name} · ${horizon} horizon` })
    }, 1400)
  }

  const rec = c.recommendation

  return (
    <div className="space-y-6">
      {/* Risk / opportunity + what-if scenario */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-medium">Risk / opportunity</h2>
          <div className="mt-3 flex flex-col items-center">
            <ScoreGauge score={rec.score} />
            <p className="mt-2 font-mono text-xs text-muted-foreground">{rec.horizon}</p>
          </div>
          <Separator className="my-4" />
          <p className="text-sm leading-relaxed text-foreground/90">{rec.summary}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Confidence</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-foreground/70"
                  style={{ width: `${rec.confidence * 100}%` }}
                />
              </div>
              <span className="font-mono">{Math.round(rec.confidence * 100)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <WhatIfPanel c={c} />
        </Card>
      </div>

      {/* Builder */}
      <div className="grid gap-6 lg:grid-cols-3">
      {/* Inputs */}
      <div className="space-y-6 lg:col-span-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Factors to include</h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              {selectedFactorCount}/{c.drivers.length} selected
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Choose which price drivers the report should weigh.
          </p>
          <div className="mt-4 space-y-2">
            {c.drivers.map((d) => {
              const Icon = d.direction === "up" ? TrendingUp : TrendingDown
              const text = d.direction === "up" ? "text-positive" : "text-negative"
              return (
                <ToggleRow key={d.id} checked={factors.has(d.id)} onChange={() => toggleFactor(d.id)}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm">
                      <Icon className={cn("size-4", text)} />
                      {d.label}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {Math.round(d.weight * 100)}%
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {d.category} · {d.rationale}
                  </span>
                </ToggleRow>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium">Sections</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick the parts to render in the generated report.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {sectionDefs.map((s) => (
              <ToggleRow
                key={s.key}
                checked={sections[s.key] && s.available}
                onChange={() => toggleSection(s.key)}
                disabled={!s.available}
              >
                <span className="block text-sm">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {s.available ? s.hint : "No data for this element"}
                </span>
              </ToggleRow>
            ))}
          </div>
        </Card>
      </div>

      {/* Generate */}
      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="text-sm font-medium">Forecast horizon</h2>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {HORIZONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={cn(
                  "rounded-md border px-2 py-1.5 font-mono text-xs transition-colors",
                  horizon === h
                    ? "border-foreground/40 bg-foreground/10 text-foreground"
                    : "border-border/70 text-muted-foreground hover:border-foreground/25",
                )}
              >
                {h}
              </button>
            ))}
          </div>

          <Separator className="my-4" />

          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Factors</dt>
              <dd className="font-mono">{selectedFactorCount}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Sections</dt>
              <dd className="font-mono">{Object.values(sections).filter(Boolean).length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Horizon</dt>
              <dd className="font-mono">{horizon}</dd>
            </div>
          </dl>

          <Button onClick={generate} disabled={!canGenerate} className="mt-4 w-full">
            {status === "generating" ? (
              <>
                <Loader2 className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles /> Generate report
              </>
            )}
          </Button>
          {selectedFactorCount === 0 && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Select at least one factor.
            </p>
          )}
        </Card>
      </div>

      {/* Result */}
      <div className="lg:col-span-3">
        {status === "idle" && (
          <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-10 text-center">
            <FileText className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Configure the inputs above, then generate a report.
            </p>
          </Card>
        )}
        {status === "generating" && (
          <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <Loader2 className="size-6 animate-spin text-cala" />
            <p className="text-sm text-muted-foreground">Compiling {c.name} report…</p>
          </Card>
        )}
        {status === "ready" && report && <GeneratedReportView c={c} report={report} />}
      </div>
      </div>
    </div>
  )
}

function GeneratedReportView({ c, report }: { c: Commodity; report: GeneratedReport }) {
  const rec = c.recommendation
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-cala">
            <Sparkles className="size-3.5" /> Generated report
          </p>
          <h2 className="display-serif mt-1 text-2xl">{c.name} procurement report</h2>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {report.horizon} horizon · {fmtDate(report.at)}
          </p>
        </div>
        <ActionBadge action={rec.action} size="lg" />
      </div>

      <Separator className="my-5" />

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Executive summary
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{rec.summary}</p>
      </section>

      {report.sections.price && (
        <section className="mt-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Price & trend
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            Spot is <span className="font-mono">{c.spot} {c.unit}</span>, {c.change30d >= 0 ? "up" : "down"}{" "}
            <span className="font-mono">{Math.abs(c.change30d)}%</span> over 30 days; trend is {c.trend}.
          </p>
        </section>
      )}

      {report.sections.drivers && report.factors.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Key drivers ({report.factors.length})
          </h3>
          <ul className="mt-2 space-y-2">
            {report.factors.map((d) => {
              const Icon = d.direction === "up" ? TrendingUp : TrendingDown
              const text = d.direction === "up" ? "text-positive" : "text-negative"
              return (
                <li key={d.id} className="flex gap-2 text-sm">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", text)} />
                  <span>
                    <span className="font-medium">{d.label}</span>{" "}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      ({Math.round(d.weight * 100)}%)
                    </span>
                    <span className="block text-xs text-muted-foreground">{d.rationale}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

{report.sections.evidence && c.evidence.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sources
          </h3>
          <ul className="mt-2 space-y-1">
            {c.evidence.map((e) => (
              <li key={e.id} className="text-xs text-muted-foreground">
                <span className="text-foreground/80">{e.source}</span> — {e.title}{" "}
                <span className="font-mono">({fmtDate(e.date)})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.sections.recommendation && (
        <section className="mt-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recommendation
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            <span className="font-medium">{rec.action.toUpperCase()}</span> over {report.horizon} —
            score {rec.score}/100, confidence {Math.round(rec.confidence * 100)}%. {rec.horizon}.
          </p>
        </section>
      )}
    </Card>
  )
}
