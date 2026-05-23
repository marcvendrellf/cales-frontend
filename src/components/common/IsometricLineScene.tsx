import { cn } from "@/lib/utils"
import "./IsometricLineScene.css"

export type SceneProduct = "aluminium" | "pet" | "energy" | "barley"

type Tone = { fill: string; fill2: string; line: string }
type ToneSet = { rest: Tone; hot: Tone }

// Each commodity carries its own representing colour. `rest` is the idle look;
// `hot` is the brighter shade the centre item takes during the hover advance.
const PRODUCT_TONES: Record<SceneProduct, Record<"light" | "dark", ToneSet>> = {
  // aluminium -> silver / steel
  aluminium: {
    light: {
      rest: { fill: "#b7c0c9", fill2: "#eef2f6", line: "#9aa4ae" },
      hot: { fill: "#dfe6ec", fill2: "#ffffff", line: "#aeb8c2" },
    },
    dark: {
      rest: { fill: "#9aa6b2", fill2: "#d3dbe3", line: "#b6bfc8" },
      hot: { fill: "#dde6ef", fill2: "#ffffff", line: "#f0f3f6" },
    },
  },
  // PET -> blue / cyan
  pet: {
    light: {
      rest: { fill: "#5aaec4", fill2: "#c9edf4", line: "#3f97ad" },
      hot: { fill: "#7fd6e8", fill2: "#e6fbff", line: "#54bdd2" },
    },
    dark: {
      rest: { fill: "#4fa6bd", fill2: "#bfeaf2", line: "#79c6d6" },
      hot: { fill: "#8fe0f0", fill2: "#e6fbff", line: "#bdf0fa" },
    },
  },
  // energy -> yellow
  energy: {
    light: {
      rest: { fill: "#d9b53a", fill2: "#fbe89a", line: "#bd9c28" },
      hot: { fill: "#ffd84d", fill2: "#fff6c2", line: "#e6bd3a" },
    },
    dark: {
      rest: { fill: "#d9b53a", fill2: "#fbe89a", line: "#eccf5a" },
      hot: { fill: "#ffd84d", fill2: "#fff6c2", line: "#ffe680" },
    },
  },
  // barley -> golden amber
  barley: {
    light: {
      rest: { fill: "#c7923a", fill2: "#eecb7e", line: "#a87a28" },
      hot: { fill: "#f0bb55", fill2: "#fde3ab", line: "#d9a441" },
    },
    dark: {
      rest: { fill: "#c79238", fill2: "#eecb7e", line: "#dcae54" },
      hot: { fill: "#f0bb55", fill2: "#fde3ab", line: "#f7cd76" },
    },
  },
}

type Palette = {
  panel: string
  border: string
  slatA: string
  slatB: string
  beltSide: string
  beltEdge: string
  beltStroke: string
}

const PALETTE: Record<"light" | "dark", Palette> = {
  light: {
    panel: "#fbfbfa",
    border: "#cfd5d6",
    slatA: "#ffffff",
    slatB: "#e8ecec",
    beltSide: "#d4dadb",
    beltEdge: "#ffffff",
    beltStroke: "#dfe3e4",
  },
  dark: {
    panel: "#211e1b",
    border: "#4a443d",
    slatA: "#332f29",
    slatB: "#28241e",
    beltSide: "#15120e",
    beltEdge: "#463f37",
    beltStroke: "#39342c",
  },
}

interface IsometricLineSceneProps {
  product?: SceneProduct
  className?: string
  mode?: "light" | "dark"
  /** Edge-to-edge: drop the inner rounded frame so the scene fills its container. */
  bleed?: boolean
}

// Isometric ground axes, matching the cube faces:
//  UL = "up-right" travel direction the belt runs along
//  UW = "down-right" axis the belt width is measured on
const UL = { x: 0.912, y: -0.41 }
const UW = { x: 0.894, y: 0.447 }

const BELT_W = 188 // belt width (across, along UW)
const BELT_H = 46 // belt thickness -> the 3D side face (the dark "shadow" edge)
const BELT_LEN = 1500 // belt length (along UL), extends past the panel
const SLAT = 40 // rib length along UL
const BASE_FL = { x: -262, y: 540 } // front-left corner of the belt

const ITEM_BASE = { x: 40, y: 92 } // item contact point relative to its translate origin
const ITEM_SCALE = 1.5 // makes the products read large on the belt
const CENTER_T = 791 // belt param at the scan point (panel middle)
const ITEM_SPACING = 160 // gap between items along the belt

function beltCenter(t: number) {
  return {
    x: BASE_FL.x - (BELT_W / 2) * UW.x + t * UL.x,
    y: BASE_FL.y - (BELT_W / 2) * UW.y + t * UL.y,
  }
}

const f = (n: number) => n.toFixed(1)

function IsoBelt({ x, y, p }: { x: number; y: number; p: Palette }) {
  const frx = x + BELT_LEN * UL.x
  const fry = y + BELT_LEN * UL.y
  const flBx = x
  const flBy = y + BELT_H
  const frBx = frx
  const frBy = fry + BELT_H
  const blx = x - BELT_W * UW.x
  const bly = y - BELT_W * UW.y
  const brx = frx - BELT_W * UW.x
  const bry = fry - BELT_W * UW.y

  const slatCount = Math.ceil(BELT_LEN / SLAT)
  const slats = []
  for (let i = 0; i < slatCount; i++) {
    const t0 = i * SLAT
    const t1 = Math.min((i + 1) * SLAT, BELT_LEN)
    const f0x = x + t0 * UL.x
    const f0y = y + t0 * UL.y
    const f1x = x + t1 * UL.x
    const f1y = y + t1 * UL.y
    const b0x = f0x - BELT_W * UW.x
    const b0y = f0y - BELT_W * UW.y
    const b1x = f1x - BELT_W * UW.x
    const b1y = f1y - BELT_W * UW.y
    slats.push(
      <path
        key={i}
        d={`M ${f(f0x)} ${f(f0y)} L ${f(f1x)} ${f(f1y)} L ${f(b1x)} ${f(b1y)} L ${f(b0x)} ${f(b0y)} Z`}
        fill={i % 2 === 0 ? p.slatA : p.slatB}
      />,
    )
  }

  return (
    <g>
      <path
        d={`M ${f(x)} ${f(y)} L ${f(frx)} ${f(fry)} L ${f(frBx)} ${f(frBy)} L ${f(flBx)} ${f(flBy)} Z`}
        fill={p.beltSide}
      />
      {slats}
      <path d={`M ${f(x)} ${f(y)} L ${f(frx)} ${f(fry)}`} stroke={p.beltEdge} strokeWidth="1.5" />
      <path
        d={`M ${f(blx)} ${f(bly)} L ${f(brx)} ${f(bry)} L ${f(frx)} ${f(fry)} L ${f(x)} ${f(y)} Z`}
        fill="none"
        stroke={p.beltStroke}
        strokeWidth="1"
      />
    </g>
  )
}

// Product silhouettes. Each is drawn with its base centred at ITEM_BASE
// (40, 92); ProductBlock scales and positions it on the belt.
function ProductShape({ product, tone }: { product: SceneProduct; tone: Tone }) {
  const strokeProps = {
    fill: "none",
    stroke: tone.line,
    strokeWidth: 1.75,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  }

  switch (product) {
    case "aluminium": {
      // beverage can
      const body = "M25 45 L25 86 A15 5 0 0 0 55 86 L55 45 Z"
      return (
        <>
          <path fill={tone.fill} d={body} />
          <ellipse fill={tone.fill2} cx="40" cy="45" rx="15" ry="5" />
          <g {...strokeProps}>
            <path d="M25 45 L25 86 A15 5 0 0 0 55 86 L55 45" />
            <ellipse cx="40" cy="45" rx="15" ry="5" />
            <path d="M25 53 A15 5 0 0 0 55 53" />
          </g>
        </>
      )
    }
    case "pet": {
      // PET bottle
      const body =
        "M34 37 L46 37 L46 49 L53 61 L53 85 Q53 90 48 90 L32 90 Q27 90 27 85 L27 61 L34 49 Z"
      return (
        <>
          <path fill={tone.fill} d={body} />
          <rect fill={tone.fill2} x="33" y="31" width="14" height="7" rx="1.5" />
          <g {...strokeProps}>
            <path d={body} />
            <rect x="33" y="31" width="14" height="7" rx="1.5" />
            <path d="M28 70 L52 70" />
          </g>
        </>
      )
    }
    case "energy": {
      // lightning bolt
      const bolt = "M48 38 L29 67 L40 67 L35 92 L57 60 L45 60 L51 38 Z"
      return (
        <>
          <path fill={tone.fill} d={bolt} />
          <g {...strokeProps}>
            <path d={bolt} />
          </g>
        </>
      )
    }
    case "barley": {
      // bowl heaped with grains
      const bowl = "M19 64 Q19 89 40 89 Q61 89 61 64 Z"
      // bowl wall without the straight top edge, so the rim isn't doubled up
      const bowlWall = "M19 64 Q19 89 40 89 Q61 89 61 64"
      // single front-rim arc — reads as an opaque edge instead of a see-through ellipse
      const rim = "M19 64 Q40 75 61 64"
      // scalloped mound of grains rising above the rim
      const mound =
        "M21 64 C23 53 29 52 32 57 C34 49 40 49 42 55 C44 48 50 49 52 56 C55 51 59 53 59 64 Z"
      return (
        <>
          <path fill={tone.fill} d={bowl} />
          <ellipse fill={tone.fill2} cx="40" cy="64" rx="21" ry="5.5" />
          <path fill={tone.fill2} d={mound} />
          <g {...strokeProps}>
            <path d={bowlWall} />
            <path d={rim} />
            <path d={mound} />
            {/* a few grain ticks on the heap */}
            <path d="M29 59 l3 1.4" />
            <path d="M38 57 l3 1.4" />
            <path d="M47 59 l3 1.4" />
          </g>
        </>
      )
    }
  }
}

// Two stacked layers. The idle layer holds the resting items (all bright). The
// active layer is the same items advanced one slot down the belt with the
// centre item recoloured; on hover it (and the belt) slide one slot while the
// idle layer fades out — so the items already on screen are the ones moving.
// On leave the active layer just fades back out to the idle layer (CSS).
const IDLE_STATIONS = [-1, 0, 1]
const ACTIVE_STATIONS = [-2, -1, 0, 1] // advanced by one slot; 0 lands at the centre

function ProductBlock({
  j,
  highlight,
  product,
  mode,
}: {
  j: number
  highlight: boolean
  product: SceneProduct
  mode: "light" | "dark"
}) {
  const tones = PRODUCT_TONES[product][mode]
  const tone = highlight ? tones.hot : tones.rest
  const c = beltCenter(CENTER_T + j * ITEM_SPACING)
  const x = c.x - ITEM_BASE.x
  const y = c.y - ITEM_BASE.y
  const isDark = mode === "dark"

  return (
    <g transform={`translate(${f(x)} ${f(y)})`}>
      <g transform={`translate(40 92) scale(${ITEM_SCALE}) translate(-40 -92)`}>
        <ellipse cx="40" cy="92" rx="28" ry="7" fill="#000000" opacity={isDark ? 0.32 : 0.08} />
        <ProductShape product={product} tone={tone} />
      </g>
    </g>
  )
}

function Stream({
  phase,
  product,
  mode,
}: {
  phase: "idle" | "active"
  product: SceneProduct
  mode: "light" | "dark"
}) {
  const stations = phase === "idle" ? IDLE_STATIONS : ACTIVE_STATIONS
  return (
    <g className={phase === "idle" ? "iso-stream-idle" : "iso-stream-active"}>
      {stations.map((j) => (
        <ProductBlock
          key={j}
          j={j}
          highlight={phase === "active" && j === 0}
          product={product}
          mode={mode}
        />
      ))}
    </g>
  )
}

export function IsometricLineScene({
  product = "aluminium",
  className,
  mode = "light",
  bleed = false,
}: IsometricLineSceneProps) {
  const id = `iso-${product}-${mode}${bleed ? "-bleed" : ""}`
  const palette = PALETTE[mode]
  const clipId = `${id}-panel`
  const frame = bleed
    ? { x: 0, y: 0, width: 800, height: 360, rx: 0 }
    : { x: 2, y: 2, width: 796, height: 356, rx: 20 }

  return (
    <svg
      viewBox="0 0 800 360"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block h-full w-full", className)}
      role="img"
      aria-label={`Isometric ${product} production-line scene`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect {...frame} />
        </clipPath>
      </defs>
      <rect {...frame} fill={palette.panel} />
      <g clipPath={`url(#${clipId})`}>
        <g className="iso-belt-track">
          <IsoBelt x={BASE_FL.x} y={BASE_FL.y} p={palette} />
        </g>
        <Stream phase="idle" product={product} mode={mode} />
        <Stream phase="active" product={product} mode={mode} />
      </g>
      {!bleed && (
        <rect x="2" y="2" width="796" height="356" rx="20" stroke={palette.border} strokeWidth="2" />
      )}
    </svg>
  )
}
