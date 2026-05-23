import type { Commodity, CommodityId } from "@/types"

export type ReportContextKey = "currentDate" | "spotPrice" | "warehouse" | "recentNews" | "sourceReliability"
export type ReportHorizon = "1M" | "3M" | "6M" | "12M"
export type PriorityProfile = "cost_saving" | "balanced" | "risk_averse" | "supply_security" | "sustainability"
export type AnalysisType = "base_case" | "stress_test" | "what_if"

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
  agentRequest?: AgentAnalyzeRequest
  agentResponse?: AgentAnalyzeResponse
}

export interface AgentAnalyzeContext {
  current_date: boolean
  spot_price: boolean
  warehouse_fill_pct: number | null
  related_news: boolean
  source_reliability: boolean
}

export interface AgentAnalyzeRequest {
  material: CommodityId
  horizon_days: number
  horizon_label: ReportHorizon
  priority_profile: PriorityProfile
  requested_at: string
  context: AgentAnalyzeContext
  include_market_drivers: boolean
  analysis_type: AnalysisType
}

export interface AgentAnalyzeResponse {
  request_id: string
  status: "completed" | "pending" | "error" | "failed" | "processing"
  material: CommodityId
  generated_at: string
  report_json: AgentWebsiteReport
  executive_pdf?: AgentExecutivePdf
  error?: string
}

export interface AgentExecutivePdf {
  status: "ready" | "pending" | "error" | "processing" | "failed"
  file_name: string
  mime_type: "application/pdf"
  url: string
  size_bytes?: number
}

export interface AgentWebsiteReport {
  schema_version: string
  output_type: "website_report"
  analysis_type: AnalysisType
  material: CommodityId
  generated_at: string
  horizon_days: number
  horizon_label: string
  recommendation: AgentReportRecommendation
  market_context: AgentMarketContext
  forecast: AgentForecast
  price_paths: AgentPricePath[]
  drivers: AgentReportDriver[]
  evidence: AgentReportEvidence[]
  what_to_monitor?: AgentMonitorItem[]
}

export interface AgentReportRecommendation {
  action: string
  recommended_horizon_days: number
  confidence: number
  risk_score: number
  opportunity_score: number
  summary: string
  decision_rationale: string
}

export interface AgentMarketContext {
  current_date: string
  spot_price?: {
    value: number
    unit: string
    as_of: string
    source_id?: string
  }
  warehouse_fill_pct?: number | null
}

export interface AgentForecast {
  direction: "upward" | "downward" | "flat"
  expected_change_pct: number
  range_low_pct: number
  range_high_pct: number
  interpretation: string
}

export interface AgentPricePath {
  id: string
  label: string
  graph_line_key: "base" | "upside" | "downside" | string
  buyer_impact: "positive" | "negative" | "neutral"
  summary: string
  expected_change_pct: number
  driver_ids: string[]
  evidence_ids: string[]
  graph_points: Array<{
    date: string
    value: number
  }>
  explainability?: {
    click_title: string
    plain_language: string
    click_evidence_ids: string[]
  }
}

export interface AgentReportDriver {
  id: string
  label: string
  direction:
    | "upward_price_pressure"
    | "downward_price_pressure"
    | "moderate_upward_price_pressure"
    | "moderate_downward_price_pressure"
    | "strong_upward_price_pressure"
    | "strong_downward_price_pressure"
    | "neutral"
    | string
  buyer_impact: "positive" | "negative" | "neutral"
  impact: "low" | "medium" | "high"
  impact_score: number
  confidence: number
  explanation: string
  evidence_ids: string[]
}

export interface AgentReportEvidence {
  id: string
  source: string
  title: string
  date: string | null
  reliability: "high" | "medium" | "low"
  url?: string
  signal_extracted: string
}

export interface AgentMonitorItem {
  item: string
  why: string
  evidence_source_ids: string[]
}

const STORAGE_PREFIX = "cales:report:"

const HORIZON_DAYS: Record<ReportHorizon, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "12M": 365,
}

const EVENT_COPY: Record<CommodityId, ReportConfig["countdownEvent"]> = {
  aluminium: {
    label: "LME stock update",
    date: "2026-06-03",
    outcome: "stocks build instead of drawing",
    shiftTo: "hedge",
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

export function buildAgentAnalyzeRequest(
  c: Commodity,
  config: ReportConfig,
  priorityProfile: PriorityProfile = "balanced",
): AgentAnalyzeRequest {
  return {
    material: c.id,
    horizon_days: HORIZON_DAYS[config.horizon],
    horizon_label: config.horizon,
    priority_profile: priorityProfile,
    requested_at: config.generatedAt,
    context: {
      current_date: config.contextFactors.currentDate,
      spot_price: config.contextFactors.spotPrice,
      warehouse_fill_pct: config.contextFactors.warehouse ? c.warehouseFillPct ?? null : null,
      related_news: config.contextFactors.recentNews,
      source_reliability: config.contextFactors.sourceReliability,
    },
    include_market_drivers: config.factors.length > 0,
    analysis_type: "base_case",
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
