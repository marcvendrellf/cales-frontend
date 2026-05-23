import { NavLink, useLocation } from "react-router-dom"
import { Boxes, ChevronRight, LayoutDashboard, RadioTower } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/layout/Logo"
import { SidebarUser } from "@/components/layout/SidebarUser"
import { COMMODITIES } from "@/data/mock"

const SIMPLE_GROUPS = [
  {
    label: "Workspace",
    items: [{ to: "/", label: "Overview", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Intelligence",
    items: [{ to: "/signals", label: "Signals", icon: RadioTower, end: false }],
  },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const reportsActive = pathname.startsWith("/reports") || pathname.startsWith("/c/")

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 px-3 py-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        {/* Workspace group */}
        <SidebarGroup>
          <SidebarGroupLabel className="h-6 px-2 font-mono text-[10px] uppercase tracking-wide text-sidebar-foreground/55">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <NavLink to="/" end>
                    <LayoutDashboard />
                    <span>Overview</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Procurement group with collapsible Reports submenu */}
        <SidebarGroup>
          <SidebarGroupLabel className="h-6 px-2 font-mono text-[10px] uppercase tracking-wide text-sidebar-foreground/55">
            Procurement
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen={reportsActive} className="group/collapsible">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={reportsActive}>
                    <NavLink to="/reports">
                      <Boxes />
                      <span>Reports</span>
                    </NavLink>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction>
                      <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {COMMODITIES.map((commodity) => (
                        <SidebarMenuSubItem key={commodity.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `/c/${commodity.id}`}
                          >
                            <NavLink to={`/c/${commodity.id}`}>
                              {commodity.name}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Intelligence group */}
        <SidebarGroup>
          <SidebarGroupLabel className="h-6 px-2 font-mono text-[10px] uppercase tracking-wide text-sidebar-foreground/55">
            Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/signals")}
                >
                  <NavLink to="/signals">
                    <RadioTower />
                    <span>Signals</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
