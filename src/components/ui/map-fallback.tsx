import { useEffect, useId, useRef, useState } from "react"
import geography from "@/data/fallback-map.json"
import { cn } from "@/lib/utils"
import type { MapProps } from "./map"

function project([lng, lat]: [number, number]): [number, number] {
  const sine = Math.sin(Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI / 180)
  return [(lng + 180) / 360 * 256, (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * 256]
}

export default function MapFallback({ center, zoom = 4, points = [], framePoints, active, selectedPoint, heatmap, className }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gradientId = useId()
  const [size, setSize] = useState({ width: 1200, height: 800 })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const frame = framePoints?.length ? framePoints : points
  const selected = points.find((point) => point.id === selectedPoint)
  const leftPadding = active === undefined ? 52 : Math.min(size.width * 0.44, 620)
  const rightPadding = active === undefined ? 52 : 100
  let [cameraX, cameraY] = project(center)
  let level = zoom

  if (selected) {
    const position = project(selected.coordinates)
    cameraX = position[0]
    cameraY = position[1]
    level = 5.5
  } else if ((active || active === undefined) && frame.length > 0) {
    const positions = frame.map((point) => project(point.coordinates))
    const minX = Math.min(...positions.map(([x]) => x))
    const maxX = Math.max(...positions.map(([x]) => x))
    const minY = Math.min(...positions.map(([, y]) => y))
    const maxY = Math.max(...positions.map(([, y]) => y))
    cameraX = (minX + maxX) / 2
    cameraY = (minY + maxY) / 2
    level = Math.min(4.8, Math.log2(Math.min(
      Math.max(100, size.width - leftPadding - rightPadding) / Math.max(1, maxX - minX),
      Math.max(100, size.height - 240) / Math.max(1, maxY - minY),
    )))
  }

  const scale = 2 ** Math.max(0, Math.min(5.5, level))
  if (selected || active) cameraX -= (leftPadding - rightPadding) / (2 * scale)
  const width = size.width / scale
  const height = size.height / scale

  return (
    <div ref={containerRef} className={cn("relative h-full min-h-[320px] w-full overflow-hidden bg-[#dbe5eb] dark:bg-[#111a22]", className)}>
      <svg role="img" aria-label="Geographic exposure map with report locations" className="size-full" viewBox={`${cameraX - width / 2} ${cameraY - height / 2} ${width} ${height}`}>
        <defs>
          <radialGradient id={gradientId}>
            <stop offset="0" stopColor="#e0b341" stopOpacity="0.55" />
            <stop offset="1" stopColor="#e0b341" stopOpacity="0" />
          </radialGradient>
        </defs>
        {geography.countries.map((country) => (
          <path key={country.name} d={country.path} className="fill-[#f1eee7] stroke-[#b8b7b0] dark:fill-[#2c3031] dark:stroke-[#646963]" strokeWidth="0.8" vectorEffect="non-scaling-stroke" fillRule="evenodd" />
        ))}
        {geography.countries.filter((country) => country.width * scale > country.name.length * 6 && country.height * scale > 24).map((country) => (
          <text key={country.name} x={country.label[0]} y={country.label[1]} textAnchor="middle" fontSize={11 / scale} className="fill-[#6a6a63] dark:fill-[#929a95]">{country.name.toUpperCase()}</text>
        ))}
        {points.map((point) => {
          const [x, y] = project(point.coordinates)
          return (
            <g key={point.id}>
              <title>{point.label}{point.description ? `: ${point.description}` : ""}</title>
              {heatmap ? <circle cx={x} cy={y} r={42 / scale} fill={`url(#${gradientId})`} /> : null}
              <circle cx={x} cy={y} r={12 / scale} fill="#e0b341" fillOpacity="0.16" />
              <circle cx={x} cy={y} r={5 / scale} className="fill-foreground stroke-background" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </g>
          )
        })}
      </svg>
      <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer" className="absolute bottom-1 right-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">Natural Earth</a>
    </div>
  )
}
