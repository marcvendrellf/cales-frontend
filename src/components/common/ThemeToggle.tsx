import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

function useThemeMode() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === "dark"
  const toggle = () => setTheme(isDark ? "light" : "dark")
  return { mounted, isDark, toggle }
}

/** Compact icon-only toggle (e.g. for the report viewer top bar). */
export function ThemeToggle({
  className,
  strokeWidth = 2.25,
}: {
  className?: string
  strokeWidth?: number
}) {
  const { isDark, toggle } = useThemeMode()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex items-center justify-center text-foreground transition hover:opacity-70",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-7" strokeWidth={strokeWidth} />
      ) : (
        <Moon className="size-7" strokeWidth={strokeWidth} />
      )}
    </button>
  )
}

/** Sidebar row toggle, styled to match the other sidebar menu buttons. */
export function SidebarThemeToggle() {
  const { isDark, toggle } = useThemeMode()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={toggle} aria-label="Toggle theme">
          {isDark ? <Sun /> : <Moon />}
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
