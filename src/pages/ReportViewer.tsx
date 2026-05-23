import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import Lenis from "lenis"
import { QRCodeSVG } from "qrcode.react"
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  ExternalLink,
  GitCompareArrows,
  Gauge,
  Info,
  LineChart as LineChartIcon,
  MapPin,
  Newspaper,
  QrCode,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ActionBadge } from "@/components/common/ActionBadge"
import { ReportMaps } from "@/components/common/ReportMaps"
import { ScoreGauge } from "@/components/common/ScoreGauge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCommodity } from "@/api/hooks"
import { REPORT_MAP_POINTS } from "@/lib/report-map-points"
import {
  defaultReportConfig,
  loadReportConfig,
  reportCommodityId,
  type ReportConfig,
  type WhatIfScenarioConfig,
} from "@/lib/report-config"
import { fmtDate, fmtPct, reliabilityLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Action, Commodity, Evidence } from "@/types"

type ExplainPayload = {
  title: string
  body: string
  citations: string[]
}

const actionArc: Record<Action, string> = {
  buy: "var(--buy)",
  wait: "var(--wait)",
  hedge: "var(--hedge)",
  monitor: "var(--monitor)",
}

const actionFromScore = (score: number): Action =>
  score >= 72 ? "buy" : score >= 62 ? "hedge" : score >= 46 ? "monitor" : "wait"

const REPORT_CHAPTER_SELECTOR = ".report-chapter"
const easeInOutCubic = (time: number) =>
  time < 0.5 ? 4 * time * time * time : 1 - Math.pow(-2 * time + 2, 3) / 2

function useLenisScroll() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
    lenisRef.current = lenis
    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return lenisRef
}

function reportChapters() {
  return Array.from(document.querySelectorAll<HTMLElement>(REPORT_CHAPTER_SELECTOR))
}

function activeReportChapterIndex(chapters = reportChapters()) {
  const viewportCenter = window.innerHeight / 2
  return chapters.reduce((bestIndex, chapter, index) => {
    const best = chapters[bestIndex]
    if (!best) return index
    const currentRect = chapter.getBoundingClientRect()
    const bestRect = best.getBoundingClientRect()
    const currentDistance = Math.abs(currentRect.top + currentRect.height / 2 - viewportCenter)
    const bestDistance = Math.abs(bestRect.top + bestRect.height / 2 - viewportCenter)
    return currentDistance < bestDistance ? index : bestIndex
  }, 0)
}

function useReportSectionNavigation(enabled: boolean, lenisRef: { current: Lenis | null }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [sectionCount, setSectionCount] = useState(0)

  useEffect(() => {
    let frame = 0
    const updateActiveSection = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const chapters = reportChapters()
        setSectionCount(chapters.length)
        if (chapters.length > 0) {
          setActiveIndex(activeReportChapterIndex(chapters))
        }
      })
    }

    updateActiveSection()
    window.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [])

  const scrollToSection = useCallback((index: number) => {
    const chapters = reportChapters()
    if (chapters.length === 0) return
    const nextIndex = Math.max(0, Math.min(chapters.length - 1, index))
    setActiveIndex(nextIndex)
    const target = chapters[nextIndex]
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        duration: 1.25,
        lock: true,
        easing: easeInOutCubic,
      })
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [lenisRef])

  const goToPreviousSection = useCallback(() => scrollToSection(activeReportChapterIndex() - 1), [scrollToSection])
  const goToNextSection = useCallback(() => scrollToSection(activeReportChapterIndex() + 1), [scrollToSection])

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName.toLowerCase()
      if (tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable) return

      const key = event.key.toLowerCase()
      if (key === "p") {
        event.preventDefault()
        goToPreviousSection()
      }
      if (key === "n") {
        event.preventDefault()
        goToNextSection()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [enabled, goToNextSection, goToPreviousSection])

  return {
    activeIndex,
    sectionCount,
    goToPreviousSection,
    goToNextSection,
  }
}

function daysUntil(date: string) {
  const start = new Date("2026-05-23T12:00:00Z")
  const end = new Date(`${date}T12:00:00Z`)
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000))
}

function selectedDrivers(c: Commodity, config: ReportConfig) {
  const selected = new Set(config.factors)
  return c.drivers.filter((driver) => selected.has(driver.id))
}

function evidenceFor(c: Commodity, ids: string[]) {
  const wanted = new Set(ids)
  return c.evidence.filter((item) => wanted.has(item.id))
}

function scenarioScore(c: Commodity, scenario: WhatIfScenarioConfig) {
  const delta = scenario.driverIds.reduce((sum, id) => {
    const driver = c.drivers.find((item) => item.id === id)
    if (!driver) return sum
    return sum + (driver.direction === "up" ? driver.weight : -driver.weight) * 18
  }, 0)
  return Math.max(0, Math.min(100, Math.round(c.recommendation.score + delta)))
}

function splitSummary(summary: string) {
  return summary.split(/(?<=\.)\s+/).slice(0, 2).join(" ")
}

function reportUrl(reportId: string) {
  return `${window.location.origin}/r/${reportId}`
}

function Chapter({
  eyebrow,
  title,
  icon: Icon,
  children,
  className,
}: {
  eyebrow: string
  title: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "report-chapter relative flex min-h-screen snap-start flex-col justify-center px-5 py-16 sm:px-8 lg:px-14",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-md border border-border/70 bg-card/50 text-cala">
            <Icon className="size-5" />
          </span>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cala/80">{eyebrow}</p>
        </div>
        <h2 className="display-serif mt-4 max-w-4xl text-4xl leading-tight sm:text-6xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

function SectionNavigation({
  activeIndex,
  sectionCount,
  onPrevious,
  onNext,
}: {
  activeIndex: number
  sectionCount: number
  onPrevious: () => void
  onNext: () => void
}) {
  if (sectionCount <= 1) return null

  const canGoPrevious = activeIndex > 0
  const canGoNext = activeIndex < sectionCount - 1

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex items-center gap-2 sm:bottom-6 sm:right-8">
      <div className="pointer-events-auto hidden rounded-md border border-border/70 bg-card/75 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground shadow-sm backdrop-blur-md sm:block">
        {String(activeIndex + 1).padStart(2, "0")}/{String(sectionCount).padStart(2, "0")}
      </div>
      <div className="pointer-events-auto flex overflow-hidden rounded-md border border-border/70 bg-card/75 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="inline-flex h-11 w-12 items-center justify-center text-foreground transition hover:bg-foreground/[0.06] disabled:pointer-events-none disabled:opacity-35"
          aria-label="Previous report section"
          title="Previous section (P)"
        >
          <ChevronUp className="size-5" strokeWidth={2.5} />
        </button>
        <div className="w-px bg-border/70" />
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="inline-flex h-11 w-12 items-center justify-center text-foreground transition hover:bg-foreground/[0.06] disabled:pointer-events-none disabled:opacity-35"
          aria-label="Next report section"
          title="Next section (N)"
        >
          <ChevronDown className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

function ExplainButton({
  payload,
  onExplain,
}: {
  payload: ExplainPayload
  onExplain: (payload: ExplainPayload) => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onExplain(payload)}
      className="gap-1.5"
    >
      <Info className="size-3.5" />
      Explain
    </Button>
  )
}

function ExplainPanel({
  payload,
  onClose,
}: {
  payload: ExplainPayload | null
  onClose: () => void
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-popover/95 p-6 shadow-2xl backdrop-blur-xl transition-transform duration-300",
        payload ? "translate-x-0" : "translate-x-full",
      )}
      aria-hidden={!payload}
    >
      {payload ? (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cala">Why</p>
              <h3 className="display-serif mt-2 text-3xl leading-tight">{payload.title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
              <span className="sr-only">Close explanation</span>
            </button>
          </div>
          <p className="mt-6 text-sm leading-7 text-foreground/85">{payload.body}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {payload.citations.map((citation) => (
              <span key={citation} className="rounded-sm border border-border bg-background/60 px-2 py-1 text-xs text-cala">
                {citation}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}

function Cover({ c, config, publicMode }: { c: Commodity; config: ReportConfig; publicMode: boolean }) {
  return (
    <section className="report-chapter relative flex min-h-screen snap-start flex-col justify-center overflow-hidden px-5 py-16 sm:px-8 lg:px-14">
      <div className="relative mx-auto w-full max-w-7xl">
        {publicMode ? (
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Public jury pack</span>
        ) : null}

        <div className="mt-20 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cala">
            Cales procurement brief · {fmtDate(config.generatedAt)}
          </p>
          <h1 className="display-serif mt-5 text-6xl leading-[0.95] sm:text-8xl lg:text-9xl">
            {c.name}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-muted-foreground">
            {c.name} procurement report for Damm. Horizon:{" "}
            <span className="text-foreground">{config.horizon}</span>.
          </p>
        </div>
      </div>
    </section>
  )
}

function Summary({
  c,
  config,
  onExplain,
}: {
  c: Commodity
  config: ReportConfig
  onExplain: (payload: ExplainPayload) => void
}) {
  const rec = c.recommendation
  const days = daysUntil(config.countdownEvent.date)
  const summary = splitSummary(rec.summary)

  return (
    <Chapter eyebrow="01 · Summary" title="Recommendation summary and timing risk." icon={Gauge}>
      <div className="grid items-center gap-8 lg:grid-cols-[420px_1fr]">
        <Card className="items-center justify-center border-border/70 bg-card/45 p-8">
          <ScoreGauge score={rec.score} size={300} colorVar={actionArc[rec.action]} />
          <ActionBadge action={rec.action} size="lg" className="mt-8" />
        </Card>
        <div className="space-y-5">
          <div className="rounded-lg border border-border/70 bg-background/35 p-6">
            <div className="flex items-center gap-3 text-cala">
              <CalendarClock className="size-5" />
              <span className="font-mono text-xs uppercase tracking-[0.2em]">Next material event</span>
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-4">
              <span className="font-mono text-7xl tabular-nums">{days}</span>
              <div className="pb-2">
                <p className="text-xl text-foreground">{config.countdownEvent.label}</p>
                <p className="text-sm text-muted-foreground">{fmtDate(config.countdownEvent.date)}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              If {config.countdownEvent.outcome}, recommendation may shift to{" "}
              <span className="font-medium uppercase text-foreground">{config.countdownEvent.shiftTo}</span>.
            </p>
          </div>
          <Card className="border-border/70 bg-card/45 p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="max-w-3xl text-xl leading-8 text-foreground/90">{summary}</p>
              <ExplainButton
                onExplain={onExplain}
                payload={{
                  title: "Executive summary",
                  body: `The summary is composed from the current recommendation and the selected market drivers. The strongest active factors are ${selectedDrivers(c, config).slice(0, 2).map((driver) => driver.label).join(" and ")}, which explain the action bias.`,
                  citations: selectedDrivers(c, config).slice(0, 3).map((driver) => driver.sourceId ?? driver.label),
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </Chapter>
  )
}

function DecisionStrip({ c, config }: { c: Commodity; config: ReportConfig }) {
  return (
    <Chapter eyebrow="02 · Decision" title="Recommended action, confidence, horizon, and spot price." icon={Target}>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/70 bg-card/45 p-6 md:col-span-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Action</p>
          <ActionBadge action={c.recommendation.action} size="lg" className="mt-5 text-lg" />
        </Card>
        <Card className="border-border/70 bg-card/45 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</p>
          <p className="mt-4 font-mono text-6xl">{Math.round(c.recommendation.confidence * 100)}%</p>
        </Card>
        <Card className="border-border/70 bg-card/45 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Horizon</p>
          <p className="mt-4 font-mono text-6xl">{config.horizon}</p>
        </Card>
        <Card className="border-border/70 bg-card/45 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Spot</p>
          <p className="mt-4 font-mono text-4xl">{c.spot}</p>
          <p className="mt-1 text-sm text-muted-foreground">{c.unit}</p>
        </Card>
      </div>
    </Chapter>
  )
}

function buildForkedPriceData(c: Commodity, activeScenario: WhatIfScenarioConfig) {
  const history = c.series.slice(-80)
  const last = history.at(-1)
  if (!last) return []

  const activeScore = scenarioScore(c, activeScenario)
  const bias = (activeScore - c.recommendation.score) / 100
  const data: Array<{
    date: string
    history: number | null
    base: number | null
    upside: number | null
    downside: number | null
  }> = history.map((point) => ({
    date: point.date,
    history: point.value,
    base: null as number | null,
    upside: null as number | null,
    downside: null as number | null,
  }))

  const start = new Date(`${last.date}T12:00:00Z`)
  for (let step = 0; step <= 28; step += 1) {
    const date = new Date(start)
    date.setUTCDate(date.getUTCDate() + step)
    const t = step / 28
    data.push({
      date: date.toISOString().slice(0, 10),
      history: step === 0 ? last.value : null,
      base: Math.round(last.value * (1 + t * 0.025) * 100) / 100,
      upside: Math.round(last.value * (1 + t * (0.075 + Math.max(0, bias))) * 100) / 100,
      downside: Math.round(last.value * (1 - t * (0.055 + Math.max(0, -bias))) * 100) / 100,
    })
  }
  return data
}

function PriceWhatIf({
  c,
  config,
  onExplain,
}: {
  c: Commodity
  config: ReportConfig
  onExplain: (payload: ExplainPayload) => void
}) {
  const [activeId, setActiveId] = useState(config.whatIfScenarios[0]?.id ?? "base")
  const activeScenario = config.whatIfScenarios.find((scenario) => scenario.id === activeId) ?? config.whatIfScenarios[0]
  const data = useMemo(() => buildForkedPriceData(c, activeScenario), [c, activeScenario])
  const score = scenarioScore(c, activeScenario)
  const action = actionFromScore(score)
  const today = c.series.at(-1)?.date
  const directionColor = c.change30d >= 0 ? "var(--positive)" : "var(--negative)"

  return (
    <Chapter eyebrow="03 · Price + Scenario" title="Price outlook under the selected scenario." icon={LineChartIcon}>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="h-[520px] border-border/70 bg-card/45 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 18, right: 28, bottom: 24, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#9a9a97", fontSize: 11 }} minTickGap={36} />
              <YAxis tick={{ fill: "#9a9a97", fontSize: 11 }} width={70} />
              <Tooltip
                contentStyle={{ background: "#141416", border: "1px solid #2a2a2d", borderRadius: 6 }}
              />
              <Legend />
              {today ? <ReferenceLine x={today} stroke="#f7f6f3" strokeDasharray="4 4" label="Today" /> : null}
              <Line type="monotone" dataKey="history" dot={false} stroke={directionColor} strokeWidth={3} connectNulls />
              <Line type="monotone" dataKey="base" dot={false} stroke="var(--cala)" strokeWidth={activeId === "base" ? 4 : 2} strokeOpacity={activeId === "base" ? 1 : 0.35} connectNulls isAnimationActive />
              <Line type="monotone" dataKey="upside" dot={false} stroke="var(--positive)" strokeWidth={activeId === "upside" ? 4 : 2} strokeOpacity={activeId === "upside" ? 1 : 0.35} connectNulls isAnimationActive />
              <Line type="monotone" dataKey="downside" dot={false} stroke="var(--negative)" strokeWidth={activeId === "downside" ? 4 : 2} strokeOpacity={activeId === "downside" ? 1 : 0.35} connectNulls isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="space-y-3">
          <Card className="border-border/70 bg-card/45 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Scenario result</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="font-mono text-6xl">{score}</span>
              <ActionBadge action={action} size="lg" />
            </div>
          </Card>
          {config.whatIfScenarios.map((scenario) => {
            const supporting = evidenceFor(c, scenario.evidenceIds)
            return (
              <div
                key={scenario.id}
                className={cn(
                  "rounded-lg border p-4 transition",
                  activeId === scenario.id ? "border-cala bg-cala/10" : "border-border/70 bg-card/35 hover:border-foreground/30",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveId(scenario.id)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block text-sm font-medium">{scenario.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {scenario.driverIds.map((id) => c.drivers.find((driver) => driver.id === id)?.label).filter(Boolean).join(", ")}
                    </span>
                  </button>
                  <ExplainButton
                    onExplain={onExplain}
                    payload={{
                      title: scenario.label,
                      body: `This branch changes the score according to the selected driver weights. Supporting drivers are ${scenario.driverIds.map((id) => c.drivers.find((driver) => driver.id === id)?.label).filter(Boolean).join(" and ")}, so the projected path moves with those assumptions.`,
                      citations: supporting.map((item) => item.source),
                    }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {supporting.map((item) => (
                    <span key={item.id} className="rounded-xs border border-border px-1.5 py-px text-[11px] text-cala">
                      {item.source}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Chapter>
  )
}

function HorizonComparison({ c, config }: { c: Commodity; config: ReportConfig }) {
  const selected = selectedDrivers(c, config)
  const top = selected[0] ?? c.drivers[0]
  const oneMonthAction = c.change30d < -1 ? "wait" : c.recommendation.action
  const sixMonthAction = c.recommendation.action
  const disagree = oneMonthAction !== sixMonthAction

  return (
    <Chapter eyebrow="04 · Horizon comparison" title="Short-term versus six-month recommendation." icon={GitCompareArrows}>
      <div className="grid gap-5 lg:grid-cols-2">
        {[
          { label: "1M", change: c.change30d, action: oneMonthAction, confidence: Math.max(42, Math.round(c.recommendation.confidence * 100 - 8)), driver: top },
          { label: "6M", change: c.change30d * 1.6, action: sixMonthAction, confidence: Math.round(c.recommendation.confidence * 100), driver: selected[1] ?? top },
        ].map((column) => (
          <Card key={column.label} className="border-border/70 bg-card/45 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-5xl">{column.label}</p>
              <ActionBadge action={column.action} size="lg" />
            </div>
            <dl className="mt-8 grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Trend</dt>
                <dd className={cn("mt-2 font-mono text-3xl", column.change >= 0 ? "text-positive" : "text-negative")}>
                  {fmtPct(column.change)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</dt>
                <dd className="mt-2 font-mono text-3xl">{column.confidence}%</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Top driver</dt>
                <dd className="mt-2 text-sm leading-6 text-foreground/85">{column.driver?.label}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
      {disagree ? (
        <div className="mt-5 rounded-lg border border-hedge/40 bg-hedge/10 p-4 text-sm text-hedge">
          Short-term and six-month actions disagree. Use the one-month view for tactical ordering and the six-month view for hedge exposure.
        </div>
      ) : null}
    </Chapter>
  )
}

function MapChapter({
  c,
  onExplain,
}: {
  c: Commodity
  onExplain: (payload: ExplainPayload) => void
}) {
  const points = REPORT_MAP_POINTS[c.id]
  return (
    <Chapter eyebrow="05 · Map" title="Geographic exposure and supply-chain risk points." icon={MapPin}>
      <ReportMaps c={c} />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {points.map((point, index) => {
          const driver = c.drivers[index % c.drivers.length]
          const source = driver?.sourceId ? c.evidence.find((item) => item.id === driver.sourceId) : undefined
          return (
            <button
              key={point.id}
              type="button"
              onClick={() =>
                onExplain({
                  title: point.label,
                  body: `${point.description ?? "This location is part of the route map."} It is connected to ${driver?.label}, so it is shown as a geographic risk anchor for the brief.`,
                  citations: [source?.source ?? driver?.sourceId ?? point.label],
                })
              }
              className="rounded-lg border border-border/70 bg-card/35 p-4 text-left hover:border-foreground/30"
            >
              <MapPin className="size-4 text-cala" />
              <p className="mt-3 text-sm font-medium">{point.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{point.description}</p>
              {driver ? (
                <p className="mt-3 text-[11px] text-cala">
                  Driver: {driver.label}
                  {source ? ` · ${source.source}` : ""}
                </p>
              ) : null}
            </button>
          )
        })}
      </div>
    </Chapter>
  )
}

function DriversChapter({ c, config }: { c: Commodity; config: ReportConfig }) {
  const drivers = selectedDrivers(c, config)
  const max = Math.max(...drivers.map((driver) => driver.weight), 0.01)
  return (
    <Chapter eyebrow="06 · Drivers" title="Main upward and downward price drivers." icon={TrendingUp}>
      <div className="grid gap-5 lg:grid-cols-2">
        {(["up", "down"] as const).map((direction) => (
          <Card key={direction} className="border-border/70 bg-card/45 p-6">
            <h3 className={cn("flex items-center gap-2 text-lg font-medium", direction === "up" ? "text-positive" : "text-negative")}>
              {direction === "up" ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
              {direction === "up" ? "Upward pressure" : "Downward pressure"}
            </h3>
            <div className="mt-5 space-y-5">
              {drivers.filter((driver) => driver.direction === direction).map((driver) => (
                <div key={driver.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{driver.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{Math.round(driver.weight * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-background">
                    <div
                      className={cn("h-full rounded-full", direction === "up" ? "bg-positive" : "bg-negative")}
                      style={{ width: `${(driver.weight / max) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {driver.rationale} {driver.sourceId ? <span className="text-cala">#{driver.sourceId}</span> : null}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Chapter>
  )
}

function newsImpact(c: Commodity, item: Evidence) {
  const driver = c.drivers.find((candidate) => candidate.sourceId === item.id)
  const sign = driver?.direction === "up" ? 1 : driver?.direction === "down" ? -1 : 0
  const score = driver ? Math.round(sign * driver.weight * 30) : 0
  return { score, driver }
}

function NewsChapter({
  c,
  config,
  onExplain,
}: {
  c: Commodity
  config: ReportConfig
  onExplain: (payload: ExplainPayload) => void
}) {
  const selected = new Set(config.news ?? c.evidence.map((item) => item.id))
  const items = c.evidence
    .filter((item) => selected.has(item.id))
    .sort((a, b) => Math.abs(newsImpact(c, b).score) - Math.abs(newsImpact(c, a).score))
  return (
    <Chapter eyebrow="07 · Relevant news" title="Evidence ranked by estimated recommendation impact." icon={Newspaper}>
      <div className="space-y-3">
        {items.map((item) => {
          const impact = newsImpact(c, item)
          const tone = impact.driver?.direction === "up" ? "Bullish" : impact.driver?.direction === "down" ? "Bearish" : "Neutral"
          return (
            <Card key={item.id} className="border-border/70 bg-card/45 p-5">
              <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{item.source}</span>
                    <span>{fmtDate(item.date)}</span>
                    <span>{reliabilityLabel[item.reliability]}</span>
                    <span className={impact.driver?.direction === "down" ? "text-negative" : impact.driver?.direction === "up" ? "text-positive" : "text-muted-foreground"}>
                      {tone}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-medium">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
                </div>
                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <span className="font-mono text-3xl">{impact.score > 0 ? "+" : ""}{impact.score}</span>
                  <span className="text-xs text-muted-foreground">score impact</span>
                  <ExplainButton
                    onExplain={onExplain}
                    payload={{
                      title: item.title,
                      body: `This row is ranked by the builder impact slider and its linked driver. ${impact.driver ? `${impact.driver.label} is the connected driver, and its rationale is: ${impact.driver.rationale}` : "No explicit driver link is available, so the item is treated as contextual evidence."}`,
                      citations: [item.source, item.id],
                    }}
                  />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </Chapter>
  )
}

function FooterChapter({ c, config }: { c: Commodity; config: ReportConfig }) {
  const drivers = selectedDrivers(c, config)
  const sources = Array.from(new Set(c.evidence.map((item) => item.source).concat("Cala")))
  return (
    <Chapter eyebrow="08 · Audit" title="Report inputs, sources, and audit trail." icon={ClipboardCheck}>
      <Card className="border-border/70 bg-card/45 p-6">
        <dl className="grid gap-5 md:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Generated by</dt>
            <dd className="mt-2 text-lg">{config.generatedBy}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Generated at</dt>
            <dd className="mt-2 font-mono text-sm">{config.generatedAt}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Horizon</dt>
            <dd className="mt-2 text-lg">{config.horizon}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Report id</dt>
            <dd className="mt-2 font-mono text-sm">{config.reportId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Version hash</dt>
            <dd className="mt-2 font-mono text-sm">{config.versionHash}</dd>
          </div>
        </dl>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium">Factors taken into account</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {drivers.map((driver) => <li key={driver.id}>- {driver.label}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Sources consulted</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((source) => (
                <span key={source} className="rounded-sm border border-border px-2 py-1 text-xs text-cala">
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </Chapter>
  )
}

function QRDialog({
  url,
  open,
  onOpenChange,
}: {
  url: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="report-theme bg-background text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl">Scan to open on your phone</DialogTitle>
          <DialogDescription>Opens the public jury pack for this report.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-5 pt-2">
          <div className="rounded-lg bg-white p-4">
            <QRCodeSVG value={url} size={220} bgColor="#ffffff" fgColor="#211d1a" />
          </div>
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => navigator.clipboard.writeText(url)}>
              <Copy className="size-4" />
              Copy URL
            </Button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-border text-sm hover:bg-foreground/[0.04]"
            >
              <ExternalLink className="size-4" />
              Open
            </a>
          </div>
          <p className="break-all text-center font-mono text-[11px] text-muted-foreground">{url}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CinematicReport({
  c,
  config,
  publicMode,
}: {
  c: Commodity
  config: ReportConfig
  publicMode: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [explain, setExplain] = useState<ExplainPayload | null>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const lenisRef = useLenisScroll()
  const sectionNavigation = useReportSectionNavigation(!qrOpen && !explain, lenisRef)

  const goBack = () => {
    const run = () => {
      if (location.key !== "default") {
        navigate(-1)
      } else {
        navigate(`/c/${c.id}/reports`)
      }
    }
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (doc.startViewTransition) {
      doc.startViewTransition(run)
    } else {
      run()
    }
  }

  return (
    <div className="report-theme report-enter min-h-screen snap-y snap-mandatory overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-14">
        {!publicMode ? (
          <button
            type="button"
            onClick={goBack}
            className="pointer-events-auto inline-flex items-center gap-2 text-foreground transition hover:opacity-60"
          >
            <ArrowLeft className="size-5" strokeWidth={2.75} />
            <span className="text-sm font-bold uppercase tracking-[0.12em]">Back</span>
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="pointer-events-auto inline-flex items-center gap-2 text-foreground transition hover:opacity-60"
        >
          <span className="text-sm font-bold uppercase tracking-[0.12em]">Share</span>
          <QrCode className="size-5" strokeWidth={2.75} />
        </button>
      </div>

      <Cover c={c} config={config} publicMode={publicMode} />
      <Summary c={c} config={config} onExplain={setExplain} />
      <DecisionStrip c={c} config={config} />
      <PriceWhatIf c={c} config={config} onExplain={setExplain} />
      <HorizonComparison c={c} config={config} />
      <MapChapter c={c} onExplain={setExplain} />
      <DriversChapter c={c} config={config} />
      <NewsChapter c={c} config={config} onExplain={setExplain} />
      <FooterChapter c={c} config={config} />
      <ExplainPanel payload={explain} onClose={() => setExplain(null)} />
      <QRDialog url={reportUrl(config.reportId)} open={qrOpen} onOpenChange={setQrOpen} />
      <SectionNavigation
        activeIndex={sectionNavigation.activeIndex}
        sectionCount={sectionNavigation.sectionCount}
        onPrevious={sectionNavigation.goToPreviousSection}
        onNext={sectionNavigation.goToNextSection}
      />
    </div>
  )
}

export function ReportViewer({ publicMode = false }: { publicMode?: boolean }) {
  const { id, reportId = "" } = useParams<{ id?: string; reportId: string }>()
  const storedConfig = reportId ? loadReportConfig(reportId) : null
  const commodityId = storedConfig?.commodityId ?? reportCommodityId(reportId) ?? id
  const { data, isLoading, isError } = useCommodity(commodityId as Commodity["id"])

  const config = useMemo(() => {
    if (!data || !reportId) return null
    return storedConfig ?? defaultReportConfig(data, reportId)
  }, [data, reportId, storedConfig])

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Preparing brief...</div>
  }

  if (isError || !data || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Report not found.</p>
          <Link to="/reports" className="mt-3 inline-block text-sm underline">Back to reports</Link>
        </div>
      </div>
    )
  }

  return <CinematicReport c={data} config={config} publicMode={publicMode} />
}
