import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, UserCog, TrendingUp, Wallet, AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [emp, cli, proj, todayAssign, payments] = await Promise.all([
        supabase.from("employees").select("id, status"),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("sites").select("id, status, total_price"),
        supabase.from("assignments").select("id, employee_id").eq("date", today),
        supabase.from("payments").select("total_amount, paid_amount, status"),
      ]);

      const activeEmployees = emp.data?.filter((e) => e.status === "active") ?? [];
      const activeProjects = proj.data?.filter((p) => p.status === "active") ?? [];
      const todayEmployeeIds = new Set((todayAssign.data ?? []).map((a) => a.employee_id));
      const unassignedToday = activeEmployees.filter((e) => !todayEmployeeIds.has(e.id));

      const totalDebt = (payments.data ?? []).reduce(
        (s, p) => s + (Number(p.total_amount) - Number(p.paid_amount)), 0
      );
      const openPayments = (payments.data ?? []).filter((p) => p.status !== "paid").length;
      const revenue = (proj.data ?? []).reduce((s, p) => s + Number(p.total_price || 0), 0);

      return {
        employees: emp.data?.length ?? 0,
        activeEmployees: activeEmployees.length,
        clients: cli.count ?? 0,
        projects: proj.data?.length ?? 0,
        activeProjects: activeProjects.length,
        revenue,
        todayAssignments: todayAssign.data?.length ?? 0,
        unassignedCount: unassignedToday.length,
        totalDebt,
        openPayments,
      };
    },
  });

  const { data: todayList = [] } = useQuery({
    queryKey: ["today-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, employees(full_name), sites(name)")
        .eq("date", today);
      if (error) throw error;
      return data as { id: string; employees: { full_name: string }; sites: { name: string } }[];
    },
  });

  const { data: recentProjects = [] } = useQuery({
    queryKey: ["recent-sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, name, status, total_price, materials_cost")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as { id: string; name: string; status: string; total_price: number; materials_cost: number }[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">דשבורד</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: he })}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Link to="/employees">
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">עובדים פעילים</p>
                  <p className="font-display text-3xl font-bold mt-2">{stats?.activeEmployees ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">מתוך {stats?.employees ?? 0}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-white shrink-0">
                  <UserCog className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/projects">
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">אתרים פעילים</p>
                  <p className="font-display text-3xl font-bold mt-2">{stats?.activeProjects ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">מתוך {stats?.projects ?? 0}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/clients">
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">לקוחות</p>
                  <p className="font-display text-3xl font-bold mt-2">{stats?.clients ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">סך הכל</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-400 text-white shrink-0">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/profitability">
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">הכנסה כוללת</p>
                  <p className="font-display text-2xl font-bold mt-2">
                    {stats ? fmt(stats.revenue) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">כל הפרויקטים</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-white shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Second row: alerts */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Link to="/payments">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${(stats?.totalDebt ?? 0) > 0 ? "border-destructive/30" : ""}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 shrink-0">
                <AlertTriangle className={`h-6 w-6 ${(stats?.totalDebt ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">חובות פתוחים</p>
                <p className={`text-2xl font-bold ${(stats?.totalDebt ?? 0) > 0 ? "text-destructive" : "text-green-600"}`}>
                  {stats ? fmt(stats.totalDebt) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{stats?.openPayments ?? 0} תשלומים ממתינים</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/scheduling">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 shrink-0">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">שיבוצים היום</p>
                <p className="text-2xl font-bold">{stats?.todayAssignments ?? "—"}</p>
                {(stats?.unassignedCount ?? 0) > 0 && (
                  <p className="text-xs text-orange-500">{stats?.unassignedCount} עובדים ללא שיבוץ</p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Today's assignments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              שיבוצים היום
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayList.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">אין שיבוצים להיום</p>
                <Link to="/scheduling" className="text-xs text-blue-500 hover:underline mt-1 block">
                  לוח שיבוץ ←
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {todayList.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40">
                    <span className="font-medium text-sm">{a.employees.full_name}</span>
                    <Badge variant="outline" className="text-xs">{a.sites.name}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-500" />
              אתרים פעילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">אין אתרים פעילים</p>
                <Link to="/projects" className="text-xs text-blue-500 hover:underline mt-1 block">
                  ניהול אתרים ←
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((p) => {
                  const profit = Number(p.total_price) - Number(p.materials_cost); // רווח גס — ללא עלות עובדים (לפרטים ← רווחיות)
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <span className="font-medium text-sm truncate flex-1 me-2">{p.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{fmt(p.total_price)}</span>
                        <span className={`text-xs font-semibold ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {fmt(profit)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
