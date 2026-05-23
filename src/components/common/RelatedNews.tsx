import { useState } from "react"
import { ArrowUpRight, ExternalLink, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fmtDate, reliabilityLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Driver, Evidence } from "@/types"

const reliabilityStyle = {
  high: "text-buy border-buy/30",
  medium: "text-hedge border-hedge/30",
  low: "text-monitor border-monitor/30",
} as const

function NewsPreviewDialog({
  item,
  open,
  onOpenChange,
}: {
  item: Evidence | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!item) return null

  const isCala = item.source.toLowerCase().includes("cala")
  const sourceUrl = item.url ?? sourceSearchUrl(item)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-2xl gap-0 p-7">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-md border border-border bg-background/50 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 pr-10">
          <span className={cn("text-sm font-semibold", isCala ? "text-cala" : "text-foreground")}>
            {item.source}
          </span>
          <span
            className={cn(
              "rounded-xs border px-1.5 py-px text-[10px] uppercase tracking-wide",
              reliabilityStyle[item.reliability],
            )}
          >
            {reliabilityLabel[item.reliability]}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{fmtDate(item.date)}</span>
        </div>

        <DialogHeader className="text-left">
          <DialogTitle className="display-serif mt-3 pr-10 text-left text-2xl leading-tight">
            {item.title}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription asChild>
          <p className="mt-4 text-base leading-8 text-foreground/85">{item.excerpt}</p>
        </DialogDescription>

        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
          Open in new tab
        </a>
      </DialogContent>
    </Dialog>
  )
}

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

      <NewsPreviewDialog
        item={selected}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  )
}
