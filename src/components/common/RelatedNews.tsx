import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { NewsModal, evidenceToNews } from "@/components/common/NewsModal"
import { fmtDate, reliabilityLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Driver, Evidence } from "@/types"

const reliabilityStyle = {
  high: "text-buy border-buy/30",
  medium: "text-hedge border-hedge/30",
  low: "text-monitor border-monitor/30",
} as const

function sourceSearchUrl(item: Evidence) {
  const query = `${item.source} ${item.title}`
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

interface Props {
  items: Evidence[]
  drivers?: Driver[]
  className?: string
  limit?: number
  variant?: "default" | "report"
  /** Report uses “Relevant news”; General information uses “Related news”. */
  heading?: string
}

export function RelatedNews({
  items,
  drivers = [],
  className,
  limit,
  variant = "default",
  heading,
}: Props) {
  const [selected, setSelected] = useState<Evidence | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const visible = limit != null ? items.slice(0, limit) : items
  const title = heading ?? (variant === "report" ? "Relevant news" : "Related news")

  const header =
    variant === "report" ? (
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {title}
        <span className="ml-2 font-mono normal-case tracking-normal text-muted-foreground/60">
          {items.length} items
        </span>
      </p>
    ) : (
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
    )

  return (
    <>
      <div className={className}>
        <div className={variant === "report" ? "mb-3" : "mb-1"}>{header}</div>
        {variant === "default" ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Market signals and source notes for this element.
          </p>
        ) : null}
        <div className="divide-y divide-border">
          {visible.map((e) => {
            const isCala = e.source.toLowerCase().includes("cala")
            const driver = drivers.find((item) => item.sourceId === e.id)
            const openPreview = () => {
              setSelected(e)
              setPreviewOpen(true)
            }
            return (
              <div
                key={e.id}
                className={cn(
                  "group relative -mx-5 flex items-start gap-3 px-5 py-3 transition-colors",
                  "hover:bg-foreground/[0.05]",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    e.reliability === "high"
                      ? "bg-buy"
                      : e.reliability === "medium"
                        ? "bg-hedge"
                      : "bg-monitor",
                  )}
                />
                <button
                  type="button"
                  onClick={openPreview}
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCala ? "text-cala" : "text-foreground",
                      )}
                    >
                      {e.source}
                    </span>
                    <span
                      className={cn(
                        "rounded-xs border px-1.5 py-px text-[10px] uppercase tracking-wide",
                        reliabilityStyle[e.reliability],
                      )}
                    >
                      {reliabilityLabel[e.reliability]}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {fmtDate(e.date)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm font-medium text-foreground/90 line-clamp-1">
                    {e.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                    {e.excerpt}
                  </span>
                  {driver ? (
                    <span className="mt-2 block text-[11px] text-muted-foreground/80">
                      Driver: {driver.label} · {Math.round(driver.weight * 100)}% contribution
                    </span>
                  ) : null}
                </button>
                <a
                  href={sourceSearchUrl(e)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${e.title} in a new tab`}
                  className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <ArrowUpRight className="size-4" />
                </a>
              </div>
            )
          })}
        </div>
      </div>

      <NewsModal
        news={selected ? evidenceToNews(selected) : null}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  )
}
