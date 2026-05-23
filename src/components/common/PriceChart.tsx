import { useEffect, useRef } from "react"
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import type { PricePoint } from "@/types"

interface Props {
  data: PricePoint[]
  /** css var name without var(), e.g. "positive" */
  color?: string
  height?: number
  /** draw a horizontal line at this value (e.g. current spot) */
  priceLine?: number
  unit?: string
}

export function PriceChart({
  data,
  color = "positive",
  height = 340,
  priceLine,
  unit,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const css = getComputedStyle(document.documentElement)
    const line = css.getPropertyValue(`--${color}`).trim() || "#74c79a"
    const muted = css.getPropertyValue("--muted-foreground").trim() || "#aea69c"
    const border = css.getPropertyValue("--border").trim() || "#3f3a36"

    const chart: IChartApi = createChart(el, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: muted,
        fontFamily: '"Hedvig Letters Sans", system-ui, sans-serif',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: border + "66" },
      },
      rightPriceScale: { borderColor: border },
      timeScale: { borderColor: border, fixLeftEdge: true, fixRightEdge: true },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: muted, width: 1, style: LineStyle.Dotted, labelBackgroundColor: border },
        horzLine: { color: muted, width: 1, style: LineStyle.Dotted, labelBackgroundColor: border },
      },
      handleScroll: false,
      handleScale: false,
    })

    const series: ISeriesApi<"Area"> = chart.addSeries(AreaSeries, {
      lineColor: line,
      topColor: line + "44",
      bottomColor: line + "00",
      lineWidth: 2,
      priceLineVisible: false,
      priceFormat: { type: "price", precision: unit && data[0]?.value < 100 ? 2 : 0, minMove: 0.01 },
    })
    series.setData(data.map((d) => ({ time: d.date, value: d.value })))

    if (priceLine != null) {
      series.createPriceLine({
        price: priceLine,
        color: muted,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "spot",
      })
    }

    chart.timeScale().fitContent()

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) chart.applyOptions({ width: w })
    })
    ro.observe(el)
    chart.applyOptions({ width: el.clientWidth })

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [data, color, height, priceLine, unit])

  return <div ref={ref} className="w-full" />
}
