import { useCommodities } from "@/api/hooks"
import { CommodityCard } from "@/components/common/CommodityCard"
import { Skeleton } from "@/components/ui/skeleton"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"

export function CommandCenter() {
  const { data, isLoading } = useCommodities()
  useBreadcrumbs([{ label: "Elements" }])

  return (
    <div className="space-y-8">
      <section>
        <h1 className="display-serif text-4xl sm:text-5xl">Elements</h1>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-lg" />
              ))
            : data?.map((c, i) => <CommodityCard key={c.id} c={c} index={i} />)}
        </div>
      </section>
    </div>
  )
}
