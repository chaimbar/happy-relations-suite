import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
  "/payments": "תשלומים",
  "/profitability": "רווחיות",
};

function AuthenticatedLayout() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div dir="rtl" className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <SidebarInset>
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
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
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="font-display text-lg font-semibold">{title}</h1>
      {roleLabel && (
        <span className="ms-auto rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground border border-accent/30">
          {roleLabel}
        </span>
      )}
    </header>
  );
}
