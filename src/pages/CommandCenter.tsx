import { useCommodities } from "@/api/hooks"
import { CommodityCard } from "@/components/common/CommodityCard"
import { RecommendationTimeline } from "@/components/common/RecommendationTimeline"
import {
  CommodityCardSkeleton,
  RecommendationTimelineSkeleton,
} from "@/components/common/PageSkeletons"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"

export function CommandCenter() {
  const { data, isLoading } = useCommodities()
  useBreadcrumbs([{ label: "Reports" }])

  return (
    <div className="space-y-8 pb-28">
      <section>
        <h1 className="display-serif text-4xl sm:text-5xl">Reports</h1>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <CommodityCardSkeleton key={i} />)
            : data?.map((c) => <CommodityCard key={c.id} c={c} />)}
        </div>
      </section>

      {isLoading ? (
        <RecommendationTimelineSkeleton />
      ) : (
        data && <RecommendationTimeline commodities={data} />
      )}
    </div>
  )
}
