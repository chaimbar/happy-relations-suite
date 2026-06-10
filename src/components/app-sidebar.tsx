import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
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
  ShieldCheck,
  Package,
  DollarSign,
  KeyRound,
  Calculator,
  MapPin,
  History,
} from "lucide-react";

import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

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

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  /** Only admins + team managers may see this (financial / sensitive). */
  managerOnly?: boolean;
};

const mainItems: NavItem[] = [
  { title: "דשבורד", url: "/", icon: LayoutDashboard },
  { title: "עובדים", url: "/employees", icon: UserCog },
  { title: "לקוחות", url: "/clients", icon: Users, managerOnly: true },
  { title: "אתרים", url: "/projects", icon: Building2 },
];

const futureItems: NavItem[] = [
  { title: "שיבוץ יומי", url: "/scheduling", icon: Calendar },
  { title: "נוכחות", url: "/attendance", icon: MapPin },
  { title: "תשלומים", url: "/payments", icon: Wallet, managerOnly: true },
  { title: "שכר בפועל", url: "/salaries", icon: DollarSign, managerOnly: true },
  { title: "חומרים", url: "/materials", icon: Package },
  { title: "רווחיות", url: "/profitability", icon: TrendingUp, managerOnly: true },
  { title: "סימולטור תמחור", url: "/pricing-simulator", icon: Calculator, managerOnly: true },
  { title: "היסטוריית פעולות", url: "/activity-log", icon: History, managerOnly: true },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut, isAdmin, isManager } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);

  const canSee = (item: NavItem) => !item.managerOnly || isManager;
  const visibleMain = mainItems.filter(canSee);
  const visibleFuture = futureItems.filter(canSee);

  const isActive = (url: string) =>
    url === "/" ? currentPath === "/" : currentPath === url || currentPath.startsWith(url + "/");

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-amber-500 text-accent-foreground shrink-0 shadow-lg shadow-amber-500/20 ring-1 ring-white/10">
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
              {visibleMain.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="group/nav flex items-center gap-3 data-[status=active]:font-semibold">
                      <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover/nav:scale-110" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>ניהול</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleFuture.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="group/nav flex items-center gap-3 data-[status=active]:font-semibold">
                      <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover/nav:scale-110" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>מערכת</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/users")} tooltip="ניהול משתמשים">
                    <Link to="/users" className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>ניהול משתמשים</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-xs text-sidebar-foreground/70">{user?.email}</p>
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPwOpen(true)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-start"
        >
          <KeyRound className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">שינוי סיסמה</span>
        </Button>
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

      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </Sidebar>
  );
}
