import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { CommandPalette } from "@/components/command-palette/CommandPalette"
import { AskBar } from "@/components/command-palette/AskBar"
import { BreadcrumbProvider } from "@/components/shell/breadcrumb"
import { Breadcrumbs } from "@/components/shell/Breadcrumbs"

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="relative h-svh min-w-0 overflow-hidden">
          <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumbs />
          </header>
          <main className="flex-1 overflow-y-auto px-6 py-8 pb-36">
            <div className="mx-auto w-full max-w-[1240px]">
              <Outlet />
            </div>
          </main>
          <AskBar />
        </SidebarInset>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </SidebarProvider>
    </BreadcrumbProvider>
  )
}
