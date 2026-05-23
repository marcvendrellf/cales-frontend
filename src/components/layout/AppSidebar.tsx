import { NavLink, useLocation } from "react-router-dom"
import { Boxes, LayoutDashboard, Shapes } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/layout/Logo"
import { SidebarUser } from "@/components/layout/SidebarUser"

const ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/elements", label: "Elements", icon: Boxes, end: false },
  { to: "/scene-lab", label: "Scene Lab", icon: Shapes, end: false },
]

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 px-3 py-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map((item) => {
                const isActive = item.end
                  ? pathname === item.to
                  : pathname.startsWith(item.to)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink to={item.to} end={item.end}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-4">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}
