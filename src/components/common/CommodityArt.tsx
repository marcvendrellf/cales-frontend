import type { CommodityId } from "@/types"

type ArtProps = { className?: string }

const S = {
  stroke: "#f4f1ea",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

/** Aluminium — a beverage can (Damm's cans). */
export function AluminiumArt({ className }: ArtProps) {
  return (
    <img
      src="/alluminium.png"
      alt=""
      className={className}
      style={{ objectFit: "contain" }}
      aria-hidden="true"
      loading="lazy"
    />
  )
}

/** PET — a plastic bottle. */
export function PetArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <g {...S}>
        <rect x="42" y="10" width="12" height="9" rx="2" fill="#e0b341" />
        <path
          d="M44 19 V24 C44 29 35 30 35 42 V74 Q35 84 45 84 H51 Q61 84 61 74 V42 C61 30 52 29 52 24 V19"
          fill="#79cfa6"
        />
        <rect x="36" y="54" width="24" height="16" fill="#f4f1ea" opacity="0.22" stroke="none" />
      </g>
    </svg>
  )
}

/** Energy — a lightning bolt on a card. */
export function EnergyArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <g {...S}>
        <rect x="18" y="14" width="60" height="68" rx="14" fill="#79cfa6" />
        <path d="M52 24 L34 52 H46 L42 74 L62 44 H50 Z" fill="#e0b341" />
      </g>
    </svg>
  )
}

/** Barley — an ear of grain. */
export function BarleyArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <g {...S}>
        <path d="M48 86 V40" stroke="#e0b341" />
        <path d="M48 44 V26" stroke="#e0b341" strokeWidth={2.5} />
        <ellipse cx="41" cy="50" rx="6" ry="3.2" fill="#79cfa6" transform="rotate(-38 41 50)" />
        <ellipse cx="55" cy="50" rx="6" ry="3.2" fill="#79cfa6" transform="rotate(38 55 50)" />
        <ellipse cx="41" cy="60" rx="6" ry="3.2" fill="#79cfa6" transform="rotate(-38 41 60)" />
        <ellipse cx="55" cy="60" rx="6" ry="3.2" fill="#79cfa6" transform="rotate(38 55 60)" />
        <ellipse cx="41" cy="70" rx="6" ry="3.2" fill="#79cfa6" transform="rotate(-38 41 70)" />
        <ellipse cx="55" cy="70" rx="6" ry="3.2" fill="#79cfa6" transform="rotate(38 55 70)" />
      </g>
    </svg>
  )
}

export function CommodityArt({ id, className }: { id: CommodityId; className?: string }) {
  switch (id) {
    case "aluminium":
      return <AluminiumArt className={className} />
    case "pet":
      return <PetArt className={className} />
    case "energy":
      return <EnergyArt className={className} />
    case "barley":
      return <BarleyArt className={className} />
    default:
      return null
  }
}
