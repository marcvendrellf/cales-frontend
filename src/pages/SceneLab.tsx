import { IsometricLineScene, isometricLineSceneVariants } from "@/components/common/IsometricLineScene"
import { useBreadcrumbs } from "@/components/shell/breadcrumb"

const LABELS: Record<(typeof isometricLineSceneVariants)[number], string> = {
  balanced: "Balanced",
  sparse: "Sparse",
  dense: "Dense",
  offset: "Offset",
  minimal: "Minimal",
}

export function SceneLab() {
  useBreadcrumbs([{ label: "Scene Lab" }])

  return (
    <div className="space-y-5 pb-28">
      <section>
        <h1 className="display-serif text-4xl sm:text-5xl">Scene Lab</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Five one-line isometric scene options matching the provided reference style.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {isometricLineSceneVariants.map((variant) => (
          <article
            key={variant}
            className="overflow-hidden rounded-lg border border-border/70 bg-card/40"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <h2 className="text-sm font-medium">{LABELS[variant]}</h2>
              <span className="font-mono text-xs text-muted-foreground">{variant}</span>
            </div>
            <div className="bg-[#f7f7f5]">
              <IsometricLineScene variant={variant} className="aspect-[20/9]" />
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
