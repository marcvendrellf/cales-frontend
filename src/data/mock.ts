import type {
  Commodity,
  CommodityId,
  MarketSignal,
  PricePoint,
  RecommendationChange,
} from "@/types"

// Deterministic pseudo-random so the demo looks identical every run.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random-walk price series ending at `end`, `days` long, with a drift bias. */
function makeSeries(
  seed: number,
  end: number,
  days: number,
  driftPct: number,
  vol: number,
): PricePoint[] {
  const rand = mulberry32(seed)
  const drift = (end * driftPct) / 100 / days
  const out: PricePoint[] = []
  // Walk backwards from the end value, then reverse.
  let v = end
  const tmp: number[] = []
  for (let i = 0; i < days; i++) {
    tmp.push(v)
    const shock = (rand() - 0.5) * 2 * vol * end
    v = v - drift - shock
    if (v < end * 0.4) v = end * 0.4
  }
  tmp.reverse()
  const today = new Date("2026-05-23")
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - (days - 1 - i))
    out.push({ date: d.toISOString().slice(0, 10), value: Math.round(tmp[i] * 100) / 100 })
  }
  return out
}

export const COMMODITIES: Commodity[] = [
  {
    id: "aluminium",
    name: "Aluminium",
    unit: "USD/t",
    spot: 2685,
    change24h: 0.8,
    change30d: 6.4,
    trend: "up",
    weight: 1.0,
    warehouseFillPct: 80,
    blurb:
      "Highest economic weight for Damm — cans & packaging. Energy-driven supply, LME-priced.",
    recommendation: {
      action: "buy",
      horizon: "Next 3 months",
      score: 78,
      confidence: 0.74,
      summary:
        "Upward pressure is building from European smelter curtailments and a firming energy curve while LME stocks draw down. The setup rhymes with 2021. Secure base volume now; hedge the tail to Q3.",
      updatedAt: "2026-05-23T08:30:00Z",
    },
    recommendationHistory: [
      { action: "monitor", date: "2025-10-01", note: "Post-summer slowdown; waiting for Q4 signals before committing." },
      { action: "buy",     date: "2025-11-14", note: "European smelter constraints emerging on power costs; early entry." },
      { action: "hedge",   date: "2026-01-09", note: "Macro uncertainty after rate decisions and tariff risk — cap exposure." },
      { action: "wait",    date: "2026-02-27", note: "Price ran ahead of fundamentals; waiting for a cleaner re-entry." },
      { action: "buy",     date: "2026-05-15", note: "Smelter curtailments confirmed; LME stocks drawing for 5th straight week." },
    ] satisfies RecommendationChange[],
    drivers: [
      {
        id: "al-d1",
        label: "European smelter curtailments",
        direction: "up",
        weight: 0.32,
        category: "Sector news",
        rationale:
          "Two EU smelters announced cutbacks on power costs, tightening regional supply.",
        sourceId: "al-e1",
      },
      {
        id: "al-d2",
        label: "Energy forward curve firming",
        direction: "up",
        weight: 0.26,
        category: "Upstream feedstock",
        rationale: "Smelting is power-intensive; rising power forwards lift the cost floor.",
        sourceId: "al-e2",
      },
      {
        id: "al-d3",
        label: "LME warehouse stocks drawing down",
        direction: "up",
        weight: 0.21,
        category: "Inventory & flows",
        rationale: "On-warrant stocks fell for a 5th straight week.",
        sourceId: "al-e3",
      },
      {
        id: "al-d4",
        label: "Managed-money net long rising",
        direction: "up",
        weight: 0.12,
        category: "Speculative positioning",
        rationale: "COT shows funds adding length — momentum building ahead of spot.",
        sourceId: "al-e4",
      },
      {
        id: "al-d5",
        label: "Soft Chinese industrial demand",
        direction: "down",
        weight: 0.09,
        category: "Macro",
        rationale: "Weaker China PMI caps the upside somewhat.",
        sourceId: "al-e5",
      },
    ],
    evidence: [
      {
        id: "al-e1",
        title: "EU smelter curtailment announcements",
        source: "Fastmarkets",
        reliability: "high",
        date: "2026-05-20",
        excerpt: "Two European smelters confirm capacity cuts citing power economics.",
      },
      {
        id: "al-e2",
        title: "Power forward curve (Cala.ai feed)",
        source: "Cala.ai",
        reliability: "high",
        date: "2026-05-22",
        excerpt: "Front-quarter power forwards up 9% MoM, lifting smelter cost floor.",
      },
      {
        id: "al-e3",
        title: "LME on-warrant aluminium stocks",
        source: "LME",
        reliability: "high",
        date: "2026-05-21",
        excerpt: "On-warrant stocks down a 5th consecutive week.",
      },
      {
        id: "al-e4",
        title: "CFTC Commitments of Traders",
        source: "CFTC (COT)",
        reliability: "medium",
        date: "2026-05-16",
        excerpt: "Managed money net length increased week-on-week.",
      },
      {
        id: "al-e5",
        title: "China manufacturing PMI",
        source: "Macro feed",
        reliability: "medium",
        date: "2026-05-18",
        excerpt: "PMI prints below 50, signalling soft industrial demand.",
      },
    ],
    history: [
      {
        id: "al-h1",
        title: "2021–22 energy-crisis smelter curtailments",
        similarity: 0.81,
        period: "Q4 2021 – Q1 2022",
        summary:
          "Surging European power forced smelter shutdowns; aluminium ran up sharply over the following quarter.",
        outcome: "+34% over 4 months — buyers who waited paid materially more.",
      },
    ],
    series: makeSeries(11, 2685, 180, 7, 0.012),
  },
  {
    id: "pet",
    name: "PET",
    unit: "USD/t",
    spot: 1180,
    change24h: -0.3,
    change30d: -2.1,
    trend: "down",
    weight: 0.7,
    warehouseFillPct: 45,
    blurb:
      "Bottle resin (vPET / rPET). Driven by PTA, MEG, crude, and EU recycled-content rules.",
    recommendation: {
      action: "wait",
      horizon: "Next 4–6 weeks",
      score: 41,
      confidence: 0.62,
      summary:
        "Feedstock (PTA/MEG) and crude are easing and Asian import availability is ample. Spot likely drifts lower near-term — wait before committing virgin volume; watch rPET separately on regulation.",
      updatedAt: "2026-05-23T08:30:00Z",
    },
    recommendationHistory: [
      { action: "buy",     date: "2025-10-15", note: "Restock cycle; low inventory ahead of peak season justified buying." },
      { action: "wait",    date: "2025-12-18", note: "Crude softening; feedstock cost relief expected in coming weeks." },
      { action: "monitor", date: "2026-02-20", note: "EU recycled-content rules adding complexity; vPET/rPET diverging." },
      { action: "buy",     date: "2026-04-08", note: "Short window: supply tightened temporarily and feedstock bounced." },
      { action: "wait",    date: "2026-05-10", note: "Ample Asia/Turkey imports; feedstock easing again — spot likely drifts lower." },
    ] satisfies RecommendationChange[],
    drivers: [
      {
        id: "pet-d1",
        label: "Crude & PTA easing",
        direction: "down",
        weight: 0.3,
        category: "Upstream feedstock",
        rationale: "Lower crude flows into paraxylene → PTA, the main vPET cost.",
        sourceId: "pet-e1",
      },
      {
        id: "pet-d2",
        label: "Ample Asia/Turkey imports",
        direction: "down",
        weight: 0.24,
        category: "Inventory & flows",
        rationale: "Import availability into Europe remains high.",
        sourceId: "pet-e2",
      },
      {
        id: "pet-d3",
        label: "MEG oversupply",
        direction: "down",
        weight: 0.18,
        category: "Upstream feedstock",
        rationale: "MEG length adds downward pressure on resin.",
        sourceId: "pet-e3",
      },
      {
        id: "pet-d4",
        label: "EU recycled-content mandate (rPET)",
        direction: "up",
        weight: 0.28,
        category: "Regulation",
        rationale:
          "Recycled-content rules lift rPET demand against tight recycled supply — diverges from vPET.",
        sourceId: "pet-e4",
      },
    ],
    evidence: [
      {
        id: "pet-e1",
        title: "PTA & crude assessment (ICIS LOR)",
        source: "ICIS",
        reliability: "high",
        date: "2026-05-22",
        excerpt: "PTA spot eases with softer crude and paraxylene.",
      },
      {
        id: "pet-e2",
        title: "PET import volumes into EU (Cala.ai feed)",
        source: "Cala.ai",
        reliability: "high",
        date: "2026-05-21",
        excerpt: "Asia/Turkey import arrivals remain elevated.",
      },
      {
        id: "pet-e3",
        title: "MEG price assessment",
        source: "ICIS",
        reliability: "high",
        date: "2026-05-20",
        excerpt: "MEG remains long, capping resin cost.",
      },
      {
        id: "pet-e4",
        title: "EU recycled-content regulation tracker",
        source: "EU regulation tracker",
        reliability: "high",
        date: "2026-05-12",
        excerpt: "Recycled-content thresholds tighten demand for rPET.",
      },
    ],
    history: [
      {
        id: "pet-h1",
        title: "2023 feedstock destocking",
        similarity: 0.66,
        period: "H1 2023",
        summary:
          "Falling crude/PTA pulled vPET lower for two months before stabilising.",
        outcome: "-11% over 8 weeks — waiting was rewarded for virgin resin.",
      },
    ],
    series: makeSeries(22, 1180, 180, -3, 0.01),
  },
  {
    id: "energy",
    name: "Energy",
    unit: "EUR/MWh",
    spot: 92,
    change24h: 1.6,
    change30d: 11.2,
    trend: "up",
    weight: 0.85,
    blurb:
      "Power & gas. Direct brewing cost and an upstream driver of aluminium & PET. OMIP / TTF.",
    recommendation: {
      action: "hedge",
      horizon: "Lock 6 months (through Q4)",
      score: 69,
      confidence: 0.7,
      summary:
        "Two-sided risk is high: low gas storage and a forecast cold snap skew the tail upward, but mild scenarios exist. Don't chase spot — hedge a 6-month strip to cap exposure into winter.",
      updatedAt: "2026-05-23T08:30:00Z",
    },
    recommendationHistory: [
      { action: "monitor", date: "2025-09-22", note: "End of summer; storage rebuilding, no urgency to act." },
      { action: "hedge",   date: "2025-11-05", note: "Winter storage below seasonal norm; cold forecast raised tail risk." },
      { action: "wait",    date: "2026-01-15", note: "Mild winter relieved pressure; spot softened, hedges less urgent." },
      { action: "monitor", date: "2026-03-10", note: "Spring transition; signals mixed, no clear edge either way." },
      { action: "hedge",   date: "2026-05-18", note: "TTF spike and below-norm storage raised winter tail risk again — lock the strip." },
    ] satisfies RecommendationChange[],
    drivers: [
      {
        id: "en-d1",
        label: "TTF gas spiking",
        direction: "up",
        weight: 0.3,
        category: "Upstream feedstock",
        rationale: "Gas sets marginal EU power price; TTF up sharply.",
        sourceId: "en-e1",
      },
      {
        id: "en-d2",
        label: "Low gas storage levels",
        direction: "up",
        weight: 0.24,
        category: "Inventory & flows",
        rationale: "Storage below seasonal norm raises winter risk.",
        sourceId: "en-e2",
      },
      {
        id: "en-d3",
        label: "Forecast cold snap",
        direction: "up",
        weight: 0.2,
        category: "Weather & climate",
        rationale: "Colder forecast lifts heating demand.",
        sourceId: "en-e3",
      },
      {
        id: "en-d4",
        label: "Strong renewable output",
        direction: "down",
        weight: 0.16,
        category: "Macro",
        rationale: "High wind/solar depresses wholesale power on good days.",
        sourceId: "en-e4",
      },
    ],
    evidence: [
      {
        id: "en-e1",
        title: "TTF gas curve (Cala.ai feed)",
        source: "Cala.ai",
        reliability: "high",
        date: "2026-05-22",
        excerpt: "TTF front-month up double digits week-on-week.",
      },
      {
        id: "en-e2",
        title: "EU gas storage levels",
        source: "GIE / Macro feed",
        reliability: "high",
        date: "2026-05-21",
        excerpt: "Storage tracking below the 5-year seasonal average.",
      },
      {
        id: "en-e3",
        title: "Weather forecast (heating demand)",
        source: "Weather feed",
        reliability: "medium",
        date: "2026-05-22",
        excerpt: "Below-normal temperatures forecast across NW Europe.",
      },
      {
        id: "en-e4",
        title: "OMIP power forwards",
        source: "OMIP",
        reliability: "high",
        date: "2026-05-22",
        excerpt: "Iberian power forwards firm but volatile on renewables.",
      },
    ],
    history: [
      {
        id: "en-h1",
        title: "2021–22 European gas crisis",
        similarity: 0.74,
        period: "2021–2022",
        summary:
          "Gas and power spiked, cascading into aluminium smelter curtailments — the canonical contagion case.",
        outcome: "Multi-fold spike; unhedged buyers were badly exposed.",
      },
    ],
    series: makeSeries(33, 92, 180, 11, 0.02),
  },
  {
    id: "barley",
    name: "Barley",
    unit: "EUR/t",
    spot: 218,
    change24h: 0.2,
    change30d: 1.3,
    trend: "flat",
    weight: 0.6,
    warehouseFillPct: 30,
    blurb:
      "Malting input for brewing. First-party 6-month Damm dataset — our model backtest anchor.",
    recommendation: {
      action: "monitor",
      horizon: "Reassess after crop reports",
      score: 52,
      confidence: 0.55,
      summary:
        "Signals are balanced: weather is benign so far and stocks are adequate, but the growing season is the swing factor. No edge yet — monitor drought indices and the next crop-progress reports.",
      updatedAt: "2026-05-23T08:30:00Z",
    },
    recommendationHistory: [
      { action: "buy",     date: "2025-08-20", note: "Drought scare premium; good entry point before harvest clarity." },
      { action: "monitor", date: "2025-10-10", note: "Harvest results in; comfortable — shifting to wait-and-see." },
      { action: "wait",    date: "2026-01-22", note: "Comfortable carryover stocks; no urgency before growing season." },
      { action: "monitor", date: "2026-03-15", note: "Early growing season begins; drought tail risk warrants close watch." },
    ] satisfies RecommendationChange[],
    drivers: [
      {
        id: "ba-d1",
        label: "Benign growing weather",
        direction: "down",
        weight: 0.26,
        category: "Weather & climate",
        rationale: "Favourable conditions so far point to decent yields.",
        sourceId: "ba-e1",
      },
      {
        id: "ba-d2",
        label: "Adequate carryover stocks",
        direction: "down",
        weight: 0.2,
        category: "Inventory & flows",
        rationale: "Comfortable stocks cap upside.",
        sourceId: "ba-e2",
      },
      {
        id: "ba-d3",
        label: "Drought risk in key regions",
        direction: "up",
        weight: 0.24,
        category: "Weather & climate",
        rationale: "Tail risk if dry conditions develop mid-season.",
        sourceId: "ba-e3",
      },
      {
        id: "ba-d4",
        label: "Firm export demand",
        direction: "up",
        weight: 0.18,
        category: "Macro",
        rationale: "Competing buyers keep a floor under price.",
        sourceId: "ba-e4",
      },
    ],
    evidence: [
      {
        id: "ba-e1",
        title: "Crop-progress & weather",
        source: "Expana",
        reliability: "high",
        date: "2026-05-21",
        excerpt: "Conditions rated favourable across main growing belts.",
      },
      {
        id: "ba-e2",
        title: "Barley balance / stocks (Damm dataset)",
        source: "Damm dataset",
        reliability: "high",
        date: "2026-05-15",
        excerpt: "Carryover stocks adequate vs. demand.",
      },
      {
        id: "ba-e3",
        title: "Drought index monitor",
        source: "Weather feed",
        reliability: "medium",
        date: "2026-05-22",
        excerpt: "Dry pockets emerging; not yet yield-threatening.",
      },
      {
        id: "ba-e4",
        title: "Export demand (Cala.ai feed)",
        source: "Cala.ai",
        reliability: "high",
        date: "2026-05-20",
        excerpt: "Steady export interest from competing importers.",
      },
    ],
    history: [
      {
        id: "ba-h1",
        title: "2018 European drought",
        similarity: 0.48,
        period: "Summer 2018",
        summary:
          "A hot, dry summer cut yields and spiked malting barley — the cautionary analogue if drought builds.",
        outcome: "Sharp mid-season rally once drought confirmed.",
      },
    ],
    series: makeSeries(44, 218, 180, 1, 0.008),
  },
]

export const COMMODITY_BY_ID: Record<CommodityId, Commodity> = Object.fromEntries(
  COMMODITIES.map((c) => [c.id, c]),
) as Record<CommodityId, Commodity>

export const SIGNALS: MarketSignal[] = [
  {
    id: "s1",
    time: "2026-05-23T08:12:00Z",
    commodityId: "aluminium",
    impact: "bullish",
    category: "Sector news",
    headline: "Second EU smelter confirms curtailment on power costs",
    detail: "Regional supply tightens; premiums firm alongside LME base.",
    source: "Fastmarkets",
    reliability: "high",
  },
  {
    id: "s2",
    time: "2026-05-23T07:40:00Z",
    commodityId: "energy",
    impact: "bullish",
    category: "Upstream feedstock",
    headline: "TTF front-month jumps on cold forecast",
    detail: "Gas leads power higher; storage below seasonal norm amplifies the move.",
    source: "Cala.ai",
    reliability: "high",
  },
  {
    id: "s3",
    time: "2026-05-23T06:55:00Z",
    commodityId: "pet",
    impact: "bearish",
    category: "Upstream feedstock",
    headline: "PTA eases as crude and paraxylene soften",
    detail: "Virgin PET cost floor drops; rPET decoupling on regulation.",
    source: "ICIS",
    reliability: "high",
  },
  {
    id: "s4",
    time: "2026-05-22T16:20:00Z",
    commodityId: "macro",
    impact: "neutral",
    category: "Macro",
    headline: "EUR firms vs USD after data",
    detail: "Stronger euro modestly lowers USD-priced import costs.",
    source: "Macro feed",
    reliability: "medium",
  },
  {
    id: "s5",
    time: "2026-05-22T14:05:00Z",
    commodityId: "aluminium",
    impact: "bullish",
    category: "Inventory & flows",
    headline: "LME on-warrant stocks fall a 5th straight week",
    detail: "Visible inventory draw supports the bullish setup.",
    source: "LME",
    reliability: "high",
  },
  {
    id: "s6",
    time: "2026-05-22T11:30:00Z",
    commodityId: "barley",
    impact: "neutral",
    category: "Weather & climate",
    headline: "Crop conditions rated favourable; dry pockets watched",
    detail: "No yield threat yet, but drought indices worth monitoring.",
    source: "Expana",
    reliability: "high",
  },
  {
    id: "s7",
    time: "2026-05-22T09:10:00Z",
    commodityId: "pet",
    impact: "bullish",
    category: "Regulation",
    headline: "EU recycled-content thresholds tighten for 2027",
    detail: "rPET demand lifts against constrained recycled supply.",
    source: "EU regulation tracker",
    reliability: "high",
  },
  {
    id: "s8",
    time: "2026-05-21T15:45:00Z",
    commodityId: "energy",
    impact: "bearish",
    category: "Macro",
    headline: "Record wind output caps day-ahead power",
    detail: "Strong renewables offset some upside on mild days.",
    source: "OMIP",
    reliability: "medium",
  },
  {
    id: "s9",
    time: "2026-05-21T10:20:00Z",
    commodityId: "aluminium",
    impact: "bullish",
    category: "Speculative positioning",
    headline: "COT: managed money adds aluminium length",
    detail: "Funds positioning ahead of the physical tightness.",
    source: "CFTC (COT)",
    reliability: "medium",
  },
  {
    id: "s10",
    time: "2026-05-21T08:00:00Z",
    commodityId: "macro",
    impact: "neutral",
    category: "Logistics costs",
    headline: "Freight rates stable week-on-week",
    detail: "No incremental logistics pressure across categories.",
    source: "Freight index",
    reliability: "medium",
  },
]
