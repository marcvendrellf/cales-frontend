import type { Commodity, CommodityId } from "@/types"

export type ReportContextKey = "currentDate" | "spotPrice" | "warehouse" | "recentNews" | "sourceReliability"
export type ReportHorizon = "1M" | "3M" | "6M" | "12M"

export type WhatIfScenarioId = "base" | "upside" | "downside"

export interface WhatIfScenarioConfig {
  id: WhatIfScenarioId
  label: string
  driverIds: string[]
  evidenceIds: string[]
}

export interface ReportConfig {
  reportId: string
  commodityId: CommodityId
  factors: string[]
  contextFactors: Record<ReportContextKey, boolean>
  /** Selected evidence (news) ids to include in the report */
  news: string[]
  horizon: ReportHorizon
  countdownEvent: {
    label: string
    date: string
    outcome: string
    shiftTo: Commodity["recommendation"]["action"]
  }
  whatIfScenarios: WhatIfScenarioConfig[]
  generatedBy: string
  generatedAt: string
  versionHash: string
}

const STORAGE_PREFIX = "cales:report:"

const EVENT_COPY: Record<CommodityId, ReportConfig["countdownEvent"]> = {
  aluminium: {
    label: "LME stock update",
    date: "2026-06-03",
    outcome: "stocks draw again",
    shiftTo: "buy",
  },
  pet: {
    label: "EU recycled-content vote",
    date: "2026-06-12",
    outcome: "rPET thresholds tighten",
    shiftTo: "hedge",
  },
  energy: {
    label: "EU gas storage report",
    date: "2026-06-06",
    outcome: "storage misses seasonal norm",
    shiftTo: "hedge",
  },
  barley: {
    label: "Crop progress report",
    date: "2026-06-10",
    outcome: "dryness expands",
    shiftTo: "buy",
  },
}

export function createReportId(commodityId: CommodityId) {
  const stamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 7)
  return `${commodityId}-${stamp}-${random}`
}

export function reportCommodityId(reportId: string): CommodityId | null {
  const [candidate] = reportId.split("-")
  return ["aluminium", "pet", "energy", "barley"].includes(candidate)
    ? (candidate as CommodityId)
    : null
}

function versionHash(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash).toString(16).slice(0, 8).padStart(8, "0")
}

export function defaultWhatIfScenarios(c: Commodity): WhatIfScenarioConfig[] {
  const up = c.drivers.filter((driver) => driver.direction === "up")
  const down = c.drivers.filter((driver) => driver.direction === "down")
  const top = [...c.drivers].sort((a, b) => b.weight - a.weight)

  return [
    {
      id: "base",
      label: "Base case",
      driverIds: top.slice(0, 2).map((driver) => driver.id),
      evidenceIds: top.slice(0, 2).map((driver) => driver.sourceId).filter(Boolean) as string[],
    },
    {
      id: "upside",
      label: "Upside stress",
      driverIds: up.slice(0, 2).map((driver) => driver.id),
      evidenceIds: up.slice(0, 2).map((driver) => driver.sourceId).filter(Boolean) as string[],
    },
    {
      id: "downside",
      label: "Downside relief",
      driverIds: down.slice(0, 2).map((driver) => driver.id),
      evidenceIds: down.slice(0, 2).map((driver) => driver.sourceId).filter(Boolean) as string[],
    },
  ]
}

export function buildReportConfig({
  c,
  factors,
  contextFactors,
  news,
  horizon,
}: {
  c: Commodity
  factors: string[]
  contextFactors: Record<ReportContextKey, boolean>
  news: string[]
  horizon: ReportHorizon
}): ReportConfig {
  const generatedAt = new Date().toISOString()
  const reportId = createReportId(c.id)

  return {
    reportId,
    commodityId: c.id,
    factors,
    contextFactors,
    news,
    horizon,
    countdownEvent: EVENT_COPY[c.id],
    whatIfScenarios: defaultWhatIfScenarios(c),
    generatedBy: "Marc Vendrell",
    generatedAt,
    versionHash: versionHash(`${reportId}:${c.id}:${generatedAt}:${factors.join(",")}`),
  }
}

export function defaultReportConfig(c: Commodity, reportId = createReportId(c.id)): ReportConfig {
  const generatedAt = new Date().toISOString()
  return {
    reportId,
    commodityId: c.id,
    factors: c.drivers.map((driver) => driver.id),
    contextFactors: {
      currentDate: true,
      spotPrice: true,
      warehouse: c.warehouseFillPct != null,
      recentNews: true,
      sourceReliability: true,
    },
    news: c.evidence.map((item) => item.id),
    horizon: "3M",
    countdownEvent: EVENT_COPY[c.id],
    whatIfScenarios: defaultWhatIfScenarios(c),
    generatedBy: "Marc Vendrell",
    generatedAt,
    versionHash: versionHash(`${reportId}:${c.id}:${generatedAt}`),
  }
}

export function saveReportConfig(config: ReportConfig) {
  localStorage.setItem(`${STORAGE_PREFIX}${config.reportId}`, JSON.stringify(config))
}

export function loadReportConfig(reportId: string): ReportConfig | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${reportId}`)
    return raw ? (JSON.parse(raw) as ReportConfig) : null
  } catch {
    return null
  }
}
