import { MapPin, Route } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Map, type MapPoint } from "@/components/ui/map"
import type { Commodity } from "@/types"

const MAP_POINTS: Record<Commodity["id"], MapPoint[]> = {
  aluminium: [
    {
      id: "barcelona",
      label: "Damm Barcelona",
      description: "Packaging demand center and procurement destination.",
      coordinates: [2.1734, 41.3851],
      tone: "primary",
    },
    {
      id: "rotterdam",
      label: "Rotterdam aluminium flows",
      description: "European import and warehouse reference point.",
      coordinates: [4.4777, 51.9244],
      tone: "warning",
    },
    {
      id: "norway",
      label: "Nordic smelter supply",
      description: "Power-sensitive aluminium production region.",
      coordinates: [7.9956, 58.1467],
      tone: "positive",
    },
    {
      id: "shanghai",
      label: "China industrial demand",
      description: "Macro demand signal used in the current report.",
      coordinates: [121.4737, 31.2304],
      tone: "muted",
    },
  ],
  pet: [
    {
      id: "barcelona",
      label: "Damm Barcelona",
      description: "Bottle and packaging demand center.",
      coordinates: [2.1734, 41.3851],
      tone: "primary",
    },
    {
      id: "antwerp",
      label: "Antwerp polymer hub",
      description: "PET resin and feedstock logistics reference.",
      coordinates: [4.4025, 51.2194],
      tone: "warning",
    },
    {
      id: "istanbul",
      label: "Turkey import channel",
      description: "Regional resin import signal.",
      coordinates: [28.9784, 41.0082],
      tone: "positive",
    },
  ],
  energy: [
    {
      id: "barcelona",
      label: "Damm Barcelona",
      description: "Electricity and gas consumption center.",
      coordinates: [2.1734, 41.3851],
      tone: "primary",
    },
    {
      id: "ttf",
      label: "Dutch TTF gas benchmark",
      description: "European gas price reference.",
      coordinates: [5.2913, 52.1326],
      tone: "warning",
    },
    {
      id: "mibgas",
      label: "Iberian gas market",
      description: "Regional energy signal for Spain.",
      coordinates: [-3.7038, 40.4168],
      tone: "positive",
    },
  ],
  barley: [
    {
      id: "barcelona",
      label: "Damm Barcelona",
      description: "Malt and brewing demand center.",
      coordinates: [2.1734, 41.3851],
      tone: "primary",
    },
    {
      id: "france",
      label: "French barley belt",
      description: "Key European crop supply signal.",
      coordinates: [2.2137, 46.2276],
      tone: "positive",
    },
    {
      id: "ukraine",
      label: "Black Sea export risk",
      description: "Export availability and freight risk region.",
      coordinates: [31.1656, 48.3794],
      tone: "warning",
    },
  ],
}

export function ReportMaps({ c }: { c: Commodity }) {
  const points = MAP_POINTS[c.id]

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
