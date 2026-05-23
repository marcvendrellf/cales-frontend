import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function Line({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3", className)} />
}

export function OverviewChartSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="min-w-0 flex-1 space-y-4 px-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <div className="flex justify-center gap-4 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="size-2 rounded-[2px]" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:w-[260px] lg:shrink-0 lg:border-l lg:border-border/70 lg:pl-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-[78px] shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NewsItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2.5 px-4 py-4 sm:px-5", className)}>
      <div className="flex items-center gap-2">
        <Skeleton className="size-1.5 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="ml-auto h-3 w-14" />
      </div>
      <Skeleton className="h-4 w-4/5 max-w-md" />
      <Line className="w-full" />
      <Line className="w-11/12" />
      <div className="flex justify-between gap-3 pt-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function NewsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/70">
      {Array.from({ length: count }).map((_, i) => (
        <NewsItemSkeleton key={i} />
      ))}
    </div>
  )
}

export function CommodityCardSkeleton() {
  return (
    <article className="flex min-h-[380px] flex-col overflow-hidden rounded-lg border border-border/80 bg-card/70">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-4">
        <Skeleton className="h-5 w-2/5" />
        <Line className="w-full" />
        <Line className="w-11/12" />
      </div>
    </article>
  )
}

export function RecommendationTimelineSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <section className="space-y-3">
      <Skeleton className="h-3 w-44" />
      <div className="overflow-hidden rounded-lg border border-border/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-4 px-4 py-3",
              i < rows - 1 && "border-b border-border/40",
            )}
          >
            <Skeleton className="h-3 w-14 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="size-3 shrink-0" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Line className="w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function CommodityDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-9 w-36" />
          <div className="flex justify-end gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded-md" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-[340px] w-full rounded-lg" />
          </Card>
          <Card className="p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-64" />
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, col) => (
                <div key={col} className="space-y-3">
                  <Skeleton className="h-3 w-28" />
                  {Array.from({ length: 3 }).map((_, row) => (
                    <div key={row} className="space-y-2 py-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card className="p-5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="mt-4 divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 py-3">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12 rounded-xs" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Line className="w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function SignalRowSkeleton() {
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
        <Skeleton className="h-4 w-3/4 max-w-lg" />
        <Line className="w-full" />
        <Line className="w-10/12" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  )
}

export function ReportGeneratingSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="space-y-4 p-8">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-12 w-2/5 max-w-xs" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="flex flex-wrap gap-8 pt-2">
          <Skeleton className="h-16 w-32" />
          <Skeleton className="h-12 w-28" />
          <Skeleton className="h-12 w-36" />
        </div>
        <Line className="w-full" />
        <Line className="w-11/12" />
      </div>
      <CardContent className="space-y-5 border-t border-border/70 p-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-36 w-full rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}
