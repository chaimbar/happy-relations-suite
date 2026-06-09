import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Building2, UserCog, TrendingUp, Wallet, AlertTriangle, Calendar,
  ChevronLeft, Zap,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { he } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

function Dashboard() {
  const { isManager } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [emp, cli, proj, todayAssign, clientBalance, profitability, monthlyPay] = await Promise.all([
        supabase.from("employees").select("id, status"),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("sites").select("id, status, contract_price"),
        supabase.from("assignments").select("id, employee_id").eq("date", today),
        supabase.from("client_balance").select("balance_due"),
        supabase.from("site_profitability").select("profit_actual, profit_estimated, contract_price, status"),
        supabase.from("payments")
          .select("amount")
          .gte("payment_date", monthStart)
          .lte("payment_date", monthEnd),
      ]);

      const activeEmployees = emp.data?.filter((e) => e.status === "active") ?? [];
      const activeProjects = proj.data?.filter((p) => p.status === "active") ?? [];
      const todayEmployeeIds = new Set((todayAssign.data ?? []).map((a) => a.employee_id));
      const unassignedToday = activeEmployees.filter((e) => !todayEmployeeIds.has(e.id));

      const totalDebt = (clientBalance.data ?? []).reduce(
        (s, c) => s + Math.max(0, Number(c.balance_due)), 0
      );
      const openPayments = (clientBalance.data ?? []).filter((c) => Number(c.balance_due) > 0).length;

      const profRows = profitability.data ?? [];
      const totalRevenue = profRows.reduce((s, r) => s + Number(r.contract_price ?? 0), 0);
      const totalProfit = profRows.reduce(
        (s, r) => s + Number(r.profit_actual ?? r.profit_estimated ?? 0), 0
      );
      const lossProjects = profRows.filter(
        (r) => Number(r.profit_actual ?? r.profit_estimated ?? 0) < 0
      ).length;
      const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

      const monthlyCollected = (monthlyPay.data ?? []).reduce(
        (s, p) => s + Number(p.amount), 0
      );

      return {
        employees: emp.data?.length ?? 0,
        activeEmployees: activeEmployees.length,
        clients: cli.count ?? 0,
        projects: proj.data?.length ?? 0,
        activeProjects: activeProjects.length,
        totalRevenue,
        totalProfit,
        profitMargin,
        lossProjects,
        monthlyCollected,
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
        .select("id, name, status, contract_price, materials_cost")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as { id: string; name: string; status: string; contract_price: number; materials_cost: number }[];
    },
  });

  // Smart alerts — only shown when actionable
  const alerts: { text: string; to: string; color: "red" | "orange" }[] = [];
  if ((stats?.unassignedCount ?? 0) > 0)
    alerts.push({ text: `${stats!.unassignedCount} עובדים ללא שיבוץ היום`, to: "/scheduling", color: "orange" });
  if ((stats?.totalDebt ?? 0) > 0)
    alerts.push({ text: `${fmt(stats!.totalDebt)} חוב פתוח`, to: "/payments", color: "red" });
  if ((stats?.lossProjects ?? 0) > 0)
    alerts.push({ text: `${stats!.lossProjects} פרויקטים בהפסד`, to: "/profitability", color: "red" });

  // Recommended actions — dynamic, priority-ordered
  const actions: { label: string; to: string; urgency: "high" | "medium" | "low" }[] = [];
  if ((stats?.unassignedCount ?? 0) > 0)
    actions.push({ label: `שבץ ${stats!.unassignedCount} עובדים להיום`, to: "/scheduling", urgency: "high" });
  if ((stats?.totalDebt ?? 0) > 0)
    actions.push({ label: `גבה ${fmt(stats!.totalDebt)} מלקוחות`, to: "/payments", urgency: stats!.totalDebt > 5000 ? "high" : "medium" });
  if ((stats?.lossProjects ?? 0) > 0)
    actions.push({ label: `בדוק ${stats!.lossProjects} אתרים בהפסד`, to: "/profitability", urgency: "high" });
  if ((stats?.openPayments ?? 0) > 2 && (stats?.totalDebt ?? 0) === 0)
    actions.push({ label: `${stats!.openPayments} לקוחות עם יתרת חוב`, to: "/payments", urgency: "medium" });
  if (isManager && actions.length < 3)
    actions.push({ label: "בדוק רווחיות אתרים", to: "/profitability", urgency: "low" });
  if (actions.length < 3)
    actions.push({ label: "עדכן שיבוצים לשבוע הבא", to: "/scheduling", urgency: "low" });

  const urgencyStyle = {
    high: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
    medium: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
    low: "bg-muted/50 border-border text-foreground hover:bg-muted",
  };

  const alertStyle = {
    red: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
    orange: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold">דשבורד</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: he })}
        </p>
      </div>

      {/* Smart Alerts strip */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <Link key={i} to={a.to}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${alertStyle[a.color]}`}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{a.text}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* KPI grid */}
      <div className="stagger grid gap-3 grid-cols-2 lg:grid-cols-4">
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

        {isManager && (
        <Link to="/clients">
          <Card className="card-lift hover:shadow-md cursor-pointer">
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
        )}

        {isManager && (
        <Link to="/profitability">
          <Card className="card-lift hover:shadow-md cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">רווח נקי</p>
                  <p className={`font-display text-2xl font-bold mt-2 ${(stats?.totalProfit ?? 0) >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {stats ? fmt(stats.totalProfit) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">מרווח {stats?.profitMargin ?? 0}%</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shrink-0 text-white ${(stats?.totalProfit ?? 0) >= 0 ? "from-green-500 to-green-400" : "from-red-500 to-red-400"}`}>
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}
      </div>

      {/* Financial summary row */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {isManager && (
        <Link to="/payments">
          <Card className="card-lift hover:shadow-md cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 shrink-0">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">גבייה החודש</p>
                <p className="text-2xl font-bold text-green-600">{stats ? fmt(stats.monthlyCollected) : "—"}</p>
                <p className="text-xs text-muted-foreground">תשלומים שנכנסו</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {isManager && (
        <Link to="/payments">
          <Card className={`card-lift hover:shadow-md cursor-pointer ${(stats?.totalDebt ?? 0) > 0 ? "border-destructive/30" : ""}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 shrink-0">
                <AlertTriangle className={`h-6 w-6 ${(stats?.totalDebt ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">חובות פתוחים</p>
                <p className={`text-2xl font-bold ${(stats?.totalDebt ?? 0) > 0 ? "text-destructive" : "text-green-600"}`}>
                  {stats ? fmt(stats.totalDebt) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{stats?.openPayments ?? 0} לקוחות עם חוב</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        <Link to="/scheduling" className={isManager ? "" : "sm:col-span-3"}>
          <Card className="card-lift hover:shadow-md cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 shrink-0">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">שיבוצים היום</p>
                <p className="text-2xl font-bold">{stats?.todayAssignments ?? "—"}</p>
                {(stats?.unassignedCount ?? 0) > 0 ? (
                  <p className="text-xs text-orange-500">{stats!.unassignedCount} עובדים ללא שיבוץ</p>
                ) : (
                  <p className="text-xs text-green-600">כולם משובצים</p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recommended Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            פעולות מומלצות להיום
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.slice(0, 5).map((a, i) => (
            <Link key={i} to={a.to}>
              <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${urgencyStyle[a.urgency]}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold opacity-60">{i + 1}.</span>
                  <span className="text-sm font-medium">{a.label}</span>
                </div>
                <ChevronLeft className="h-4 w-4 shrink-0 opacity-50" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Today's assignments + Active projects */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              שיבוצים היום
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayList.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">אין שיבוצים להיום</p>
                <Link to="/scheduling">
                  <Button variant="outline" size="sm" className="mt-3">צור שיבוץ ראשון</Button>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-500" />
              אתרים פעילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">אין אתרים פעילים</p>
                <Link to="/projects">
                  <Button variant="outline" size="sm" className="mt-3">הוסף אתר ראשון</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((p) => {
                  const profit = Number(p.contract_price) - Number(p.materials_cost);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <span className="font-medium text-sm truncate flex-1 me-2">{p.name}</span>
                      {isManager ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{fmt(p.contract_price)}</span>
                        <span className={`text-xs font-semibold ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {fmt(profit)}
                        </span>
                      </div>
                      ) : (
                        <Badge variant="outline" className="text-xs shrink-0">פעיל</Badge>
                      )}
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
