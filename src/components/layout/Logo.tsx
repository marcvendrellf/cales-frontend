import { cn } from "@/lib/utils"
import { WavesMark } from "@/components/layout/WavesMark"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <WavesMark className="size-7 text-foreground" />
      <span className="font-serif text-2xl leading-none tracking-tight">Cales</span>
    </div>
  )
}
