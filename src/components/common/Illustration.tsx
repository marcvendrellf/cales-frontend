import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { cn } from "@/lib/utils"

type ArtProps = { className?: string }

const STROKE = {
  stroke: "#f4f1ea",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

/** Generic empty-state art — a "signal file" in the friendly flat style. */
export function SignalFileArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 184" fill="none" className={className} aria-hidden="true">
      <g {...STROKE}>
        <path
          d="M78 30 H130 L160 60 V146 Q160 160 146 160 H78 Q64 160 64 146 V44 Q64 30 78 30 Z"
          fill="#79cfa6"
        />
        <path d="M130 30 H160 V60 Z" fill="#4f9e78" />
        <rect x="80" y="48" width="30" height="30" rx="8" fill="#16130f" />
        <path d="M86 63c2.2-2.6 4.4-2.6 6.6 0s4.4 2.6 6.6 0" stroke="#ffffff" strokeWidth={2.4} />
        <path d="M78 132 L96 120 L112 128 L130 106 L146 114" stroke="#e0b341" strokeWidth={3.2} />
      </g>
      <rect x="80" y="92" width="62" height="6" rx="3" fill="#f4f1ea" opacity="0.28" />
      <rect x="80" y="104" width="40" height="6" rx="3" fill="#f4f1ea" opacity="0.18" />
      <path d="M150 96 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 Z" fill="#e0b341" />
    </svg>
  )
}

interface IllustrationProps {
  /** A .lottie or Lottie JSON URL/path. When set, plays the animation; otherwise shows the default art. */
  src?: string
  className?: string
  loop?: boolean
  autoplay?: boolean
}

export function Illustration({
  src,
  className,
  loop = true,
  autoplay = true,
}: IllustrationProps) {
  if (src) {
    return <DotLottieReact src={src} loop={loop} autoplay={autoplay} className={cn(className)} />
  }
  return <SignalFileArt className={className} />
}
