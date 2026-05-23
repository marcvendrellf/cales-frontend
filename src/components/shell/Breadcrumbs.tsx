import { Fragment } from "react"
import { useBreadcrumb } from "@/components/shell/breadcrumb"

export function Breadcrumbs() {
  const { crumbs } = useBreadcrumb()

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-1 items-center gap-2 text-[13px]"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        const isLink = !isLast && crumb.onClick
        return (
          <Fragment key={`${i}-${crumb.label}`}>
            {i > 0 ? (
              <span className="shrink-0 text-muted-foreground/60" aria-hidden>
                ›
              </span>
            ) : null}
            {isLink ? (
              <button
                type="button"
                onClick={crumb.onClick}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </button>
            ) : (
              <span
                className={`truncate ${isLast ? "text-foreground" : "text-muted-foreground"}`}
                aria-current={isLast ? "page" : undefined}
              >
                {crumb.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
