import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { WavesMark } from "@/components/layout/WavesMark"

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Go to overview"
      className={cn("flex items-center gap-2.5 transition-opacity hover:opacity-80", className)}
    >
      <WavesMark className="size-7 text-foreground" />
      <span className="font-serif text-2xl leading-none tracking-tight">Cales</span>
    </Link>
  )
}
