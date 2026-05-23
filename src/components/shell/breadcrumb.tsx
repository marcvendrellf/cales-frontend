import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Crumb = {
  label: string
  onClick?: () => void
}

type BreadcrumbCtx = {
  crumbs: Crumb[]
  setCrumbs: (next: Crumb[]) => void
}

const BreadcrumbContext = createContext<BreadcrumbCtx | null>(null)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) {
    throw new Error("useBreadcrumb must be used within <BreadcrumbProvider>")
  }
  return ctx
}

/** Set the page's breadcrumb trail on mount / when the labels change. */
export function useBreadcrumbs(crumbs: Crumb[]) {
  const { setCrumbs } = useBreadcrumb()
  const key = crumbs.map((c) => c.label).join(" / ")
  useEffect(() => {
    setCrumbs(crumbs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
