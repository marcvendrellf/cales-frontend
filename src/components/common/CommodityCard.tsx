import { Link } from "react-router-dom"
import { IsometricLineScene } from "@/components/common/IsometricLineScene"
import type { Commodity } from "@/types"

export function CommodityCard({ c }: { c: Commodity }) {
  return (
    <Link
      to={`/c/${c.id}`}
      className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <article className="flex h-full min-h-[380px] flex-col overflow-hidden rounded-lg border border-border/80 bg-card/70 text-foreground transition-colors duration-200 group-hover:border-foreground/25">
        <div className="relative overflow-hidden border-b border-border/80">
          <IsometricLineScene product={c.id} mode="dark" bleed className="aspect-[4/3]" />
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <h3 className="mt-0 text-lg font-semibold leading-tight tracking-normal text-foreground">
            {c.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {c.blurb}
          </p>
        </div>
      </article>
    </Link>
  )
}
