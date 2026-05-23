import { MapPin, Route } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Map } from "@/components/ui/map"
import { REPORT_MAP_POINTS } from "@/lib/report-map-points"
import type { Commodity } from "@/types"

export function ReportMaps({ c }: { c: Commodity }) {
  const points = REPORT_MAP_POINTS[c.id]

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-medium text-foreground">Geographic exposure</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Map view of the regions and logistics points referenced by the current report.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <Card className="overflow-hidden rounded-lg border-border/70 bg-card/40 p-0 shadow-none">
          <Map center={[12, 45]} zoom={3} points={points} />
        </Card>

        <Card className="gap-0 rounded-lg border-border/70 bg-card/40 p-5 shadow-none">
          <div className="flex items-center gap-2">
            <Route className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Report map layers</h3>
          </div>
          <div className="mt-4 space-y-3">
            {points.map((point) => (
              <div key={point.id} className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{point.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
