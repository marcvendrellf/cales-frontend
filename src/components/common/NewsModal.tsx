import { ExternalLink, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fmtDate, impactColor, reliabilityLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Evidence, MarketSignal, Reliability, SignalImpact } from "@/types"

/** Normalized news payload so Overview (signals) and General info (evidence)
 *  share one modal. */
export type NewsDetail = {
  source: string
  reliability: Reliability
  date: string
  title: string
  body: string
  url: string
  impact?: SignalImpact
  category?: string
  taggedTo?: string
}

function searchUrl(source: string, title: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${source} ${title}`)}`
}

export function evidenceToNews(e: Evidence): NewsDetail {
  return {
    source: e.source,
    reliability: e.reliability,
    date: e.date,
    title: e.title,
    body: e.excerpt,
    url: e.url ?? searchUrl(e.source, e.title),
  }
}

export function signalToNews(s: MarketSignal): NewsDetail {
  return {
    source: s.source,
    reliability: s.reliability,
    date: s.time,
    title: s.headline,
    body: s.detail,
    url: searchUrl(s.source, s.headline),
    impact: s.impact,
    category: s.category,
    taggedTo: s.commodityId === "macro" ? "macro exposure" : s.commodityId,
  }
}

const reliabilityStyle = {
  high: "text-buy border-buy/30",
  medium: "text-hedge border-hedge/30",
  low: "text-monitor border-monitor/30",
} as const

export function NewsModal({
  news,
  open,
  onOpenChange,
}: {
  news: NewsDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!news) return null
  const isCala = news.source.toLowerCase().includes("cala")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-[88vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 inline-flex size-8 items-center justify-center rounded-md border border-border bg-background/50 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Compact header */}
        <DialogHeader className="gap-1.5 space-y-0 border-b border-border/70 bg-card/50 px-7 py-3.5 text-left">
          <div className="flex flex-wrap items-center gap-2 pr-10">
            <span className={cn("text-sm font-semibold", isCala ? "text-cala" : "text-foreground")}>
              {news.source}
            </span>
            <span
              className={cn(
                "rounded-xs border px-1.5 py-px text-[10px] uppercase tracking-wide",
                reliabilityStyle[news.reliability],
              )}
            >
              {reliabilityLabel[news.reliability]}
            </span>
            {news.impact ? (
              <span className={cn("font-mono text-[11px] uppercase", impactColor[news.impact])}>
                {news.impact}
              </span>
            ) : null}
            <span className="font-mono text-[11px] text-muted-foreground">{fmtDate(news.date)}</span>
          </div>
          <DialogTitle className="display-serif pr-10 text-left text-xl leading-tight">
            {news.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5 px-7 py-6">
            <DialogDescription asChild>
              <p className="text-base leading-7 text-foreground/90">{news.body}</p>
            </DialogDescription>

            {news.category ? (
              <section className="rounded-lg border border-border/60 bg-background/35 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Market signal
                </p>
                <h3 className="mt-2 text-lg font-medium text-foreground">{news.category}</h3>
                {news.taggedTo ? (
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Tagged to {news.taggedTo}
                    {news.impact ? `, currently classified as ${news.impact}` : ""}.
                  </p>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-lg border border-border/60 bg-background/35 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Why this matters
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                This source feeds the market signals behind the recommendation. Use it to gauge
                whether the latest pressure is bullish, bearish, or neutral before opening a
                commodity report.
              </p>
            </section>
          </div>

          <aside className="border-t border-border/70 bg-background/25 px-7 py-6 md:border-l md:border-t-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Source details
            </p>
            <dl className="mt-3 space-y-3.5">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Publisher</dt>
                <dd className={cn("mt-1 text-sm font-medium", isCala ? "text-cala" : "text-foreground")}>
                  {news.source}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Reliability</dt>
                <dd className="mt-1 text-sm font-medium">{reliabilityLabel[news.reliability]}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Published</dt>
                <dd className="mt-1 font-mono text-sm">{fmtDate(news.date)}</dd>
              </div>
            </dl>
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
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
