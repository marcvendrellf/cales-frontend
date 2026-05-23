/** Cales logo — three stacked wavy strokes. Inherits color via currentColor. */
export function WavesMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="Cales"
    >
      <g
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7c3-2.6 6-2.6 9 0s6 2.6 9 0" />
        <path d="M3 12c3-2.6 6-2.6 9 0s6 2.6 9 0" />
        <path d="M3 17c3-2.6 6-2.6 9 0s6 2.6 9 0" />
      </g>
    </svg>
  )
}
