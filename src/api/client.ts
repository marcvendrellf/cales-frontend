import { COMMODITIES, COMMODITY_BY_ID, SIGNALS } from "@/data/mock"
import type { Commodity, CommodityId, MarketSignal } from "@/types"

// Flip to the real cales-backend by setting VITE_API_URL in .env.
// When unset, the app serves the in-repo mock dataset.
const API_URL = import.meta.env.VITE_API_URL as string | undefined
const USE_MOCK = !API_URL

// Small artificial latency so loading states are real in the demo.
function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
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
}

export const IS_MOCK = USE_MOCK
