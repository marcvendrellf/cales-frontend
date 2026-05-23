import { useState } from "react"
import { ArrowUpRight, ExternalLink } from "lucide-react"
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
  driver,
  open,
  onOpenChange,
}: {
  item: Evidence | null
  driver?: Driver
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!item) return null

  const isCala = item.source.toLowerCase().includes("cala")
  const sourceUrl = item.url ?? sourceSearchUrl(item)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] min-h-[62vh] gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
        <div className="border-b border-border/70 bg-card/60 px-7 py-5">
          <DialogHeader className="gap-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isCala ? "text-cala" : "text-foreground",
                )}
              >
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
              <span className="font-mono text-[11px] text-muted-foreground">
                {fmtDate(item.date)}
              </span>
            </div>
            <DialogTitle className="display-serif pr-12 text-left text-3xl leading-tight">
              {item.title}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[1fr_260px]">
          <div className="space-y-6 px-7 py-6">
            <DialogDescription asChild>
              <p className="text-base leading-7 text-foreground/90">{item.excerpt}</p>
            </DialogDescription>

            {driver ? (
              <section className="rounded-lg border border-border/60 bg-background/35 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Linked market driver
                </p>
                <h3 className="mt-2 text-base font-medium text-foreground">{driver.label}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{driver.rationale}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-xs border border-border px-1.5 py-px">{driver.category}</span>
                  <span>{Math.round(driver.weight * 100)}% contribution</span>
                  <span>{driver.direction === "up" ? "Upward pressure" : "Downward pressure"}</span>
                </div>
              </section>
            ) : null}

            <section className="rounded-lg border border-border/60 bg-background/35 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Why this matters
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This source is included because it updates one of the commodity signals used in the
                current procurement call. Use it to validate the rationale before generating or sharing
                a report.
              </p>
            </section>
          </div>

          <aside className="border-t border-border/70 bg-background/25 px-7 py-6 md:border-l md:border-t-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Source details
            </p>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Publisher</dt>
                <dd className={cn("mt-1 text-sm font-medium", isCala ? "text-cala" : "text-foreground")}>
                  {item.source}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Reliability</dt>
                <dd className="mt-1 text-sm font-medium">{reliabilityLabel[item.reliability]}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Published</dt>
                <dd className="mt-1 font-mono text-sm">{fmtDate(item.date)}</dd>
              </div>
            </dl>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
            >
              <ExternalLink className="size-3.5" />
              Open in new tab
            </a>
          </aside>
        </div>
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
  const visible = limit != null ? items.slice(0, limit) : items
  const title = heading ?? (variant === "report" ? "Relevant news" : "Related news")
  const selectedDriver = selected
    ? drivers.find((driver) => driver.sourceId === selected.id)
    : undefined

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
            return (
              <div
                key={e.id}
                className={cn(
                  "group flex items-start gap-3 py-3 transition-colors",
                  "rounded-md hover:bg-foreground/[0.04]",
                  variant === "report" && "px-1",
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
                  onClick={() => setSelected(e)}
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
                  className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-80 transition hover:bg-background hover:text-foreground group-hover:opacity-100"
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
        driver={selectedDriver}
        open={selected != null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}
