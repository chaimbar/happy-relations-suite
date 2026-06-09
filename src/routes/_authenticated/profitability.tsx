import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, Building2, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/profitability")({
  component: ProfitabilityPage,
});

type ProfRow = {
  id: string;
  name: string;
  client_id: string | null;
  total_price: number;
  materials_cost: number;
  status: string;
  estimated_labor_cost: number;
  estimated_profit: number;
  actual_labor_cost: number;
  actual_profit: number;
  labor_variance: number;
  total_collected: number;
  balance_due: number;
};

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

function ProfitabilityPage() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["profitability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_profitability")
        .select("*")
        .order("estimated_profit", { ascending: false });
      if (error) throw error;
      return data as ProfRow[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const activeRows = rows.filter((r) => r.status === "active");
  const totalRevenue = rows.reduce((s, r) => s + Number(r.total_price), 0);
  const totalProfit = rows.reduce((s, r) => s + Number(r.actual_profit ?? r.estimated_profit), 0);
  const totalLaborCost = rows.reduce((s, r) => s + Number(r.actual_labor_cost ?? r.estimated_labor_cost), 0);
  const totalMaterials = rows.reduce((s, r) => s + Number(r.materials_cost), 0);
  const totalDebt = rows.reduce((s, r) => s + Number(r.balance_due), 0);

  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const chartData = rows.slice(0, 8).map((r) => ({
    name: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
    הכנסה: Number(r.total_price),
    רווח: Number(r.estimated_profit),
    עלות: Number(r.estimated_labor_cost) + Number(r.materials_cost),
  }));

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">טוען נתוני רווחיות...</div>;
  }

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">הכנסה כוללת</p>
            </div>
            <p className="text-2xl font-bold">{fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground">רווח משוער</p>
            </div>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
              {fmt(totalProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">מרווח {profitMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">עלות עובדים</p>
            </div>
            <p className="text-2xl font-bold">{fmt(totalLaborCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-purple-500" />
              <p className="text-xs text-muted-foreground">עלות חומרים</p>
            </div>
            <p className="text-2xl font-bold">{fmt(totalMaterials)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">חובות פתוחים</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{fmt(totalDebt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">רווחיות לפי פרויקט</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "inherit" }} />
                <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{ fontFamily: "inherit", fontSize: 12, direction: "rtl" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "inherit" }} />
                <Bar dataKey="הכנסה" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="רווח" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry["רווח"] >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
                <Bar dataKey="עלות" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פירוט לפי פרויקט</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>אין פרויקטים עם נתוני רווחיות</p>
              <p className="text-xs mt-1">הוסף שיבוצים ותשלומים כדי לראות נתונים</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase">
                    <th className="text-right px-4 py-3 font-medium">אתר</th>
                    <th className="text-right px-4 py-3 font-medium">לקוח</th>
                    <th className="text-right px-4 py-3 font-medium">הכנסה</th>
                    <th className="text-right px-4 py-3 font-medium">עלות עובדים משוערת</th>
                    <th className="text-right px-4 py-3 font-medium">עלות בפועל</th>
                    <th className="text-right px-4 py-3 font-medium">סטייה</th>
                    <th className="text-right px-4 py-3 font-medium">חומרים</th>
                    <th className="text-right px-4 py-3 font-medium">רווח בפועל</th>
                    <th className="text-right px-4 py-3 font-medium">יתרת חוב</th>
                    <th className="text-right px-4 py-3 font-medium">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const actualProfit = Number(r.actual_profit ?? r.estimated_profit);
                    const profitPct = r.total_price > 0 ? Math.round((actualProfit / Number(r.total_price)) * 100) : 0;
                    const variance = Number(r.labor_variance ?? 0);
                    const statusLabel =
                      r.status === "active" ? "פעיל" :
                      r.status === "completed" ? "הסתיים" :
                      r.status === "paused" ? "מושהה" : "בוטל";
                    return (
                      <tr key={r.id} className={`border-b hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.client_id ? clientMap.get(r.client_id) ?? "—" : "—"}</td>
                        <td className="px-4 py-3">{fmt(r.total_price)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(r.estimated_labor_cost)}</td>
                        <td className="px-4 py-3">{fmt(r.actual_labor_cost ?? r.estimated_labor_cost)}</td>
                        <td className="px-4 py-3">
                          {variance !== 0 && (
                            <span className={`text-xs font-medium ${variance > 0 ? "text-destructive" : "text-green-600"}`}>
                              {variance > 0 ? "+" : ""}{fmt(variance)}
                            </span>
                          )}
                          {variance === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">{fmt(r.materials_cost)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${actualProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
                            {fmt(actualProfit)}
                          </span>
                          <span className="text-xs text-muted-foreground ms-1">({profitPct}%)</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={Number(r.balance_due) > 0 ? "text-destructive font-medium" : "text-green-600"}>
                            {fmt(r.balance_due)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.status === "active" ? "default" : r.status === "completed" ? "secondary" : "outline"} className="text-xs">
                            {statusLabel}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
