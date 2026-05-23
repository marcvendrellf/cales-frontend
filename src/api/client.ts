import { COMMODITIES, COMMODITY_BY_ID, SIGNALS } from "@/data/mock"
import type { AgentAnalyzeRequest, AgentAnalyzeResponse } from "@/lib/report-config"
import type { Commodity, CommodityId, MarketSignal } from "@/types"

// Flip to the real cales-backend by setting VITE_API_URL in .env.
// When unset, the app serves the in-repo mock dataset.
const API_URL = import.meta.env.VITE_API_URL as string | undefined
const AGENT_API_URL = (import.meta.env.VITE_AGENT_API_URL as string | undefined) ?? API_URL
const USE_MOCK = !API_URL
const USE_AGENT_MOCK = !AGENT_API_URL

// Small artificial latency so loading states are real in the demo.
function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`)
  return res.json() as Promise<T>
}

async function post<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`)
  return res.json() as Promise<T>
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
        answer: `[mock] Sent base-case analysis request for ${payload.material} over ${payload.horizon_days} days.`,
        tool_calls: [],
      }, 900)
    }
    return post<AgentAnalyzeResponse>(AGENT_API_URL, "/agent/analyze", payload)
  },
}

export const IS_MOCK = USE_MOCK
