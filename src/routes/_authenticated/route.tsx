import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Search } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

function openCommandPalette() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

const ROUTE_TITLES: Record<string, string> = {
  "/": "דשבורד",
  "/employees": "עובדים",
  "/clients": "לקוחות",
  "/projects": "אתרים",
  "/scheduling": "שיבוץ יומי",
  "/attendance": "נוכחות",
  "/payments": "תשלומים",
  "/salaries": "שכר בפועל",
  "/materials": "חומרים",
  "/profitability": "רווחיות",
  "/pricing-simulator": "סימולטור תמחור",
  "/users": "ניהול משתמשים",
};

function AuthenticatedLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AuthProvider>
      <SidebarProvider>
        <div dir="rtl" className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <SidebarInset>
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <div key={path} className="animate-fade-up">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </div>
        <CommandPalette />
      </SidebarProvider>
    </AuthProvider>
  );
}

function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { roles } = useAuth();
  const title = ROUTE_TITLES[path] ?? "ניהול אתרים";
  const roleLabel =
    roles.includes("admin") ? "מנהל ראשי" :
    roles.includes("team_manager") ? "מנהל צוות" :
    roles.includes("employee") ? "עובד" : "";

  return (
    <header className="glass sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="font-display text-lg font-semibold">{title}</h1>

      <button
        onClick={openCommandPalette}
        className="ms-auto flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="חיפוש מהיר"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">חיפוש מהיר</span>
        <kbd className="hidden sm:inline rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border">⌘K</kbd>
      </button>

      {roleLabel && (
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground border border-accent/30">
          {roleLabel}
        </span>
      )}
    </header>
  );
}
