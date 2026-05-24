import type { CommodityId } from "@/types"
import type { AgentAnalyzeResponse, ReportConfig } from "@/lib/report-config"

import aluminiumRaw from "./report-aluminium.json"
import petRaw from "./report-pet.json"
import energyRaw from "./report-energy.json"
import barleyRaw from "./report-barley.json"

const COUNTDOWN_EVENTS: Record<CommodityId, ReportConfig["countdownEvent"]> = {
  aluminium: { label: "LME stock update", date: "2026-06-03", outcome: "stocks build instead of drawing", shiftTo: "hedge" },
  pet: { label: "EU recycled-content vote", date: "2026-06-12", outcome: "rPET thresholds tighten", shiftTo: "hedge" },
  energy: { label: "EU gas storage report", date: "2026-06-06", outcome: "storage misses seasonal norm", shiftTo: "hedge" },
  barley: { label: "Crop progress report", date: "2026-06-10", outcome: "dryness expands", shiftTo: "buy" },
}

function makeConfig(raw: AgentAnalyzeResponse): ReportConfig {
  const report = raw.report_json
  const commodityId = raw.material as CommodityId
  const factors = [...new Set(report.drivers.map((d) => d.id))]
  const news = report.evidence.map((e) => e.id)
  const upDrivers = report.drivers.filter((d) => d.direction.includes("upward")).map((d) => d.id)
  const downDrivers = report.drivers.filter((d) => d.direction.includes("downward")).map((d) => d.id)

  return {
    reportId: raw.request_id,
    commodityId,
    factors,
    contextFactors: {
      currentDate: true,
      spotPrice: report.market_context.spot_price != null,
      warehouse: report.market_context.warehouse_fill_pct != null,
      recentNews: news.length > 0,
      sourceReliability: true,
    },
    news,
    horizon: "3M",
    countdownEvent: COUNTDOWN_EVENTS[commodityId],
    whatIfScenarios: [
      { id: "base", label: "Base case", driverIds: factors.slice(0, 2), evidenceIds: news.slice(0, 3) },
      { id: "upside", label: "Upside stress", driverIds: upDrivers.slice(0, 2), evidenceIds: news.slice(0, 2) },
      { id: "downside", label: "Downside relief", driverIds: downDrivers.slice(0, 2), evidenceIds: news.slice(-2) },
    ],
    generatedBy: "Cales Agent",
    generatedAt: raw.generated_at,
    versionHash: raw.request_id.slice(-8),
    agentResponse: raw,
  }
}

const aluminium = makeConfig(aluminiumRaw as unknown as AgentAnalyzeResponse)
const pet = makeConfig(petRaw as unknown as AgentAnalyzeResponse)
const energy = makeConfig(energyRaw as unknown as AgentAnalyzeResponse)
const barley = makeConfig(barleyRaw as unknown as AgentAnalyzeResponse)

export const DEMO_REPORT_CONFIGS: Record<string, ReportConfig> = {
  [aluminium.reportId]: aluminium,
  [pet.reportId]: pet,
  [energy.reportId]: energy,
  [barley.reportId]: barley,
}

export const DEMO_REPORT_ID: Record<CommodityId, string> = {
  aluminium: aluminium.reportId,
  pet: pet.reportId,
  energy: energy.reportId,
  barley: barley.reportId,
}
