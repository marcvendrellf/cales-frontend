import { COMMODITIES, COMMODITY_BY_ID, SIGNALS } from "@/data/mock"
import type { AgentAnalyzeRequest, AgentAnalyzeResponse } from "@/lib/report-config"
import type { UIAgentResponse, UIScreenPayload } from "@/lib/ui-agent"
import type { Commodity, CommodityId, MarketSignal } from "@/types"

// Flip to the real cales-backend by setting VITE_API_URL in .env.
// When unset, the app serves the in-repo mock dataset.
const API_URL = import.meta.env.VITE_API_URL as string | undefined
const AGENT_API_URL = (import.meta.env.VITE_AGENT_API_URL as string | undefined) ?? API_URL
const RAW_UI_AGENT_API_URL = import.meta.env.VITE_UI_AGENT_API_URL as string | undefined
const UI_AGENT_API_URL = RAW_UI_AGENT_API_URL
  ? endpointUrl(RAW_UI_AGENT_API_URL, "/agent/ui")
  : AGENT_API_URL
    ? endpointUrl(AGENT_API_URL, "/agent/ui")
    : undefined
const USE_MOCK = !API_URL
const USE_AGENT_MOCK = !AGENT_API_URL
const USE_UI_AGENT_MOCK = !UI_AGENT_API_URL

// Small artificial latency so loading states are real in the demo.
function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`
}

function endpointUrl(baseUrl: string, endpointPath: string) {
  return baseUrl.endsWith(endpointPath) ? baseUrl : joinUrl(baseUrl, endpointPath)
}

export function resolveBackendUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  const base = AGENT_API_URL ?? API_URL
  return base ? joinUrl(base, url) : url
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(joinUrl(API_URL ?? "", path))
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`)
  return res.json() as Promise<T>
}

async function getFromBase<T>(baseUrl: string, path: string): Promise<T> {
  const res = await fetch(joinUrl(baseUrl, path))
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`)
  return res.json() as Promise<T>
}

async function post<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(joinUrl(baseUrl, path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`)
  return res.json() as Promise<T>
}

async function postUrl<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`)
  return res.json() as Promise<T>
}

function mockUiAgent(payload: UIScreenPayload): UIAgentResponse {
  const prompt = payload.prompt.toLowerCase()
  const controls = payload.visible_controls.filter((control) => !control.disabled)
  const byId = new Map(controls.map((control) => [control.target_id, control]))
  const actions: UIAgentResponse["actions"] = []

  const sourceReliability = byId.get("context_sourceReliability")
  if (sourceReliability && sourceReliability.selected && (prompt.includes("unselect") || prompt.includes("demo"))) {
    actions.push({
      type: "toggle_off",
      target_id: "context_sourceReliability",
      reason: "Temporarily removing source reliability makes the demo show a visible unselect action.",
    })
  }

  const warehouse = byId.get("context_warehouse")
  if (warehouse && !warehouse.selected) {
    actions.push({
      type: "toggle_on",
      target_id: "context_warehouse",
      reason: "Warehouse position helps explain physical supply tightness.",
    })
  }

  const bearishNews = controls.find((control) => control.target_id.startsWith("news_") && control.selected && control.metadata?.tone === "Bearish")
  if (bearishNews) {
    actions.push({
      type: "toggle_off",
      target_id: bearishNews.target_id,
      reason: "This removes one bearish item so the selection reflects the stronger upside-risk story.",
    })
  }

  return {
    explanation: "This screen controls which inputs the aluminium report will use: market context, driver weighting, and the specific news items included as evidence.",
    actions: actions.slice(0, 3),
    requires_confirmation: actions.length > 0,
  }
}

export const api = {
  listCommodities(): Promise<Commodity[]> {
    if (USE_MOCK) return delay(COMMODITIES)
    return get<Commodity[]>("/commodities")
  },

  getCommodity(id: CommodityId): Promise<Commodity> {
    if (USE_MOCK) {
      const c = COMMODITY_BY_ID[id]
      if (!c) return Promise.reject(new Error(`Unknown commodity: ${id}`))
      return delay(c)
    }
    return get<Commodity>(`/commodities/${id}`)
  },

  listSignals(): Promise<MarketSignal[]> {
    if (USE_MOCK) return delay(SIGNALS)
    return get<MarketSignal[]>("/signals")
  },

  analyzeReport(payload: AgentAnalyzeRequest): Promise<AgentAnalyzeResponse> {
    if (USE_AGENT_MOCK) {
      return delay({
        request_id: `${payload.material}-${payload.requested_at.slice(0, 10)}-${payload.horizon_days}d`,
        status: "completed",
        material: payload.material,
        generated_at: payload.requested_at,
        report_json: {
          schema_version: "1.0",
          output_type: "website_report",
          analysis_type: payload.analysis_type,
          material: payload.material,
          generated_at: payload.requested_at,
          horizon_days: payload.horizon_days,
          horizon_label: payload.horizon_label,
          recommendation: {
            action: "HEDGE",
            recommended_horizon_days: payload.horizon_days,
            confidence: 0.72,
            risk_score: 78,
            opportunity_score: 42,
            summary: `Hedge ${payload.material} exposure over the next ${payload.horizon_days} days because upside risk is stronger than downside relief.`,
            decision_rationale: "Upside risk from energy costs, supply disruption, and stock drawdown is stronger than demand-relief signals.",
          },
          market_context: {
            current_date: payload.requested_at.slice(0, 10),
            spot_price: {
              value: 2685,
              unit: "USD/t",
              as_of: payload.requested_at.slice(0, 10),
              source_id: "mock_spot",
            },
            warehouse_fill_pct: payload.context.warehouse_fill_pct,
          },
          forecast: {
            direction: "upward",
            expected_change_pct: 4.8,
            range_low_pct: -2.5,
            range_high_pct: 9.6,
            interpretation: "Upside risk is larger than downside opportunity.",
          },
          price_paths: [
            {
              id: "base_case",
              label: "Base case",
              graph_line_key: "base",
              buyer_impact: "neutral",
              summary: "Current signals continue without a major new shock.",
              expected_change_pct: 4.8,
              driver_ids: ["drv_energy_cost_pressure", "drv_warehouse_drawdown"],
              evidence_ids: ["ev_energy_001", "ev_warehouse_001"],
              graph_points: [
                { date: payload.requested_at.slice(0, 10), value: 2685 },
                { date: "2026-06-22", value: 2728 },
                { date: "2026-07-22", value: 2784 },
                { date: "2026-08-21", value: 2814 },
              ],
              explainability: {
                click_title: "Why the base path rises",
                plain_language: "The base path rises moderately because supply-side cost pressure is stronger than demand-relief signals.",
                click_evidence_ids: ["ev_energy_001", "ev_warehouse_001"],
              },
            },
            {
              id: "worst_case",
              label: "Worst case",
              graph_line_key: "upside",
              buyer_impact: "negative",
              summary: "Energy costs rise further while stocks keep drawing down.",
              expected_change_pct: 9.6,
              driver_ids: ["drv_energy_cost_pressure", "drv_warehouse_drawdown"],
              evidence_ids: ["ev_energy_001", "ev_smelter_001", "ev_warehouse_001"],
              graph_points: [
                { date: payload.requested_at.slice(0, 10), value: 2685 },
                { date: "2026-06-22", value: 2792 },
                { date: "2026-07-22", value: 2881 },
                { date: "2026-08-21", value: 2943 },
              ],
              explainability: {
                click_title: "Why the worst-case line is higher",
                plain_language: "This is the bad-news path: power-cost pressure and lower stocks both point upward.",
                click_evidence_ids: ["ev_energy_001", "ev_smelter_001", "ev_warehouse_001"],
              },
            },
            {
              id: "relief_case",
              label: "Relief case",
              graph_line_key: "downside",
              buyer_impact: "positive",
              summary: "Chinese industrial demand weakens enough to offset supply pressure.",
              expected_change_pct: -2.5,
              driver_ids: ["drv_china_demand_softness"],
              evidence_ids: ["ev_china_001"],
              graph_points: [
                { date: payload.requested_at.slice(0, 10), value: 2685 },
                { date: "2026-06-22", value: 2650 },
                { date: "2026-07-22", value: 2628 },
                { date: "2026-08-21", value: 2618 },
              ],
              explainability: {
                click_title: "Why the relief-case line is lower",
                plain_language: "Weaker demand reduces buying pressure and could offset supply-side cost risk.",
                click_evidence_ids: ["ev_china_001"],
              },
            },
          ],
          drivers: [
            {
              id: "drv_energy_cost_pressure",
              label: "Energy cost pressure",
              direction: "upward_price_pressure",
              buyer_impact: "negative",
              impact: "high",
              impact_score: 0.31,
              confidence: 0.78,
              explanation: "Aluminium production is energy-intensive, so higher power costs can tighten supply.",
              evidence_ids: ["ev_energy_001", "ev_smelter_001"],
            },
            {
              id: "drv_warehouse_drawdown",
              label: "Warehouse stock drawdown",
              direction: "upward_price_pressure",
              buyer_impact: "negative",
              impact: "medium",
              impact_score: 0.22,
              confidence: 0.7,
              explanation: "Lower available stocks reduce the buffer against supply or demand shocks.",
              evidence_ids: ["ev_warehouse_001"],
            },
            {
              id: "drv_china_demand_softness",
              label: "Soft Chinese industrial demand",
              direction: "downward_price_pressure",
              buyer_impact: "positive",
              impact: "medium",
              impact_score: -0.18,
              confidence: 0.64,
              explanation: "Weaker industrial demand could limit aluminium price upside.",
              evidence_ids: ["ev_china_001"],
            },
          ],
          evidence: [
            {
              id: "ev_energy_001",
              source: "Cala.ai",
              title: "European power-cost pressure affecting aluminium production",
              date: "2026-05-22",
              reliability: "medium",
              url: "https://example.com/energy-pressure",
              signal_extracted: "Energy costs are increasing pressure on aluminium smelters.",
            },
            {
              id: "ev_smelter_001",
              source: "Fastmarkets",
              title: "European aluminium smelter curtailment risk on power costs",
              date: "2026-05-21",
              reliability: "high",
              url: "https://example.com/smelter-risk",
              signal_extracted: "Smelter curtailment risk increases the upside price tail.",
            },
            {
              id: "ev_warehouse_001",
              source: "LME",
              title: "Aluminium warehouse stock update",
              date: "2026-05-23",
              reliability: "high",
              url: "https://example.com/warehouse",
              signal_extracted: "Warehouse stock drawdown reduces the physical buffer.",
            },
            {
              id: "ev_china_001",
              source: "Macro feed",
              title: "China industrial demand softness",
              date: "2026-05-20",
              reliability: "medium",
              url: "https://example.com/china-demand",
              signal_extracted: "Weaker industrial demand can limit price upside.",
            },
          ],
          what_to_monitor: [
            {
              item: "LME warehouse stocks",
              why: "Confirms whether physical tightness is increasing or easing.",
              evidence_source_ids: ["ev_warehouse_001"],
            },
          ],
        },
        executive_pdf: {
          status: "ready",
          file_name: `${payload.material}-executive-report.pdf`,
          mime_type: "application/pdf",
          url: "https://cales-backend.onrender.com/reports/mock/executive.pdf",
        },
      }, 900)
    }
    return post<AgentAnalyzeResponse>(AGENT_API_URL, "/agent/analyze", payload)
  },

  getReport(reportId: string): Promise<AgentAnalyzeResponse> {
    if (USE_AGENT_MOCK) return Promise.reject(new Error("No agent report API configured"))
    return getFromBase<AgentAnalyzeResponse>(AGENT_API_URL, `/agent/reports/${reportId}`)
  },

  chat(message: string): Promise<{ answer: string; tool_calls: Array<Record<string, unknown>> }> {
    if (USE_AGENT_MOCK) {
      return delay({
        answer: "This demo is using local mock data. Connect VITE_AGENT_API_URL to ask the backend agent.",
        tool_calls: [],
      })
    }
    return post<{ answer: string; tool_calls: Array<Record<string, unknown>> }>(AGENT_API_URL, "/agent/chat", { message })
  },

  runUiAgent(payload: UIScreenPayload): Promise<UIAgentResponse> {
    if (USE_UI_AGENT_MOCK) return delay(mockUiAgent(payload), 450)
    return postUrl<UIAgentResponse>(UI_AGENT_API_URL, payload)
  },
}

export const IS_MOCK = USE_MOCK
