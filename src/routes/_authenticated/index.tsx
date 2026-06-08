import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, UserCog, TrendingUp, ArrowLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [emp, cli, proj] = await Promise.all([
        supabase.from("employees").select("id, status", { count: "exact", head: false }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id, status, total_price", { count: "exact", head: false }),
      ]);
      const activeEmployees = emp.data?.filter((e) => e.status === "active").length ?? 0;
      const activeProjects = proj.data?.filter((p) => p.status === "active").length ?? 0;
      const revenue = proj.data?.reduce((s, p) => s + Number(p.total_price || 0), 0) ?? 0;
      return {
        employees: emp.data?.length ?? 0,
        activeEmployees,
        clients: cli.count ?? 0,
        projects: proj.data?.length ?? 0,
        activeProjects,
        revenue,
      };
    },
  });

  const cards = [
    {
      label: "עובדים פעילים",
      value: stats?.activeEmployees ?? "—",
      sub: `מתוך ${stats?.employees ?? 0}`,
      icon: UserCog,
      to: "/employees" as const,
      color: "from-primary to-primary/70",
    },
    {
      label: "אתרים פעילים",
      value: stats?.activeProjects ?? "—",
      sub: `מתוך ${stats?.projects ?? 0}`,
      icon: Building2,
      to: "/projects" as const,
      color: "from-accent to-accent/70",
    },
    {
      label: "לקוחות",
      value: stats?.clients ?? "—",
      sub: "סך הכל",
      icon: Users,
      to: "/clients" as const,
      color: "from-chart-3 to-chart-3/70",
    },
    {
      label: "הכנסה צפויה",
      value: stats ? `₪${stats.revenue.toLocaleString("he-IL")}` : "—",
      sub: "מכל הפרויקטים",
      icon: TrendingUp,
      to: "/projects" as const,
      color: "from-chart-4 to-chart-4/70",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">ברוכים הבאים 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">
          סקירה מהירה של הפעילות במערכת
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="group">
            <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {c.label}
                    </p>
                    <p className="font-display text-3xl font-bold mt-2">{c.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white shrink-0`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">השלבים הבאים בפיתוח</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NextStep n="2" title="שיבוץ יומי" desc="לוח שנה לשיבוץ עובדים לאתרים עם Drag & Drop" />
          <NextStep n="3" title="תשלומים וחובות" desc="מעקב תשלומים לפי לקוח ולפי אתר" />
          <NextStep n="4" title="עלויות עובדים מדויקות" desc="עלות משוערת בזמן אמת + עלות בפועל בסוף חודש" />
          <NextStep n="5" title="ניתוח רווחיות" desc="רווח משוער מול בפועל, סטיית עלות" />
          <NextStep n="6" title="אינטגרציה לשעון נוכחות" desc="חיבור ל-Time Watch לעדכון עלויות אונליין" />
          <NextStep n="7" title="AI הוצאות" desc="שליפת שדות אוטומטית ממסמכי הוצאות" />
        </CardContent>
      </Card>
    </div>
  );
}

function NextStep({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent-foreground font-bold text-sm shrink-0">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
    </div>
  );
}
