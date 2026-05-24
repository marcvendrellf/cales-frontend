import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, type Variants } from "motion/react"
import Lenis from "lenis"
import { QRCodeSVG } from "qrcode.react"
import { useTheme } from "next-themes"
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Info,
  Moon,
  QrCode,
  Sun,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ScoreGauge } from "@/components/common/ScoreGauge"
import { Map as GeoMap, type MapPoint } from "@/components/ui/map"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCommodity } from "@/api/hooks"
import { api, resolveBackendUrl } from "@/api/client"
import { REPORT_MAP_POINTS } from "@/lib/report-map-points"
import {
  defaultReportConfig,
  loadReportConfig,
  reportCommodityId,
  reportConfigFromAgentResponse,
  type AgentPricePath,
  type AgentReportDriver,
  type AgentWebsiteReport,
  type ReportConfig,
  type WhatIfScenarioConfig,
} from "@/lib/report-config"
import { fmtDate, fmtNumber, fmtPct, reliabilityLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ACTION_LABELS, type Action, type Commodity, type Evidence } from "@/types"

type ExplainPayload = {
  title: string
  body: string
  citations: string[]
  evidenceRefs?: EvidenceReference[]
}

type EvidenceReference = {
  id: string
  source: string
  title?: string
  date?: string | null
  url?: string
}

const actionArc: Record<Action, string> = {
  buy: "var(--buy)",
  wait: "var(--wait)",
  hedge: "var(--hedge)",
  monitor: "var(--monitor)",
}

function actionFromAgent(action?: string): Action {
  const normalized = action?.trim().toLowerCase()
  if (normalized === "buy" || normalized === "buy_now") return "buy"
  if (normalized === "hedge") return "hedge"
  if (normalized === "wait") return "wait"
  if (normalized === "monitor") return "monitor"
  return "monitor"
}

function agentDirection(direction?: string): "up" | "down" | "neutral" {
  const normalized = direction?.toLowerCase() ?? ""
  if (normalized.includes("upward")) return "up"
  if (normalized.includes("downward")) return "down"
  return "neutral"
}

function reportPressureColor(direction: "up" | "down" | "neutral") {
  if (direction === "up") return "var(--negative)"
  if (direction === "down") return "var(--positive)"
  return "var(--muted-foreground)"
}

function reportPressureClass(direction: "up" | "down" | "neutral") {
  if (direction === "up") return "text-negative"
  if (direction === "down") return "text-positive"
  return "text-muted-foreground"
}

function agentTone(direction?: string) {
  const normalized = agentDirection(direction)
  if (normalized === "up") return { label: "Bullish", className: reportPressureClass("up") }
  if (normalized === "down") return { label: "Bearish", className: reportPressureClass("down") }
  return { label: "Neutral", className: "text-muted-foreground" }
}

function fmtOptionalDate(iso?: string | null) {
  return iso ? fmtDate(iso) : "No date"
}

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

function agentReport(config: ReportConfig): AgentWebsiteReport | null {
  return config.agentResponse?.status === "completed" ? config.agentResponse.report_json : null
}

function agentEvidenceFor(report: AgentWebsiteReport | null, ids: string[]) {
  if (!report) return []
  const wanted = new Set(ids)
  return report.evidence.filter((item) => wanted.has(item.id))
}

function looksLikeRawReference(value: string) {
  return /^(ev|drv|src|mock)_[a-z0-9_]+$/i.test(value)
}

function cleanSourceLabels(sources: string[]) {
  return Array.from(
    new Set(
      sources
        .map((source) => source.trim())
        .filter(Boolean)
        .filter((source) => !looksLikeRawReference(source)),
    ),
  )
}

function evidenceSourceLabels(c: Commodity, report: AgentWebsiteReport | null, refs: string[]) {
  const agentEvidence = new Map((report?.evidence ?? []).map((item) => [item.id, item.source]))
  const commodityEvidence = new Map(c.evidence.map((item) => [item.id, item.source]))

  return cleanSourceLabels(
    refs.map((ref) => agentEvidence.get(ref) ?? commodityEvidence.get(ref) ?? ref),
  )
}

function evidenceReferences(c: Commodity, report: AgentWebsiteReport | null, refs: string[]): EvidenceReference[] {
  const agentEvidence = new Map((report?.evidence ?? []).map((item) => [item.id, item]))
  const commodityEvidence = new Map(c.evidence.map((item) => [item.id, item]))
  const seen = new Set<string>()

  return refs.flatMap((ref) => {
    const agentItem = agentEvidence.get(ref)
    const commodityItem = commodityEvidence.get(ref)
    const item = agentItem ?? commodityItem
    const key = item?.id ?? ref
    if (seen.has(key)) return []
    seen.add(key)

    if (agentItem) {
      return [{
        id: agentItem.id,
        source: agentItem.source,
        title: agentItem.title,
        date: agentItem.date,
        url: agentItem.url,
      }]
    }
    if (commodityItem) {
      return [{
        id: commodityItem.id,
        source: commodityItem.source,
        title: commodityItem.title,
        date: commodityItem.date,
        url: commodityItem.url,
      }]
    }
    if (looksLikeRawReference(ref)) return []
    return [{ id: ref, source: ref }]
  })
}

function allEvidenceReferences(c: Commodity, report: AgentWebsiteReport | null) {
  const agentRefs = report?.evidence.map((item) => item.id) ?? []
  const commodityRefs = c.evidence.map((item) => item.id)
  return evidenceReferences(c, report, [...agentRefs, ...commodityRefs])
}

function demoEvidenceReferences(
  c: Commodity,
  report: AgentWebsiteReport | null,
  primaryRefs: string[] = [],
  minimum = 4,
) {
  const picked = evidenceReferences(c, report, primaryRefs)
  const seen = new Set(picked.map((item) => item.id))
  const extras = allEvidenceReferences(c, report).filter((item) => !seen.has(item.id))
  return [...picked, ...extras].slice(0, Math.max(minimum, picked.length))
}

function agentDriverDirection(driver: AgentReportDriver) {
  return agentDirection(driver.direction)
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

function forceDownloadUrl(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}inline=false`
}

function reportPdfDownloadUrl(config: ReportConfig) {
  const readyPdfUrl = config.agentResponse?.executive_pdf?.status === "ready"
    ? config.agentResponse.executive_pdf.url
    : `/reports/${config.reportId}/executive.pdf`
  return forceDownloadUrl(resolveBackendUrl(readyPdfUrl))
}

function referenceHref(ref: EvidenceReference) {
  if (ref.url) return ref.url
  const query = [ref.source, ref.title].filter(Boolean).join(" ")
  return query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : undefined
}

/* ── Editorial primitives ─────────────────────────────────────────────── */

// Scroll-based viewport detection (IntersectionObserver is unreliable here).
// One-shot: once revealed it stays revealed.
function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function useInViewport<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let frame = 0
    const check = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight
        const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
        if (visible > vh * 0.22) setInView(true)
      })
    }
    check()
    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
  }, [])

  return { ref, inView }
}

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: 0.04 + i * 0.09 },
  }),
}

function Eyebrow({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[11px] tabular-nums tracking-[0.3em] text-muted-foreground/60">{index}</span>
      <span className="h-px w-8 bg-border" />
      <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-cala/80">{label}</span>
    </div>
  )
}

function Chapter({
  index,
  eyebrow,
  title,
  lede,
  children,
  className,
}: {
  index: string
  eyebrow: string
  title: React.ReactNode
  lede?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const { ref, inView } = useInViewport<HTMLDivElement>()
  return (
    <section
      className={cn(
        "report-chapter relative flex min-h-screen snap-start flex-col justify-center px-5 py-16 sm:px-8 lg:px-16",
        className,
      )}
    >
      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="mx-auto w-full max-w-6xl"
      >
        <motion.div variants={reveal} custom={0}>
          <Eyebrow index={index} label={eyebrow} />
        </motion.div>
        <motion.h2
          variants={reveal}
          custom={1}
          className="display-serif mt-7 max-w-4xl text-4xl leading-[1.04] sm:text-5xl lg:text-[3.75rem]"
        >
          {title}
        </motion.h2>
        {lede ? (
          <motion.p variants={reveal} custom={2} className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {lede}
          </motion.p>
        ) : null}
        {children ? (
          <motion.div variants={reveal} custom={3} className="mt-10">
            {children}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  )
}

function Figure({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  accent?: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="display-serif mt-2.5 text-5xl leading-none tabular-nums sm:text-6xl" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {sub ? <p className="mt-2 text-sm text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function SourceLine({ sources, className }: { sources: string[]; className?: string }) {
  const unique = cleanSourceLabels(sources)
  if (unique.length === 0) return null
  return (
    <p className={cn("font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70", className)}>
      Sources ·{" "}
      {unique.map((source, index) => (
        <span key={source}>
          <span className={cn(source.toLowerCase().includes("cala") && "text-cala")}>{source}</span>
          {index < unique.length - 1 ? "  /  " : ""}
        </span>
      ))}
    </p>
  )
}

function SourceDetails({ refs, className }: { refs: EvidenceReference[]; className?: string }) {
  if (refs.length === 0) return null
  return (
    <div className={cn("mt-2 space-y-1.5", className)}>
      {refs.map((ref) => (
        <div key={ref.id} className="text-xs leading-5 text-muted-foreground">
          <span className={cn("font-mono uppercase tracking-[0.14em] text-muted-foreground/70", ref.source.toLowerCase().includes("cala") && "text-cala")}>
            {ref.source}
          </span>
          {ref.date ? <span className="font-mono text-muted-foreground/50"> · {fmtOptionalDate(ref.date)}</span> : null}
          {ref.title ? (
            <span className="ml-2 text-foreground/85">
              {referenceHref(ref) ? (
                <a href={referenceHref(ref)} target="_blank" rel="noopener noreferrer" className="transition hover:text-foreground">
                  {ref.title}
                </a>
              ) : (
                ref.title
              )}
            </span>
          ) : null}
        </div>
      ))}
    </div>
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
  label = "Why",
}: {
  payload: ExplainPayload
  onExplain: (payload: ExplainPayload) => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onExplain(payload)}
      className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-cala/80 transition hover:text-foreground"
    >
      <Info className="size-3.5" />
      <span className="border-b border-cala/30 pb-0.5 transition group-hover:border-foreground/60">{label}</span>
    </button>
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
          {payload.evidenceRefs?.length ? (
            <div className="mt-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                References consulted
              </p>
              <div className="mt-3 space-y-3">
                {payload.evidenceRefs.map((ref) => (
                  <div key={ref.id} className="rounded-md border border-border/70 bg-background/35 p-3">
                    <p className={cn("font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70", ref.source.toLowerCase().includes("cala") && "text-cala")}>
                      {ref.source}{ref.date ? ` · ${fmtOptionalDate(ref.date)}` : ""}
                    </p>
                    {ref.title ? (
                      <p className="mt-1.5 text-sm leading-5 text-foreground/90">
                        {referenceHref(ref) ? (
                          <a href={referenceHref(ref)} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 transition hover:text-foreground">
                            <span>{ref.title}</span>
                            <ExternalLink className="mt-0.5 size-3 shrink-0" />
                          </a>
                        ) : (
                          ref.title
                        )}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {payload.citations.length > 0 ? (
            <SourceLine sources={payload.citations} className="mt-6" />
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}

/* ── Slides ───────────────────────────────────────────────────────────── */

function Cover({ c, config, publicMode }: { c: Commodity; config: ReportConfig; publicMode: boolean }) {
  const report = agentReport(config)
  const generatedAt = report?.generated_at ?? config.generatedAt
  const horizon = report?.horizon_label ?? config.horizon
  const action = actionFromAgent(report?.recommendation.action ?? c.recommendation.action)
  const thesis = report?.recommendation.summary ?? splitSummary(c.recommendation.summary)

  return (
    <section className="report-chapter relative flex min-h-screen snap-start flex-col justify-center overflow-hidden px-5 py-16 sm:px-8 lg:px-16">
      <div className="relative mx-auto w-full max-w-6xl">
        {publicMode ? (
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Public jury pack</span>
        ) : null}

        <div className="mt-20 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cala">
            Cales procurement brief · {fmtDate(generatedAt)}
          </p>
          <h1 className="display-serif mt-6 text-6xl leading-[0.92] sm:text-8xl lg:text-[8.5rem]">{c.name}</h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-foreground/80">{thesis}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="font-medium" style={{ color: actionArc[action] }}>{ACTION_LABELS[action]}</span>
            <span className="h-3 w-px bg-border" />
            <span>Horizon {horizon}</span>
            <span className="h-3 w-px bg-border" />
            <span>Prepared for Damm</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function TheCall({
  c,
  config,
  onExplain,
}: {
  c: Commodity
  config: ReportConfig
  onExplain: (payload: ExplainPayload) => void
}) {
  const report = agentReport(config)
  const rec = report?.recommendation
  const action = actionFromAgent(rec?.action ?? c.recommendation.action)
  const score = rec?.risk_score ?? c.recommendation.score
  const horizon = report?.horizon_label ?? config.horizon
  const spot = report?.market_context.spot_price?.value ?? c.spot
  const unit = report?.market_context.spot_price?.unit ?? c.unit
  const rationale = rec?.decision_rationale ?? rec?.summary ?? splitSummary(c.recommendation.summary)
  const days = daysUntil(config.countdownEvent.date)
  const accent = actionArc[action]
  const shiftAccent = actionArc[config.countdownEvent.shiftTo]
  const verb = ACTION_LABELS[action].toLowerCase()
  const rationaleRefs = report
    ? report.drivers.slice(0, 3).flatMap((driver) => driver.evidence_ids)
    : selectedDrivers(c, config).slice(0, 3).map((driver) => driver.sourceId ?? driver.label)

  return (
    <Chapter
      index="01"
      eyebrow="The call"
      title={
        <>
          Damm should <span style={{ color: accent }}>{verb}</span> {c.name.toLowerCase()}.
        </>
      }
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-10">
          <p className="max-w-2xl text-xl leading-8 text-foreground/85">{rationale}</p>
          <div className="flex flex-wrap items-start gap-x-12 gap-y-8 border-t border-border/60 pt-9">
            <Figure label="Horizon" value={horizon} />
            <Figure label="Spot" value={fmtNumber(spot)} sub={unit} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 gap-y-3">
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              <span className="font-mono text-foreground">{days} days</span> to {config.countdownEvent.label} ·{" "}
              {fmtDate(config.countdownEvent.date)}. If {config.countdownEvent.outcome}, the call may shift to{" "}
              <span className="font-medium uppercase" style={{ color: shiftAccent }}>
                {config.countdownEvent.shiftTo}
              </span>
              .
            </p>
            <ExplainButton
              onExplain={onExplain}
              label="Why this call"
              payload={{
                title: "Why this call",
                body: rationale,
                citations: evidenceSourceLabels(c, report, rationaleRefs),
                evidenceRefs: demoEvidenceReferences(c, report, rationaleRefs),
              }}
            />
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <ScoreGauge score={score} size={300} colorVar={accent} label="Risk / Opportunity" />
        </div>
      </div>
    </Chapter>
  )
}

function Forecast({
  c,
  config,
  onExplain,
}: {
  c: Commodity
  config: ReportConfig
  onExplain: (payload: ExplainPayload) => void
}) {
  const report = agentReport(config)
  const f = report?.forecast
  const horizon = report?.horizon_label ?? config.horizon
  const change = f?.expected_change_pct ?? c.change30d
  const direction = f?.direction ?? (change > 0.5 ? "upward" : change < -0.5 ? "downward" : "flat")
  const low = f?.range_low_pct ?? Math.min(change - 4, 0)
  const high = f?.range_high_pct ?? Math.max(change + 4, 0)
  const interpretation =
    f?.interpretation ??
    `Over the ${horizon} horizon, ${c.name} prices look ${direction === "flat" ? "range-bound" : direction}, tracking the balance of the active drivers.`
  const up = direction === "upward"
  const flat = direction === "flat"
  const color = flat ? reportPressureColor("neutral") : reportPressureColor(up ? "up" : "down")
  const DirIcon = up ? ArrowUpRight : flat ? ArrowRight : ArrowDownRight
  const span = Math.max(high - low, 0.1)
  const place = (n: number) => Math.max(0, Math.min(100, ((n - low) / span) * 100))
  const forecastRefs = report
    ? report.drivers.slice(0, 3).flatMap((driver) => driver.evidence_ids)
    : selectedDrivers(c, config).slice(0, 2).map((driver) => driver.sourceId ?? driver.label)

  return (
    <Chapter index="02" eyebrow="Forecast" title="Where the price goes from here." lede={interpretation}>
      <div className="grid gap-12 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex items-center gap-5">
          <DirIcon className="size-12 shrink-0" style={{ color }} strokeWidth={1.5} />
          <div>
            <p className="display-serif text-7xl leading-none tabular-nums sm:text-8xl" style={{ color }}>
              {fmtPct(change)}
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Expected change · {horizon}
            </p>
          </div>
        </div>
        <div className="lg:border-l lg:border-border/60 lg:pl-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Expected range</p>
          <div className="relative mt-8 h-10 max-w-xl">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
              style={{ left: `${place(low)}%`, width: `${place(high) - place(low)}%`, background: color, opacity: 0.4 }}
            />
            <div
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
              style={{ left: `${place(change)}%`, background: color }}
            />
            <span className="absolute -bottom-1 left-0 font-mono text-xs tabular-nums text-muted-foreground">{fmtPct(low)}</span>
            <span className="absolute -bottom-1 right-0 font-mono text-xs tabular-nums text-muted-foreground">{fmtPct(high)}</span>
          </div>
          <div className="mt-10">
            <ExplainButton
              onExplain={onExplain}
              label="How we forecast"
              payload={{
                title: "Forecast basis",
                body: interpretation,
                citations: evidenceSourceLabels(c, report, forecastRefs),
                evidenceRefs: demoEvidenceReferences(c, report, forecastRefs),
              }}
            />
          </div>
        </div>
      </div>
    </Chapter>
  )
}

// Deterministic pseudo-random in [-1, 1] so projected paths wiggle realistically without flicker.
function seededNoise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
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
  const amp = last.value * 0.011
  for (let step = 0; step <= 28; step += 1) {
    const date = new Date(start)
    date.setUTCDate(date.getUTCDate() + step)
    const t = step / 28
    // Noise grows from 0 at "today" so the branches peel off the history smoothly.
    const jitter = (k: number) => seededNoise(step * 3.1 + k) * amp * t
    data.push({
      date: date.toISOString().slice(0, 10),
      history: step === 0 ? last.value : null,
      base: Math.round((last.value * (1 + t * 0.025) + jitter(1)) * 100) / 100,
      upside: Math.round((last.value * (1 + t * (0.075 + Math.max(0, bias))) + jitter(2)) * 100) / 100,
      downside: Math.round((last.value * (1 - t * (0.055 + Math.max(0, -bias))) + jitter(3)) * 100) / 100,
    })
  }
  return data
}

function buildAgentPriceData(c: Commodity, paths: AgentPricePath[]) {
  const history = c.series.slice(-80).map((point) => ({
    date: point.date,
    history: point.value,
    base: null as number | null,
    upside: null as number | null,
    downside: null as number | null,
  }))
  const byDate = new Map<string, { date: string; history: number | null; base: number | null; upside: number | null; downside: number | null }>()
  history.forEach((point) => byDate.set(point.date, point))

  paths.forEach((path) => {
    const key = path.graph_line_key === "upside" || path.graph_line_key === "downside" ? path.graph_line_key : "base"
    const pts = [...path.graph_points].sort((a, b) => a.date.localeCompare(b.date))
    // Densify the sparse backend points to daily with noise so the projection looks realistic;
    // the original anchor points are kept exact.
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i]
      const b = pts[i + 1]
      const aDate = new Date(`${a.date}T12:00:00Z`)
      const bDate = new Date(`${b.date}T12:00:00Z`)
      const days = Math.max(1, Math.round((bDate.getTime() - aDate.getTime()) / 86_400_000))
      const amp = Math.abs(b.value) * 0.009
      for (let d = 0; d <= days; d += 1) {
        const t = d / days
        const date = new Date(aDate)
        date.setUTCDate(date.getUTCDate() + d)
        const iso = date.toISOString().slice(0, 10)
        const lerp = a.value + (b.value - a.value) * t
        const noise = d === 0 || d === days ? 0 : seededNoise(i * 137 + d * 5.7) * amp
        const row = byDate.get(iso) ?? { date: iso, history: null, base: null, upside: null, downside: null }
        row[key] = Math.round((lerp + noise) * 100) / 100
        byDate.set(iso, row)
      }
    }
  })

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
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
  const report = agentReport(config)
  const agentPaths = report?.price_paths ?? []
  const fallbackScenarios = config.whatIfScenarios
  const [activeId, setActiveId] = useState(agentPaths[0]?.id ?? fallbackScenarios[0]?.id ?? "base")
  const activeAgentPath = agentPaths.find((path) => path.id === activeId) ?? agentPaths[0]
  const activeScenario = fallbackScenarios.find((scenario) => scenario.id === activeId) ?? fallbackScenarios[0]
  const data = agentPaths.length > 0 ? buildAgentPriceData(c, agentPaths) : buildForkedPriceData(c, activeScenario)
  const today = c.series.at(-1)?.date
  const directionColor = c.change30d >= 0 ? reportPressureColor("up") : reportPressureColor("down")
  const activeKey = activeAgentPath?.graph_line_key ?? activeId
  const scenarioItems = agentPaths.length > 0 ? agentPaths : fallbackScenarios

  const lineColorFor = (key: string) =>
    key === "upside" ? reportPressureColor("up") : key === "downside" ? reportPressureColor("down") : "var(--cala)"

  return (
    <Chapter
      index="03"
      eyebrow="Price paths"
      title="How the price could play out."
      lede="Three forward paths from today's spot, branched on the assumptions that move this market."
    >
      <div className="h-[clamp(170px,24vh,340px)]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={directionColor} stopOpacity={0.28} />
                <stop offset="55%" stopColor={directionColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={directionColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#7d7d7a", fontSize: 11 }} minTickGap={48} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#7d7d7a", fontSize: 11 }}
              width={56}
              axisLine={false}
              tickLine={false}
              domain={[(min: number) => Math.floor(min * 0.97), (max: number) => Math.ceil(max * 1.03)]}
            />
            <Tooltip contentStyle={{ background: "#141416", border: "1px solid #2a2a2d", borderRadius: 6, fontSize: 12 }} />
            {today ? <ReferenceLine x={today} stroke="#5a5a5d" strokeDasharray="3 3" /> : null}
            <Area type="monotone" dataKey="history" stroke="none" fill="url(#priceFill)" connectNulls isAnimationActive />
            <Line type="monotone" dataKey="history" dot={false} stroke={directionColor} strokeWidth={2.5} connectNulls />
            <Line type="monotone" dataKey="base" dot={false} stroke="var(--cala)" strokeWidth={activeKey === "base" ? 3.5 : 1.5} strokeOpacity={activeKey === "base" ? 1 : 0.3} connectNulls isAnimationActive />
            <Line type="monotone" dataKey="upside" dot={false} stroke={reportPressureColor("up")} strokeWidth={activeKey === "upside" ? 3.5 : 1.5} strokeOpacity={activeKey === "upside" ? 1 : 0.3} connectNulls isAnimationActive />
            <Line type="monotone" dataKey="downside" dot={false} stroke={reportPressureColor("down")} strokeWidth={activeKey === "downside" ? 3.5 : 1.5} strokeOpacity={activeKey === "downside" ? 1 : 0.3} connectNulls isAnimationActive />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60">
        Solid line · price to date. Dashed · today. Select a path below.
      </p>

      <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-3">
        {scenarioItems.map((scenario) => {
          const isAgent = "graph_points" in scenario
          const driverIds = isAgent ? scenario.driver_ids : scenario.driverIds
          const evidenceIds = isAgent ? scenario.evidence_ids : scenario.evidenceIds
          const explainRefs = isAgent && scenario.explainability?.click_evidence_ids.length
            ? scenario.explainability.click_evidence_ids
            : evidenceIds
          const supporting = isAgent ? agentEvidenceFor(report, evidenceIds) : evidenceFor(c, evidenceIds)
          const lineKey = isAgent ? scenario.graph_line_key : scenario.id
          const lineColor = lineColorFor(lineKey)
          const active = activeId === scenario.id
          const bigValue = isAgent ? fmtPct(scenario.expected_change_pct) : String(scenarioScore(c, scenario))
          const bigCaption = isAgent ? "expected change" : "result score"
          const summaryText = isAgent
            ? scenario.summary
            : driverIds.map((id) => c.drivers.find((driver) => driver.id === id)?.label).filter(Boolean).join(", ")
          return (
            <div
              key={scenario.id}
              className={cn("relative flex flex-col gap-2.5 pt-6 transition", active ? "opacity-100" : "opacity-50 hover:opacity-80")}
            >
              <span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: active ? lineColor : "var(--border)" }} />
              <button type="button" onClick={() => setActiveId(scenario.id)} className="flex flex-col items-start gap-3 text-left">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: lineColor }}>
                  <span className="size-2 rounded-full" style={{ background: lineColor }} />
                  {scenario.label}
                </span>
                <span className="display-serif text-3xl leading-none tabular-nums">{bigValue}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{bigCaption}</span>
                <span className="mt-1 text-sm leading-6 text-muted-foreground">{summaryText}</span>
              </button>
              <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                {supporting.some((item) => item.url) ? (
                  <a href="https://cala.ai" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-[0.16em] text-cala/80 transition hover:text-foreground">
                    Sources · Cala.ai
                  </a>
                ) : (
                  <SourceLine sources={supporting.map((item) => item.source)} />
                )}
                <ExplainButton
                  onExplain={onExplain}
                  payload={{
                    title: scenario.label,
                    body: isAgent
                      ? scenario.explainability?.plain_language ?? scenario.summary
                      : `This branch reweights the call around ${driverIds.map((id) => c.drivers.find((driver) => driver.id === id)?.label).filter(Boolean).join(" and ")}.`,
                    citations: supporting.map((item) => item.source),
                    evidenceRefs: demoEvidenceReferences(c, report, explainRefs),
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Chapter>
  )
}

type DriverRow = {
  id: string
  label: string
  ratio: number
  pct: number
  meta: string
  explanation: string
  refs: EvidenceReference[]
}

function DriversChapter({ c, config }: { c: Commodity; config: ReportConfig }) {
  const report = agentReport(config)
  let columns: Array<{ dir: "up" | "down"; items: DriverRow[] }>

  if (report) {
    const max = Math.max(...report.drivers.map((driver) => Math.abs(driver.impact_score)), 0.01)
    columns = (["up", "down"] as const).map((dir) => ({
      dir,
      items: report.drivers
        .filter((driver) => agentDriverDirection(driver) === dir)
        .map((driver) => ({
          id: driver.id,
          label: driver.label,
          ratio: Math.abs(driver.impact_score) / max,
          pct: Math.round(Math.abs(driver.impact_score) * 100),
          meta: `${Math.round(driver.confidence * 100)}% confidence · ${driver.impact} impact`,
          explanation: driver.explanation,
          refs: evidenceReferences(c, report, driver.evidence_ids),
        })),
    }))
  } else {
    const drivers = selectedDrivers(c, config)
    const max = Math.max(...drivers.map((driver) => driver.weight), 0.01)
    columns = (["up", "down"] as const).map((dir) => ({
      dir,
      items: drivers
        .filter((driver) => driver.direction === dir)
        .map((driver) => ({
          id: driver.id,
          label: driver.label,
          ratio: driver.weight / max,
          pct: Math.round(driver.weight * 100),
          meta: driver.category,
          explanation: driver.rationale,
          refs: evidenceReferences(c, report, driver.sourceId ? [driver.sourceId] : []),
        })),
    }))
  }

  return (
    <Chapter
      index="04"
      eyebrow="Drivers"
      title="The forces moving the price."
      lede="What pushes this market up, and what pulls it back — ranked by weight on the call."
    >
      <div className="grid gap-x-12 gap-y-14 lg:grid-cols-2 lg:divide-x lg:divide-border/60">
        {columns.map((col) => (
          <div key={col.dir} className={cn(col.dir === "down" ? "lg:pl-12" : "lg:pr-12")}>
            <div className="flex items-center gap-2.5">
              {col.dir === "up" ? (
                <TrendingUp className={cn("size-5", reportPressureClass("up"))} />
              ) : (
                <TrendingDown className={cn("size-5", reportPressureClass("down"))} />
              )}
              <h3 className={cn("font-mono text-xs uppercase tracking-[0.24em]", reportPressureClass(col.dir))}>
                {col.dir === "up" ? "Upward pressure" : "Downward pressure"}
              </h3>
            </div>
            <ul className="mt-8 space-y-8">
              {col.items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="display-serif text-2xl leading-snug">{item.label}</span>
                    <span
                      className="shrink-0 display-serif text-xl tabular-nums"
                      style={{ color: reportPressureColor(col.dir) }}
                    >
                      {item.pct}%
                    </span>
                  </div>
                  <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-border/50">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.ratio * 100}%`, background: reportPressureColor(col.dir) }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.explanation}</p>
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60">{item.meta}</p>
                  <SourceDetails refs={item.refs} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Chapter>
  )
}

function HorizonComparison({ c, config }: { c: Commodity; config: ReportConfig }) {
  const selected = selectedDrivers(c, config)
  const top = selected[0] ?? c.drivers[0]
  const oneMonthAction = (c.change30d < -1 ? "wait" : c.recommendation.action) as Action
  const sixMonthAction = c.recommendation.action
  const disagree = oneMonthAction !== sixMonthAction
  const columns = [
    { label: "1M", change: c.change30d, action: oneMonthAction, driver: top },
    { label: "6M", change: c.change30d * 1.6, action: sixMonthAction, driver: selected[1] ?? top },
  ]

  return (
    <Chapter
      index="05"
      eyebrow="Horizon"
      title="Tactical now, strategic later."
      lede="The same market read across two clocks — near-term ordering versus the six-month hedge."
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:divide-x lg:divide-border/60">
        {columns.map((col, index) => {
          const accent = actionArc[col.action]
          return (
            <div key={col.label} className={cn(index === 1 ? "lg:pl-12" : "lg:pr-12")}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="display-serif text-6xl leading-none">{col.label}</p>
                <p className="display-serif text-3xl uppercase" style={{ color: accent }}>
                  {ACTION_LABELS[col.action]}
                </p>
              </div>
              <dl className="mt-10 space-y-6">
                <div className="flex items-baseline justify-between gap-6 border-b border-border/50 pb-3">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Trend</dt>
                  <dd className={cn("display-serif text-3xl tabular-nums", col.change >= 0 ? reportPressureClass("up") : reportPressureClass("down"))}>
                    {fmtPct(col.change)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-6">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Top driver</dt>
                  <dd className="max-w-[60%] text-right text-sm leading-6 text-foreground/85">{col.driver?.label}</dd>
                </div>
              </dl>
            </div>
          )
        })}
      </div>
      {disagree ? (
        <p className="mt-12 border-l-2 border-hedge pl-4 text-sm leading-6 text-hedge">
          Short-term and six-month calls disagree — use the one-month view for tactical ordering and the six-month view for hedge exposure.
        </p>
      ) : null}
    </Chapter>
  )
}

const MAP_CENTER: [number, number] = [16, 45]

function MapChapter({ c, config }: { c: Commodity; config: ReportConfig }) {
  const report = agentReport(config)
  const points = useMemo<MapPoint[]>(() => {
    const agentPlaces = report?.affected_places
    if (agentPlaces && agentPlaces.length > 0) {
      return agentPlaces.map((place) => ({
        id: place.name,
        label: place.name,
        description: place.description,
        coordinates: [place.lng, place.lat] as [number, number],
        tone: place.impact === "positive" ? "positive" : place.impact === "negative" ? "warning" : "muted",
      }))
    }
    return REPORT_MAP_POINTS[c.id]
  }, [report, c.id])
  // Frame the fly-in on the European cluster, excluding far-flung macro points (e.g. China).
  const framePoints = useMemo(
    () => points.filter((point) => point.coordinates[0] >= -25 && point.coordinates[0] <= 45),
    [points],
  )
  const sectionRef = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)

  useEffect(() => {
    let frame = 0
    const check = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = sectionRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight
        const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
        setInView(visible > vh * 0.4)
      })
    }
    check()
    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
  }, [])

  return (
    <section ref={sectionRef} className="report-chapter relative flex min-h-screen snap-start items-center overflow-hidden">
      <div className="cales-map-fx absolute inset-0">
        <GeoMap center={MAP_CENTER} zoom={2.7} points={points} framePoints={framePoints} heatmap active={inView} interactive={false} selectedPoint={selectedPoint} className="size-full" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/60 via-background/20 to-transparent dark:from-background/95 dark:via-background/45" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background/40 to-transparent dark:from-background/80" />

      <div className="relative z-10 flex w-full px-5 py-16 sm:px-8 lg:px-20">
        <div
          className={cn(
            "w-full max-w-md rounded-xl border border-border/60 bg-background/55 p-7 shadow-2xl backdrop-blur-2xl transition-all duration-[900ms] ease-out sm:p-9",
            inView ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-sm",
          )}
        >
          <Eyebrow index="06" label="Map" />
          <h2 className="display-serif mt-6 text-4xl leading-[1.04] sm:text-5xl">Where the exposure sits.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            The regions and logistics points this brief is anchored to.
          </p>
          <ol className="mt-7 divide-y divide-border/50">
            {points.map((point, index) => (
              <li key={point.id}>
                <button
                  type="button"
                  onClick={() => setSelectedPoint((prev) => (prev === point.id ? null : point.id))}
                  className={cn(
                    "flex w-full gap-4 py-3.5 text-left transition-all duration-300 hover:opacity-100 first:pt-0 last:pb-0",
                    selectedPoint && selectedPoint !== point.id ? "opacity-35" : "opacity-100",
                    selectedPoint === point.id && "translate-x-1",
                  )}
                >
                  <span className="display-serif text-lg tabular-nums text-muted-foreground/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="display-serif text-lg leading-snug">{point.label}</p>
                    {point.description ? (
                      <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{point.description}</p>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function newsImpact(c: Commodity, item: Evidence) {
  const driver = c.drivers.find((candidate) => candidate.sourceId === item.id)
  const sign = driver?.direction === "up" ? 1 : driver?.direction === "down" ? -1 : 0
  const score = driver ? Math.round(sign * driver.weight * 30) : 0
  return { score, driver }
}

function ImpactNumber({ score }: { score: number }) {
  return (
    <div className="flex items-start gap-3 md:flex-col md:items-end md:text-right">
      <span
        className="display-serif text-5xl tabular-nums"
        style={{ color: score > 0 ? reportPressureColor("up") : score < 0 ? reportPressureColor("down") : undefined }}
      >
        {score > 0 ? "+" : ""}
        {score}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Impact</span>
    </div>
  )
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
  const report = agentReport(config)
  if (report) {
    const driverByEvidence = new Map<string, AgentReportDriver>()
    report.drivers.forEach((driver) => {
      driver.evidence_ids.forEach((id) => driverByEvidence.set(id, driver))
    })
    const items = report.evidence
      .filter((item) => config.news.includes(item.id) || !c.evidence.some((candidate) => candidate.id === item.id))
      .sort((a, b) => Math.abs(driverByEvidence.get(b.id)?.impact_score ?? 0) - Math.abs(driverByEvidence.get(a.id)?.impact_score ?? 0))

    return (
      <Chapter
        index="07"
        eyebrow="Evidence"
        title="The signals behind the call."
        lede="Ranked by estimated impact on the recommendation."
      >
        <div className="divide-y divide-border/60 border-t border-border/60">
          {items.map((item) => {
            const driver = driverByEvidence.get(item.id)
            const tone = agentTone(driver?.direction)
            const score = Math.round((driver?.impact_score ?? 0) * 100)
            return (
              <article key={item.id} className="grid gap-5 py-7 md:grid-cols-[1fr_auto] md:gap-10">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span className={cn("text-foreground", item.source.toLowerCase().includes("cala") && "text-cala")}>{item.source}</span> · {fmtOptionalDate(item.date)} ·{" "}
                    {reliabilityLabel[item.reliability]} reliability · <span className={tone.className}>{tone.label}</span>
                  </p>
                  <h3 className="display-serif mt-3 text-2xl leading-snug sm:text-3xl">{item.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{item.signal_extracted}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-cala/80 transition hover:text-foreground"
                      >
                        Open source <ExternalLink className="size-3" />
                      </a>
                    ) : null}
                    <ExplainButton
                      onExplain={onExplain}
                      label="Why it matters"
                      payload={{
                        title: item.title,
                        body: driver ? `${item.signal_extracted} Connected driver: ${driver.label}. ${driver.explanation}` : item.signal_extracted,
                        citations: [item.source],
                        evidenceRefs: demoEvidenceReferences(c, report, [item.id, ...(driver?.evidence_ids ?? [])]),
                      }}
                    />
                  </div>
                </div>
                <ImpactNumber score={score} />
              </article>
            )
          })}
        </div>
      </Chapter>
    )
  }

  const selected = new Set(config.news ?? c.evidence.map((item) => item.id))
  const items = c.evidence
    .filter((item) => selected.has(item.id))
    .sort((a, b) => Math.abs(newsImpact(c, b).score) - Math.abs(newsImpact(c, a).score))
  return (
    <Chapter
      index="07"
      eyebrow="Evidence"
      title="The signals behind the call."
      lede="Ranked by estimated impact on the recommendation."
    >
      <div className="divide-y divide-border/60 border-t border-border/60">
        {items.map((item) => {
          const impact = newsImpact(c, item)
          const tone = impact.driver?.direction === "up" ? "Bullish" : impact.driver?.direction === "down" ? "Bearish" : "Neutral"
          const toneColor =
            impact.driver?.direction === "down" ? reportPressureClass("down") : impact.driver?.direction === "up" ? reportPressureClass("up") : "text-muted-foreground"
          return (
            <article key={item.id} className="grid gap-5 py-7 md:grid-cols-[1fr_auto] md:gap-10">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <span className={cn("text-foreground", item.source.toLowerCase().includes("cala") && "text-cala")}>{item.source}</span> · {fmtDate(item.date)} ·{" "}
                  {reliabilityLabel[item.reliability]} reliability · <span className={toneColor}>{tone}</span>
                </p>
                <h3 className="display-serif mt-3 text-2xl leading-snug sm:text-3xl">{item.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
                <div className="mt-4">
                  <ExplainButton
                    onExplain={onExplain}
                    label="Why it matters"
                    payload={{
                      title: item.title,
                      body: `This row is ranked by the builder impact slider and its linked driver. ${
                        impact.driver
                          ? `${impact.driver.label} is the connected driver, and its rationale is: ${impact.driver.rationale}`
                          : "No explicit driver link is available, so the item is treated as contextual evidence."
                      }`,
                      citations: [item.source],
                      evidenceRefs: demoEvidenceReferences(c, report, [item.id, impact.driver?.sourceId ?? ""].filter(Boolean)),
                    }}
                  />
                </div>
              </div>
              <ImpactNumber score={impact.score} />
            </article>
          )
        })}
      </div>
    </Chapter>
  )
}

type MonitorEntry = { item: string; why: string; refs: EvidenceReference[] }

function fallbackMonitor(c: Commodity, config: ReportConfig): MonitorEntry[] {
  const entries: MonitorEntry[] = selectedDrivers(c, config)
    .slice(0, 3)
    .map((driver) => ({ item: driver.label, why: driver.rationale, refs: evidenceReferences(c, null, driver.sourceId ? [driver.sourceId] : []) }))
  entries.unshift({
    item: config.countdownEvent.label,
    why: `Due ${fmtDate(config.countdownEvent.date)}. If ${config.countdownEvent.outcome}, the call may shift to ${config.countdownEvent.shiftTo.toUpperCase()}.`,
    refs: [],
  })
  return entries
}

function WhatToMonitor({ c, config }: { c: Commodity; config: ReportConfig }) {
  const report = agentReport(config)
  const entries: MonitorEntry[] = report?.what_to_monitor?.length
    ? report.what_to_monitor.map((m) => ({ item: m.item, why: m.why, refs: evidenceReferences(c, report, m.evidence_source_ids) }))
    : fallbackMonitor(c, config)

  return (
    <Chapter
      index="08"
      eyebrow="What to monitor"
      title="What could change the call."
      lede="The handful of signals worth watching between now and the next review."
    >
      <ol className="divide-y divide-border/60 border-t border-border/60">
        {entries.map((entry, index) => (
          <li key={index} className="grid gap-4 py-7 md:grid-cols-[auto_1fr] md:gap-8">
            <span className="display-serif text-4xl tabular-nums text-muted-foreground/40">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="display-serif text-2xl leading-snug">{entry.item}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {entry.why}
              </p>
              <SourceDetails refs={entry.refs} />
            </div>
          </li>
        ))}
      </ol>
    </Chapter>
  )
}

function FooterChapter({ c, config }: { c: Commodity; config: ReportConfig }) {
  const report = agentReport(config)
  const drivers = selectedDrivers(c, config)
  const evidence = report?.evidence ?? c.evidence.filter((item) => (config.news ?? []).includes(item.id))
  const sources = Array.from(new Set(evidence.map((item) => item.source).concat("Cala")))
  const executivePdf = config.agentResponse?.executive_pdf
  const factors = report?.drivers.map((driver) => driver.label) ?? drivers.map((driver) => driver.label)
  const request = config.agentRequest
  const querySummary = request
    ? `${request.material} procurement analysis · ${request.horizon_label} / ${request.horizon_days} days · ${request.priority_profile.replace(/_/g, " ")} profile`
    : `${c.name} procurement analysis · ${config.horizon} horizon`
  const contextUsed = request
    ? [
        request.context.current_date && "current date",
        request.context.spot_price && "spot price",
        request.context.warehouse_fill_pct != null && `warehouse ${request.context.warehouse_fill_pct}%`,
        request.context.related_news && "related news",
        request.context.source_reliability && "source reliability",
        request.include_market_drivers && "market drivers",
      ].filter(Boolean)
    : Object.entries(config.contextFactors)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`))
  const meta = [
    { label: "Generated by", value: config.generatedBy },
    { label: "Generated at", value: fmtDate(report?.generated_at ?? config.generatedAt) },
    { label: "Horizon", value: report?.horizon_label ?? config.horizon },
    { label: "Report id", value: config.reportId },
    { label: "Version hash", value: config.versionHash },
  ]

  return (
    <Chapter index="09" eyebrow="Audit" title="Inputs, sources, and trail." lede="Everything this brief was built from.">
      <div className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">News consulted</p>
        <div className="mt-4 divide-y divide-border/60 border-t border-border/60">
          {evidence.map((item) => (
            <div key={item.id} className="py-3">
              <p className="text-sm leading-6 text-foreground/85">{item.title}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                <span className={cn(item.source.toLowerCase().includes("cala") && "text-cala")}>{item.source}</span>
                {item.date ? ` · ${fmtOptionalDate(item.date)}` : ""} · {reliabilityLabel[item.reliability]} reliability
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-12 lg:grid-cols-2">
        <dl className="divide-y divide-border/60 border-t border-border/60">
          {meta.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-6 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-mono text-sm tabular-nums text-foreground/90">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Factors taken into account</p>
            <p className="mt-4 text-base leading-7 text-foreground/85">{factors.join("  ·  ")}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Sources consulted</p>
            <SourceLine sources={sources} className="mt-4" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Agent query context</p>
            <p className="mt-4 text-base leading-7 text-foreground/85">{querySummary}</p>
            {contextUsed.length > 0 ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Inputs used: {contextUsed.join(", ")}.
              </p>
            ) : null}
          </div>
          {executivePdf?.status === "ready" ? (
            <a
              href={resolveBackendUrl(executivePdf.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-b border-cala/40 pb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-cala transition hover:border-foreground/60 hover:text-foreground"
            >
              <ExternalLink className="size-3.5" /> Open executive PDF
            </a>
          ) : null}
        </div>
      </div>
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
  const executivePdfUrl = reportPdfDownloadUrl(config)
  const executivePdfFileName = config.agentResponse?.executive_pdf?.file_name ?? `${config.commodityId}-executive-report.pdf`
  const { resolvedTheme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => setThemeMounted(true), [])
  const isDark = themeMounted && resolvedTheme === "dark"

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
          <motion.button
            type="button"
            onClick={goBack}
            aria-label="Back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            whileHover={{ scale: 1.12, opacity: 0.7 }}
            whileTap={{ scale: 0.9 }}
            className="pointer-events-auto inline-flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="size-8" strokeWidth={2.5} />
          </motion.button>
        ) : (
          <span />
        )}
        <div className="pointer-events-auto flex items-center gap-5">
          <motion.button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            whileHover={{ scale: 1.12, opacity: 0.7 }}
            whileTap={{ scale: 0.9 }}
            className="inline-flex items-center justify-center text-foreground"
          >
            {isDark ? (
              <Sun className="size-7" strokeWidth={2.25} />
            ) : (
              <Moon className="size-7" strokeWidth={2.25} />
            )}
          </motion.button>
          <motion.a
            href={executivePdfUrl}
            download={executivePdfFileName}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download executive PDF"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            whileHover={{ scale: 1.12, opacity: 0.7 }}
            whileTap={{ scale: 0.9 }}
            className="inline-flex items-center justify-center text-foreground"
          >
            <Download className="size-7" strokeWidth={2.25} />
          </motion.a>
          <motion.button
            type="button"
            onClick={() => setQrOpen(true)}
            aria-label="Share"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            whileHover={{ scale: 1.12, opacity: 0.7 }}
            whileTap={{ scale: 0.9 }}
            className="inline-flex items-center justify-center text-foreground"
          >
            <QrCode className="size-7" strokeWidth={2.25} />
          </motion.button>
        </div>
      </div>

      <Cover c={c} config={config} publicMode={publicMode} />
      <TheCall c={c} config={config} onExplain={setExplain} />
      <Forecast c={c} config={config} onExplain={setExplain} />
      <PriceWhatIf c={c} config={config} onExplain={setExplain} />
      <DriversChapter c={c} config={config} />
      <HorizonComparison c={c} config={config} />
      <MapChapter c={c} config={config} />
      <NewsChapter c={c} config={config} onExplain={setExplain} />
      <WhatToMonitor c={c} config={config} />
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
  const shouldFetchRemote = Boolean(reportId && !storedConfig)
  const {
    data: remoteResponse,
    isLoading: remoteLoading,
  } = useQuery({
    queryKey: ["agent-report", reportId],
    queryFn: () => api.getReport(reportId),
    enabled: shouldFetchRemote,
    retry: false,
  })
  const commodityId = storedConfig?.commodityId ?? remoteResponse?.material ?? reportCommodityId(reportId) ?? id
  const { data, isLoading, isError } = useCommodity(commodityId as Commodity["id"])

  const config = useMemo(() => {
    if (!data || !reportId) return null
    if (storedConfig) return storedConfig
    if (remoteResponse?.status === "completed") return reportConfigFromAgentResponse(data, remoteResponse)
    return storedConfig ?? defaultReportConfig(data, reportId)
  }, [data, remoteResponse, reportId, storedConfig])

  if (isLoading || (shouldFetchRemote && remoteLoading && !storedConfig)) {
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
