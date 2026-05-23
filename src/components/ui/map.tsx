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
  /** Render an ambient heatmap layer from the points. */
  heatmap?: boolean
  /** Controlled fly-in: true frames the points, false sits at the wide view. Omit for legacy auto-fit. */
  active?: boolean
  /** Subset of points to center the fly-in on (e.g. exclude far-flung outliers). Defaults to all points. */
  framePoints?: MapPoint[]
  /** Allow user drag/zoom. Defaults to true; pass false for a cosmetic hero map. */
  interactive?: boolean
}

const TONE_WEIGHT: Record<NonNullable<MapPoint["tone"]>, number> = {
  primary: 1,
  warning: 0.85,
  positive: 0.7,
  muted: 0.55,
}

const HEAT_SOURCE = "exposure"
const HEAT_LAYER = "exposure-heat"

function toFeatureCollection(points: MapPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      properties: { weight: TONE_WEIGHT[point.tone ?? "primary"] },
      geometry: { type: "Point", coordinates: point.coordinates },
    })),
  }
}

export function Map({
  center,
  zoom = 4,
  points = [],
  className,
  heatmap = false,
  active,
  activeCenter,
  activeZoom,
  interactive = true,
}: MapProps) {
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
      interactive,
      attributionControl: false,
    })

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    }
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")
    mapRef.current = map

    return () => {
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current = []
      map.remove()
      mapRef.current = null
    }
    // Initialize the map once; later prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add (and keep in sync) the heatmap layer. The CARTO style's "load" event and
  // isStyleLoaded() are unreliable under React StrictMode's double-mount, but addSource/
  // addLayer succeed once the style JSON is parsed — so we attempt directly and retry.
  useEffect(() => {
    if (!heatmap) return
    let tries = 0
    let timer = 0

    const ensure = () => {
      const map = mapRef.current
      if (!map) return
      try {
        const existing = map.getSource(HEAT_SOURCE) as maplibregl.GeoJSONSource | undefined
        if (existing) {
          existing.setData(toFeatureCollection(points))
          return
        }
        map.addSource(HEAT_SOURCE, { type: "geojson", data: toFeatureCollection(points) })
        map.addLayer({
          id: HEAT_LAYER,
          type: "heatmap",
          source: HEAT_SOURCE,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 2, 0.9, 5, 1.7],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 2, 10, 5, 40],
            "heatmap-opacity": 0.85,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(224,179,65,0)",
              0.2, "rgba(224,179,65,0.3)",
              0.5, "rgba(224,179,65,0.6)",
              0.8, "rgba(224,179,65,0.82)",
              1, "rgba(224,179,65,0.95)",
            ],
          },
        } as Parameters<typeof map.addLayer>[0])
      } catch {
        if (tries++ < 40) timer = window.setTimeout(ensure, 150)
      }
    }

    ensure()
    return () => window.clearTimeout(timer)
  }, [points, heatmap])

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
      dotEl.className = "relative size-3 rounded-full border-2 border-background bg-foreground shadow-lg"
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

    // Legacy auto-fit only when the camera isn't externally controlled.
    if (active === undefined && points.length > 1) {
      const bounds = points.reduce(
        (nextBounds, point) => nextBounds.extend(point.coordinates),
        new LngLatBounds(points[0].coordinates, points[0].coordinates),
      )
      map.fitBounds(bounds, { padding: 52, duration: 500, maxZoom: 5 })
    }
  }, [points, active])

  // Controlled fly-in: frame the points when active, drift back to the wide view when not.
  // Camera methods queue safely even before the style finishes loading, so we apply
  // directly and add one delayed retry to cover the initial-mount / StrictMode race.
  useEffect(() => {
    if (active === undefined) return

    const run = () => {
      const map = mapRef.current
      if (!map) return
      if (active) {
        if (activeCenter) {
          map.flyTo({ center: activeCenter, zoom: activeZoom ?? 4, duration: 2600, curve: 1.4, essential: true })
        } else if (points.length > 1) {
          const bounds = points.reduce(
            (nextBounds, point) => nextBounds.extend(point.coordinates),
            new LngLatBounds(points[0].coordinates, points[0].coordinates),
          )
          map.fitBounds(bounds, { padding: 80, duration: 2600, maxZoom: 5, essential: true })
        } else if (points.length === 1) {
          map.flyTo({ center: points[0].coordinates, zoom: 5, duration: 2600, essential: true })
        }
      } else {
        map.easeTo({ center, zoom, duration: 1500, essential: true })
      }
    }

    run()
    const retry = window.setTimeout(run, 450)
    return () => window.clearTimeout(retry)
  }, [active, points, center, zoom, activeCenter, activeZoom])

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full min-h-[320px] w-full overflow-hidden bg-background",
        "[&_.maplibregl-ctrl-bottom-right]:text-[10px]",
        className,
      )}
    />
  )
}
