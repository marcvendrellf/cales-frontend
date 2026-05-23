import { cn } from "@/lib/utils"

type CubeTone = "blue" | "teal"

type Cube = {
  x: number
  y: number
  scale?: number
  tone: CubeTone
}

type SceneVariant = {
  laneY: number
  laneX: number
  laneWidth: number
  laneHeight: number
  stripeOpacity: number
  cubes: Cube[]
}

const TONES: Record<
  CubeTone,
  {
    stroke: string
    top: string
    left: string
    right: string
    hatch: string
  }
> = {
  blue: {
    stroke: "#6f8fe7",
    top: "#fbfdff",
    left: "#dfe8ff",
    right: "#cbd9ff",
    hatch: "#4f73db",
  },
  teal: {
    stroke: "#6caeb7",
    top: "#fbfffd",
    left: "#d7eef0",
    right: "#bfdee2",
    hatch: "#458f99",
  },
}

const VARIANTS: Record<string, SceneVariant> = {
  balanced: {
    laneX: 48,
    laneY: 128,
    laneWidth: 600,
    laneHeight: 102,
    stripeOpacity: 0.64,
    cubes: [
      { x: 104, y: 198, tone: "blue", scale: 0.86 },
      { x: 236, y: 166, tone: "blue", scale: 0.92 },
      { x: 370, y: 132, tone: "blue", scale: 0.9 },
      { x: 516, y: 98, tone: "blue", scale: 0.84 },
    ],
  },
  sparse: {
    laneX: 44,
    laneY: 146,
    laneWidth: 632,
    laneHeight: 96,
    stripeOpacity: 0.52,
    cubes: [
      { x: 112, y: 204, tone: "blue", scale: 0.8 },
      { x: 320, y: 150, tone: "blue", scale: 0.94 },
      { x: 552, y: 94, tone: "teal", scale: 0.82 },
    ],
  },
  dense: {
    laneX: 42,
    laneY: 132,
    laneWidth: 622,
    laneHeight: 112,
    stripeOpacity: 0.7,
    cubes: [
      { x: 76, y: 216, tone: "blue", scale: 0.74 },
      { x: 188, y: 188, tone: "blue", scale: 0.8 },
      { x: 302, y: 158, tone: "blue", scale: 0.84 },
      { x: 420, y: 128, tone: "blue", scale: 0.82 },
      { x: 558, y: 92, tone: "teal", scale: 0.78 },
    ],
  },
  offset: {
    laneX: 54,
    laneY: 120,
    laneWidth: 590,
    laneHeight: 104,
    stripeOpacity: 0.58,
    cubes: [
      { x: 132, y: 204, tone: "teal", scale: 0.84 },
      { x: 282, y: 162, tone: "blue", scale: 0.88 },
      { x: 444, y: 124, tone: "blue", scale: 0.9 },
      { x: 612, y: 84, tone: "teal", scale: 0.76 },
    ],
  },
  minimal: {
    laneX: 66,
    laneY: 138,
    laneWidth: 562,
    laneHeight: 92,
    stripeOpacity: 0.46,
    cubes: [
      { x: 164, y: 190, tone: "blue", scale: 0.88 },
      { x: 354, y: 142, tone: "blue", scale: 0.92 },
      { x: 546, y: 98, tone: "blue", scale: 0.84 },
    ],
  },
}

interface IsometricLineSceneProps {
  variant?: keyof typeof VARIANTS
  className?: string
}

function Lane({
  id,
  variant,
}: {
  id: string
  variant: SceneVariant
}) {
  const { laneX, laneY, laneWidth, laneHeight, stripeOpacity } = variant

  return (
    <g transform={`translate(${laneX} ${laneY}) rotate(-20)`}>
      <rect
        x="0"
        y="0"
        width={laneWidth}
        height={laneHeight}
        rx="3"
        fill="#f7f8f8"
        stroke="#e2e6e7"
        strokeWidth="1.5"
      />
      <rect
        x="0"
        y="0"
        width={laneWidth}
        height={laneHeight}
        rx="3"
        fill={`url(#${id}-laneStripes)`}
        opacity={stripeOpacity}
      />
      {Array.from({ length: 10 }).map((_, index) => {
        const x = index * 64 + 44
        return (
          <path
            key={x}
            d={`M ${x} 0 L ${x + 34} ${laneHeight}`}
        stroke="#d7ddde"
        strokeWidth="1.3"
        opacity="0.56"
          />
        )
      })}
    </g>
  )
}

function CubeBlock({ cube }: { cube: Cube }) {
  const tone = TONES[cube.tone]
  const scale = cube.scale ?? 1

  return (
    <g
      transform={`translate(${cube.x} ${cube.y}) scale(${scale})`}
      stroke={tone.stroke}
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M 0 26 L 40 8 L 80 26 L 40 46 Z" fill={tone.top} />
      <path d="M 0 26 L 40 46 L 40 94 L 0 72 Z" fill={tone.left} />
      <path d="M 80 26 L 40 46 L 40 94 L 80 72 Z" fill={tone.right} />
      <g stroke={tone.hatch} strokeWidth="1.2" opacity="0.74">
        {Array.from({ length: 11 }).map((_, index) => {
          const offset = index * 5
          return (
            <path key={`l-${offset}`} d={`M ${4 + offset} 30 L ${38 + offset} 49`} />
          )
        })}
        {Array.from({ length: 11 }).map((_, index) => {
          const offset = index * 5
          return (
            <path key={`r-${offset}`} d={`M ${76 - offset} 30 L ${42 - offset} 49`} />
          )
        })}
        {Array.from({ length: 10 }).map((_, index) => {
          const y = 50 + index * 4
          return <path key={`side-l-${y}`} d={`M 5 ${34 + index * 4} L 35 ${y}`} />
        })}
        {Array.from({ length: 10 }).map((_, index) => {
          const y = 50 + index * 4
          return <path key={`side-r-${y}`} d={`M 75 ${34 + index * 4} L 45 ${y}`} />
        })}
      </g>
      <path d="M 0 26 L 40 46 L 80 26" fill="none" opacity="0.85" />
      <path d="M 40 46 L 40 94" fill="none" opacity="0.85" />
    </g>
  )
}

export function IsometricLineScene({
  variant = "balanced",
  className,
}: IsometricLineSceneProps) {
  const scene = VARIANTS[variant]
  const id = `iso-${variant}`

  return (
    <svg
      viewBox="0 0 800 360"
      fill="none"
      className={cn("block h-full w-full", className)}
      role="img"
      aria-label={`Isometric warehouse line scene, ${variant} variant`}
    >
      <defs>
        <pattern
          id={`${id}-laneStripes`}
          width="46"
          height="46"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(34)"
        >
          <rect width="46" height="46" fill="#f6f7f7" />
          <rect x="0" y="0" width="18" height="46" fill="#eceff0" />
        </pattern>
      </defs>
      <rect x="2" y="2" width="796" height="356" rx="20" fill="#fbfbfa" />
      <path d="M 18 318 L 762 144" stroke="#eef1f1" strokeWidth="44" opacity="0.72" />
      <Lane id={id} variant={scene} />
      <path d="M 0 344 H 800" stroke="#d9dedf" strokeWidth="2" opacity="0.86" />
      {scene.cubes.map((cube, index) => (
        <CubeBlock key={`${cube.x}-${cube.y}-${index}`} cube={cube} />
      ))}
      <rect x="2" y="2" width="796" height="356" rx="20" stroke="#cfd5d6" strokeWidth="2" />
    </svg>
  )
}

export const isometricLineSceneVariants = Object.keys(VARIANTS) as Array<
  keyof typeof VARIANTS
>
