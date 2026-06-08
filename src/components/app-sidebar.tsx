import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  Calendar,
  Wallet,
  TrendingUp,
  LogOut,
  HardHat,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "דשבורד", url: "/" as const, icon: LayoutDashboard },
  { title: "עובדים", url: "/employees" as const, icon: UserCog },
  { title: "לקוחות", url: "/clients" as const, icon: Users },
  { title: "אתרים", url: "/projects" as const, icon: Building2 },
];

const futureItems = [
  { title: "שיבוץ יומי", url: "/scheduling", icon: Calendar, soon: true },
  { title: "תשלומים", url: "/payments", icon: Wallet, soon: true },
  { title: "רווחיות", url: "/profitability", icon: TrendingUp, soon: true },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();

  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + "/");

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-display text-base font-bold leading-tight text-sidebar-foreground">
              ניהול אתרים
            </h2>
            <p className="text-[11px] text-sidebar-foreground/60">מערכת תפעולית</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>תפעול</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>בקרוב</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {futureItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton disabled tooltip={`${item.title} (בקרוב)`}>
                    <item.icon className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="opacity-60">{item.title}</span>
                    <span className="ms-auto text-[10px] text-accent group-data-[collapsible=icon]:hidden">
                      בקרוב
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-xs text-sidebar-foreground/70">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void signOut()}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-start"
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">התנתקות</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
