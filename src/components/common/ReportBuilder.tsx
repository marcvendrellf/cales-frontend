import { useState } from "react"
import { CalendarDays, Check, Loader2, Newspaper, Sparkles, TrendingDown, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { ActionBadge } from "@/components/common/ActionBadge"
import { ReportGeneratingSkeleton } from "@/components/common/PageSkeletons"
import { ReportPreview } from "@/components/common/ReportPreview"
import { fmtDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Commodity } from "@/types"

type SectionKey = "price" | "drivers" | "evidence" | "recommendation"
type ContextKey = "currentDate" | "spotPrice" | "warehouse" | "recentNews" | "sourceReliability"

type SectionDef = { key: SectionKey; label: string; hint: string; available: boolean }
type ContextFactor = { key: ContextKey; label: string; hint: string; available: boolean }

const HORIZONS = ["1M", "3M", "6M", "12M"] as const
type Horizon = (typeof HORIZONS)[number]

const CONTEXT_LABELS: Record<ContextKey, string> = {
  currentDate: "Current date",
  spotPrice: "Current spot price",
  warehouse: "Warehouse position",
  recentNews: "Recent news",
  sourceReliability: "Source reliability",
}

type GeneratedReport = {
  factors: Commodity["drivers"]
  sections: Record<SectionKey, boolean>
  contextFactors: Record<ContextKey, boolean>
  newsImpacts: Record<string, number>
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
  const contextFactors: ContextFactor[] = [
    { key: "currentDate", label: "Current date", hint: "Anchor the report to today's market window", available: true },
    { key: "spotPrice", label: "Current spot price", hint: `${c.spot} ${c.unit} and short-term movement`, available: true },
    { key: "warehouse", label: "Warehouse position", hint: c.warehouseFillPct != null ? `${c.warehouseFillPct}% current fill` : "Not available for this element", available: c.warehouseFillPct != null },
    { key: "recentNews", label: "Recent news", hint: `${c.evidence.length} available signals and source notes`, available: c.evidence.length > 0 },
    { key: "sourceReliability", label: "Source reliability", hint: "Weight high-confidence sources more strongly", available: c.evidence.length > 0 },
  ]
  const sectionDefs: SectionDef[] = [
    { key: "price", label: "Market context", hint: "Current price, date, trend and recent movement", available: true },
    { key: "drivers", label: "Factor analysis", hint: "Selected supply, demand, weather or cost drivers", available: true },
    { key: "evidence", label: "News and source notes", hint: `${c.evidence.length} items with impact weighting`, available: c.evidence.length > 0 },
    { key: "recommendation", label: "Decision and confidence", hint: "Procurement action, confidence and rationale", available: true },
  ]

  const [factors, setFactors] = useState<Set<string>>(() => new Set(c.drivers.map((d) => d.id)))
  const [includedContext, setIncludedContext] = useState<Record<ContextKey, boolean>>(() => ({
    currentDate: true,
    spotPrice: true,
    warehouse: c.warehouseFillPct != null,
    recentNews: true,
    sourceReliability: true,
  }))
  const [newsImpacts, setNewsImpacts] = useState<Record<string, number>>(() =>
    Object.fromEntries(c.evidence.map((e) => [e.id, 50])),
  )
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

  const toggleContext = (key: ContextKey) =>
    setIncludedContext((prev) => ({ ...prev, [key]: !prev[key] }))

  const selectedFactorCount = factors.size
  const selectedContextCount = Object.values(includedContext).filter(Boolean).length
  const reportSectionCount = Object.values(sections).filter(Boolean).length
  const canGenerate = selectedFactorCount > 0 && status !== "generating"

  function generate() {
    if (!canGenerate) return
    setStatus("generating")
    setReport(null)
    window.setTimeout(() => {
      setReport({
        factors: c.drivers.filter((d) => factors.has(d.id)),
        sections: { ...sections },
        contextFactors: { ...includedContext },
        newsImpacts: { ...newsImpacts },
        horizon,
        at: new Date().toISOString(),
      })
      setStatus("ready")
      toast.success("Report generated", { description: `${c.name} · ${horizon} horizon` })
    }, 1400)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-1 size-5 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-xl font-medium text-foreground">
              Which factors do you want to include?
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Select the report context before choosing market drivers and news impact.
            </p>
          </div>
        </div>
        <Card className="p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {contextFactors.map((factor) => (
              <ToggleRow
                key={factor.key}
                checked={includedContext[factor.key] && factor.available}
                onChange={() => toggleContext(factor.key)}
                disabled={!factor.available}
              >
                <span className="block text-sm">{factor.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{factor.hint}</span>
              </ToggleRow>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-foreground">Market drivers</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Choose the supply, demand, weather and cost drivers the report should weigh.
            </p>
          </div>
          <span className="mt-1 shrink-0 font-mono text-xs text-muted-foreground">
            {selectedFactorCount}/{c.drivers.length} selected
          </span>
        </div>
        <Card className="p-5">
          <div className="space-y-2">
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
      </section>

      <section className="space-y-3">
        <div className="flex items-start gap-3">
          <Newspaper className="mt-1 size-5 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-xl font-medium text-foreground">News impact</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Tune how much each source should influence the final report.
            </p>
          </div>
        </div>
        <Card className="p-5">
          <div className="space-y-5">
            {c.evidence.map((item) => {
              const value = newsImpacts[item.id] ?? 50
              return (
                <div key={item.id}>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.source} · {fmtDate(item.date)}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{value}%</span>
                  </div>
                  <Slider
                    className="mt-2"
                    value={[value]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={([next]) =>
                      setNewsImpacts((prev) => ({ ...prev, [item.id]: next }))
                    }
                  />
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-foreground">Report sections</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Decide what the generated report should contain.
            </p>
          </div>
          <span className="mt-1 shrink-0 font-mono text-xs text-muted-foreground">
            {reportSectionCount}/{sectionDefs.length} selected
          </span>
        </div>
        <Card className="p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {sectionDefs.map((s) => (
              <ToggleRow
                key={s.key}
                checked={sections[s.key] && s.available}
                onChange={() => toggleSection(s.key)}
                disabled={!s.available}
              >
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {s.available ? s.hint : "No data for this element"}
                </span>
              </ToggleRow>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium text-foreground">Forecast horizon</h2>
        <Card className="p-5">
          <div className="grid grid-cols-4 gap-1.5 sm:max-w-sm">
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

          <dl className="grid gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Context</dt>
              <dd className="mt-1 font-mono">{selectedContextCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Factors</dt>
              <dd className="mt-1 font-mono">{selectedFactorCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sections</dt>
              <dd className="mt-1 font-mono">{reportSectionCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Horizon</dt>
              <dd className="mt-1 font-mono">{horizon}</dd>
            </div>
          </dl>

          <Button onClick={generate} disabled={!canGenerate} className="mt-5 w-full sm:w-auto">
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
            <p className="mt-2 text-[11px] text-muted-foreground">
              Select at least one factor.
            </p>
          )}
        </Card>
      </section>

      <div>
        {status === "generating" && <ReportGeneratingSkeleton />}
        {status === "ready" && report && (
          <div className="space-y-6">
            <GeneratedReportView c={c} report={report} />
            <ReportPreview c={c} />
          </div>
        )}
      </div>
    </div>
  )
}

function GeneratedReportView({ c, report }: { c: Commodity; report: GeneratedReport }) {
  const rec = c.recommendation
  const includedContext = Object.entries(report.contextFactors)
    .filter(([, enabled]) => enabled)
    .map(([key]) => CONTEXT_LABELS[key as ContextKey])

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
            News impact and sources
          </h3>
          <ul className="mt-2 space-y-2">
            {c.evidence.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  <span className="text-foreground/80">{e.source}</span> — {e.title}{" "}
                  <span className="font-mono">({fmtDate(e.date)})</span>
                </span>
                <span className="shrink-0 font-mono text-foreground/80">
                  {report.newsImpacts[e.id] ?? 50}% impact
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Included context
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {includedContext.join(", ")}.
        </p>
      </section>

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
