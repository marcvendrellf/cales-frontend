import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Check,
  Loader2,
  Minus,
  MousePointer2,
  Newspaper,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { Card } from "@/components/ui/card"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { ReportGeneratingSkeleton } from "@/components/common/PageSkeletons"
import { fmtDate } from "@/lib/format"
import { buildAgentAnalyzeRequest, buildReportConfig, saveReportConfig } from "@/lib/report-config"
import { SCREEN_AGENT_ASK_EVENT, type ScreenAgentAskDetail } from "@/lib/screen-agent"
import { cn } from "@/lib/utils"
import type { Commodity } from "@/types"
import type { ReportContextKey as ContextKey } from "@/lib/report-config"
import type { UIAgentAction, UIAgentControl, UIScreenPayload } from "@/lib/ui-agent"

type ContextFactor = { key: ContextKey; label: string; hint: string; available: boolean }

const DEFAULT_HORIZON = "3M" as const

function ToggleRow({
  agentId,
  checked,
  onChange,
  disabled,
  children,
}: {
  agentId?: string
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
      data-agent-id={agentId}
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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function contextTargetId(key: ContextKey) {
  return `context_${key}`
}

function newsTargetId(id: string) {
  return `news_${id}`
}

export function ReportBuilder({ c }: { c: Commodity }) {
  const navigate = useNavigate()
  const contextFactors: ContextFactor[] = [
    { key: "currentDate", label: "Current date", hint: "Anchor the report to today's market window", available: true },
    { key: "spotPrice", label: "Current spot price", hint: `${c.spot} ${c.unit} and short-term movement`, available: true },
    { key: "warehouse", label: "Warehouse position", hint: c.warehouseFillPct != null ? `${c.warehouseFillPct}% current fill` : "Not available for this element", available: c.warehouseFillPct != null },
    { key: "recentNews", label: "Related news", hint: `${c.evidence.length} market signals and source notes`, available: c.evidence.length > 0 },
    { key: "sourceReliability", label: "Source reliability", hint: "Weight high-confidence sources more strongly", available: c.evidence.length > 0 },
  ]

  const [includedContext, setIncludedContext] = useState<Record<ContextKey, boolean>>(() => ({
    currentDate: true,
    spotPrice: true,
    warehouse: c.warehouseFillPct != null,
    recentNews: true,
    sourceReliability: true,
  }))
  const [useDrivers, setUseDrivers] = useState(true)
  const [news, setNews] = useState<Set<string>>(() => new Set(c.evidence.map((e) => e.id)))
  const [status, setStatus] = useState<"idle" | "generating">("idle")
  const [agentStatus, setAgentStatus] = useState<"idle" | "thinking" | "acting">("idle")
  const [agentCursor, setAgentCursor] = useState<{ x: number; y: number; label: string } | null>(null)

  const newsDirection = (evidenceId: string) =>
    c.drivers.find((d) => d.sourceId === evidenceId)?.direction

  const toggleNews = (id: string) =>
    setNews((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const toggleContext = (key: ContextKey) =>
    setIncludedContext((prev) => ({ ...prev, [key]: !prev[key] }))

  const canGenerate = status !== "generating"
  const canRunAgent = agentStatus === "idle" && status !== "generating"

  function visibleControls(): UIAgentControl[] {
    return [
      ...contextFactors.map((factor) => ({
        target_id: contextTargetId(factor.key),
        label: factor.label,
        type: "checkbox" as const,
        selected: includedContext[factor.key] && factor.available,
        disabled: !factor.available,
        metadata: { hint: factor.hint },
      })),
      {
        target_id: "market_drivers",
        label: "Market drivers",
        type: "checkbox" as const,
        selected: useDrivers,
        disabled: false,
        metadata: { count: c.drivers.length },
      },
      ...c.evidence.map((item) => {
        const dir = newsDirection(item.id)
        return {
          target_id: newsTargetId(item.id),
          label: item.title,
          type: "checkbox" as const,
          selected: news.has(item.id),
          disabled: false,
          metadata: {
            source: item.source,
            reliability: item.reliability,
            tone: dir === "up" ? "Bullish" : dir === "down" ? "Bearish" : "Neutral",
          },
        }
      }),
      {
        target_id: "generate_report",
        label: "Generate report",
        type: "button" as const,
        disabled: !canGenerate,
      },
    ]
  }

  function buildUiPayload(prompt: string): UIScreenPayload {
    return {
      prompt,
      page_id: "create_report",
      route: window.location.pathname,
      material: c.id,
      screen_state: {
        included_context: includedContext,
        include_market_drivers: useDrivers,
        selected_news_ids: Array.from(news),
        horizon: DEFAULT_HORIZON,
      },
      visible_controls: visibleControls(),
    }
  }

  async function applyAgentAction(action: UIAgentAction) {
    const nextValue = action.type === "toggle_on" ? true : action.type === "toggle_off" ? false : undefined
    if (action.type === "click" && action.target_id === "generate_report") {
      await generate()
      return
    }
    if (action.target_id.startsWith("context_")) {
      const key = action.target_id.replace("context_", "") as ContextKey
      const factor = contextFactors.find((item) => item.key === key)
      if (!factor?.available) return
      setIncludedContext((prev) => ({ ...prev, [key]: nextValue ?? !prev[key] }))
      return
    }
    if (action.target_id === "market_drivers") {
      setUseDrivers((current) => nextValue ?? !current)
      return
    }
    if (action.target_id.startsWith("news_")) {
      const id = action.target_id.replace("news_", "")
      setNews((prev) => {
        const next = new Set(prev)
        const shouldSelect = nextValue ?? !next.has(id)
        if (shouldSelect) next.add(id)
        else next.delete(id)
        return next
      })
    }
  }

  async function moveAgentCursor(targetId: string, label: string) {
    const el = document.querySelector<HTMLElement>(`[data-agent-id="${targetId}"]`)
    if (!el) return
    el.scrollIntoView({ block: "center", behavior: "smooth" })
    await wait(420)
    const rect = el.getBoundingClientRect()
    setAgentCursor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, label })
    await wait(520)
  }

  async function runUiAgent(prompt: string) {
    if (!canRunAgent) return "Cales is already working on this screen."
    setAgentStatus("thinking")
    setAgentCursor(null)
    try {
      const response = await api.runUiAgent(buildUiPayload(prompt))
      if (!response.actions.length) {
        setAgentStatus("idle")
        return response.explanation
      }
      setAgentStatus("acting")
      for (const action of response.actions) {
        await moveAgentCursor(action.target_id, action.reason)
        await applyAgentAction(action)
        await wait(260)
      }
      await wait(300)
      setAgentCursor(null)
      setAgentStatus("idle")
      return response.explanation
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      toast.error("UI agent failed", { description: message })
      setAgentCursor(null)
      setAgentStatus("idle")
      throw error
    }
  }

  useEffect(() => {
    const onAsk = (event: Event) => {
      const detail = (event as CustomEvent<ScreenAgentAskDetail>).detail
      if (!detail || detail.handled) return
      detail.handled = true
      detail.response = runUiAgent(detail.prompt).then((message) => ({ message }))
    }
    window.addEventListener(SCREEN_AGENT_ASK_EVENT, onAsk)
    return () => window.removeEventListener(SCREEN_AGENT_ASK_EVENT, onAsk)
  })

  async function generate() {
    if (!canGenerate) return
    setStatus("generating")

    try {
      const config = buildReportConfig({
        c,
        factors: useDrivers ? c.drivers.map((d) => d.id) : [],
        contextFactors: { ...includedContext },
        news: Array.from(news),
        horizon: DEFAULT_HORIZON,
      })
      const agentRequest = buildAgentAnalyzeRequest(c, config)
      const agentResponse = await api.analyzeReport(agentRequest)

      const finalConfig = {
        ...config,
        reportId: agentResponse.request_id || config.reportId,
        generatedAt: agentResponse.generated_at || config.generatedAt,
        agentRequest,
        agentResponse,
      }
      saveReportConfig(finalConfig)
      toast.success("Report generated", { description: `${c.name} analysis sent to the agent` })
      navigate(`/c/${c.id}/reports/${finalConfig.reportId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      toast.error("Agent request failed", { description: message })
      setStatus("idle")
    }
  }

  return (
    <div className="space-y-6">
      {agentCursor ? (
        <div
          className="pointer-events-none fixed left-0 top-0 z-[80] flex max-w-[280px] items-start gap-2 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${agentCursor.x}px, ${agentCursor.y}px)` }}
        >
          <MousePointer2 className="size-6 -translate-x-1 -translate-y-1 fill-cala text-cala drop-shadow" />
          <span className="rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-lg">
            {agentCursor.label}
          </span>
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-1 size-5 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-xl font-medium text-foreground">
              Which factors do you want to include?
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Pick the report context and whether to weigh the market drivers.
            </p>
          </div>
        </div>
        <Card className="p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {contextFactors.map((factor) => (
              <ToggleRow
                key={factor.key}
                agentId={contextTargetId(factor.key)}
                checked={includedContext[factor.key] && factor.available}
                onChange={() => toggleContext(factor.key)}
                disabled={!factor.available}
              >
                <span className="block text-sm">{factor.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{factor.hint}</span>
              </ToggleRow>
            ))}
            <ToggleRow agentId="market_drivers" checked={useDrivers} onChange={() => setUseDrivers((value) => !value)}>
              <span className="block text-sm">Market drivers</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Weigh {c.drivers.length} supply, demand &amp; cost drivers
              </span>
            </ToggleRow>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Newspaper className="mt-1 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <h2 className="text-xl font-medium text-foreground">Relevant news</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Select the news to include. Each item shows its bullish or bearish lean.
              </p>
            </div>
          </div>
          <span className="mt-1 shrink-0 font-mono text-xs text-muted-foreground">
            {news.size}/{c.evidence.length} selected
          </span>
        </div>
        <Card className="p-5">
          <div className="space-y-2">
            {c.evidence.map((item) => {
              const dir = newsDirection(item.id)
              const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus
              const text = dir === "up" ? "text-positive" : dir === "down" ? "text-negative" : "text-muted-foreground"
              const tone = dir === "up" ? "Bullish" : dir === "down" ? "Bearish" : "Neutral"
              return (
                <ToggleRow key={item.id} agentId={newsTargetId(item.id)} checked={news.has(item.id)} onChange={() => toggleNews(item.id)}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <Icon className={cn("size-4 shrink-0", text)} />
                      <span className="truncate">{item.title}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{tone}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.source} · {fmtDate(item.date)}
                  </span>
                </ToggleRow>
              )
            })}
          </div>
        </Card>
      </section>

      <div className="flex justify-center pt-2">
        <HoverBorderGradient
          as="button"
          type="button"
          data-agent-id="generate_report"
          onClick={generate}
          disabled={!canGenerate}
          containerClassName="rounded-full disabled:cursor-not-allowed disabled:opacity-60"
          className="flex items-center gap-2 bg-white px-5 py-2.5 text-sm font-medium text-black"
        >
          {status === "generating" ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Generate report
            </>
          )}
        </HoverBorderGradient>
      </div>

      <div>
        {status === "generating" && <ReportGeneratingSkeleton />}
      </div>
    </div>
  )
}
