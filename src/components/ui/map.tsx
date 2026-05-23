import { useEffect, useRef } from "react"
import maplibregl, { LngLatBounds, type Map as MapLibreMap, type Marker } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

import { cn } from "@/lib/utils"

const CARTO_DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

export type MapPoint = {
  id: string
  label: string
  description?: string
  coordinates: [number, number]
  tone?: "primary" | "positive" | "warning" | "muted"
}

type MapProps = {
  center: [number, number]
  zoom?: number
  points?: MapPoint[]
  className?: string
}

const TONE_CLASS: Record<NonNullable<MapPoint["tone"]>, string> = {
  primary: "bg-cala",
  positive: "bg-positive",
  warning: "bg-hedge",
  muted: "bg-muted-foreground",
}

export function Map({ center, zoom = 4, points = [], className }: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRefs = useRef<Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_DARK_STYLE,
      center,
      zoom,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")
    mapRef.current = map

    return () => {
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.easeTo({ center, zoom, duration: 500 })
  }, [center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markerRefs.current.forEach((marker) => marker.remove())
    markerRefs.current = points.map((point) => {
      const markerEl = document.createElement("div")
      markerEl.className = "group relative flex items-center justify-center"
      const haloEl = document.createElement("span")
      haloEl.className = "absolute size-7 rounded-full bg-foreground/10"
      const dotEl = document.createElement("span")
      dotEl.className = cn(
        "relative size-3.5 rounded-full border-2 border-background shadow-lg",
        TONE_CLASS[point.tone ?? "primary"],
      )
      markerEl.append(haloEl, dotEl)

      const popup = new maplibregl.Popup({ closeButton: false, offset: 14 }).setHTML(`
        <div style="max-width: 220px">
          <p style="margin: 0; font-weight: 600; color: #211e1b">${point.label}</p>
          ${
            point.description
              ? `<p style="margin: 4px 0 0; font-size: 12px; color: #6f675f">${point.description}</p>`
              : ""
          }
        </div>
      `)

      return new maplibregl.Marker({ element: markerEl, anchor: "center" })
        .setLngLat(point.coordinates)
        .setPopup(popup)
        .addTo(map)
    })

    if (points.length > 1) {
      const bounds = points.reduce(
        (nextBounds, point) => nextBounds.extend(point.coordinates),
        new LngLatBounds(points[0].coordinates, points[0].coordinates),
      )
      map.fitBounds(bounds, { padding: 52, duration: 500, maxZoom: 5 })
    }
  }, [points])

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full min-h-[320px] w-full overflow-hidden rounded-lg bg-muted",
        "[&_.maplibregl-ctrl-bottom-right]:text-[10px]",
        className,
      )}
    />
  )
}
