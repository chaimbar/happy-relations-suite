import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  MapPin, Clock, Users, CalendarCheck, ExternalLink, Download,
  ChevronRight, ChevronLeft, AlertTriangle,
} from "lucide-react";
import { format, isToday, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { he } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { exportToCsv } from "@/lib/export-csv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
});

type CheckIn = {
  id: string;
  employee_id: string;
  site_id: string | null;
  checked_in_at: string;
  latitude: number | null;
  longitude: number | null;
  employees: { full_name: string } | null;
  sites: { name: string } | null;
};

function fmtDateTime(iso: string) {
  return format(new Date(iso), "EEEE d MMM, HH:mm", { locale: he });
}

function AttendancePage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">נוכחות</h2>
        <p className="text-sm text-muted-foreground mt-1">צ'ק-אין של עובדים באתרים — לפי שעה ומיקום</p>
      </div>

      <Tabs defaultValue="log">
        <TabsList className="mb-3">
          <TabsTrigger value="log">יומן צ'ק-אין</TabsTrigger>
          <TabsTrigger value="summary">סיכום חודשי</TabsTrigger>
        </TabsList>
        <TabsContent value="log" className="mt-0">
          <CheckInLog />
        </TabsContent>
        <TabsContent value="summary" className="mt-0">
          <MonthlySummary />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── יומן צ'ק-אין (תצוגה קיימת) ─────────────────────────────────────────────

function CheckInLog() {
  const [employeeFilter, setEmployeeFilter] = useState("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["check-ins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*, employees(full_name), sites(name)")
        .order("checked_in_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as CheckIn[];
    },
  });

  // Distinct employees for the filter dropdown
  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.employee_id) map.set(r.employee_id, r.employees?.full_name ?? "—");
    }
    return Array.from(map.entries());
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((r) => employeeFilter === "all" || r.employee_id === employeeFilter),
    [rows, employeeFilter],
  );

  const todayRows = rows.filter((r) => isToday(new Date(r.checked_in_at)));
  const todayEmployees = new Set(todayRows.map((r) => r.employee_id)).size;

  const handleExport = () => {
    exportToCsv(
      `נוכחות-${format(new Date(), "yyyy-MM-dd")}`,
      ["עובד", "אתר", "תאריך", "שעה", "קו רוחב", "קו אורך"],
      filtered.map((r) => [
        r.employees?.full_name ?? "",
        r.sites?.name ?? "",
        format(new Date(r.checked_in_at), "yyyy-MM-dd"),
        format(new Date(r.checked_in_at), "HH:mm"),
        r.latitude,
        r.longitude,
      ]),
    );
  };

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">טוען נתוני נוכחות...</div>;
  }

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 shrink-0">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">צ'ק-אין היום</p>
              <p className="text-2xl font-bold">{todayRows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">עובדים נוכחים היום</p>
              <p className="text-2xl font-bold">{todayEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 shrink-0">
              <Clock className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">סך רישומים</p>
              <p className="text-2xl font-bold">{rows.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">היסטוריית צ'ק-אין</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 ml-1" /> ייצוא Excel
            </Button>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="כל העובדים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל העובדים</SelectItem>
                {employeeOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
              <p>אין רישומי נוכחות עדיין</p>
              <p className="text-xs mt-1">שלח לעובדים קישור צ'ק-אין ממסך העובדים</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase">
                    <th className="text-right px-4 py-3 font-medium">עובד</th>
                    <th className="text-right px-4 py-3 font-medium">אתר</th>
                    <th className="text-right px-4 py-3 font-medium">תאריך ושעה</th>
                    <th className="text-right px-4 py-3 font-medium">מיקום</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} className={`border-b hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                      <td className="px-4 py-3 font-medium">{r.employees?.full_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        {r.sites?.name
                          ? <Badge variant="outline" className="text-xs">{r.sites.name}</Badge>
                          : <span className="text-xs text-muted-foreground">ללא שיבוץ</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(r.checked_in_at)}</td>
                      <td className="px-4 py-3">
                        {r.latitude != null && r.longitude != null ? (
                          <a
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <MapPin className="h-3.5 w-3.5" /> מפה <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── סיכום חודשי: ימי נוכחות מול ימי שיבוץ + עלות משוערת ─────────────────────

type MonthCheckIn = { employee_id: string; checked_in_at: string };
type MonthAssignment = { employee_id: string; date: string; cost_estimated: number | null };
type EmployeeLite = { id: string; full_name: string; daily_cost_estimated: number | null };

function MonthlySummary() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const from = format(month, "yyyy-MM-dd");
  const to = format(endOfMonth(month), "yyyy-MM-dd");

  const { data: checkIns = [] } = useQuery({
    queryKey: ["check-ins-month", from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("employee_id, checked_in_at")
        .gte("checked_in_at", `${from}T00:00:00`)
        .lte("checked_in_at", `${to}T23:59:59`);
      if (error) throw error;
      return data as MonthCheckIn[];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments-month", from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("employee_id, date, cost_estimated")
        .gte("date", from)
        .lte("date", to);
      if (error) throw error;
      return data as MonthAssignment[];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, daily_cost_estimated")
        .order("full_name");
      if (error) throw error;
      return data as EmployeeLite[];
    },
  });

  const rows = useMemo(() => {
    const presentDays = new Map<string, Set<string>>();
    for (const c of checkIns) {
      const day = c.checked_in_at.slice(0, 10);
      if (!presentDays.has(c.employee_id)) presentDays.set(c.employee_id, new Set());
      presentDays.get(c.employee_id)!.add(day);
    }
    const assignedDays = new Map<string, Set<string>>();
    const assignedCost = new Map<string, number>();
    for (const a of assignments) {
      if (!assignedDays.has(a.employee_id)) assignedDays.set(a.employee_id, new Set());
      assignedDays.get(a.employee_id)!.add(a.date);
      assignedCost.set(a.employee_id, (assignedCost.get(a.employee_id) ?? 0) + (a.cost_estimated ?? 0));
    }
    return employees
      .map((e) => {
        const present = presentDays.get(e.id)?.size ?? 0;
        const assigned = assignedDays.get(e.id)?.size ?? 0;
        return {
          id: e.id,
          name: e.full_name,
          present,
          assigned,
          gap: assigned - present,
          cost: assignedCost.get(e.id) ?? 0,
        };
      })
      .filter((r) => r.present > 0 || r.assigned > 0)
      .sort((a, b) => b.assigned - a.assigned);
  }, [checkIns, assignments, employees]);

  const totals = useMemo(
    () => rows.reduce(
      (acc, r) => ({ present: acc.present + r.present, assigned: acc.assigned + r.assigned, cost: acc.cost + r.cost }),
      { present: 0, assigned: 0, cost: 0 },
    ),
    [rows],
  );

  const handleExport = () => {
    exportToCsv(
      `סיכום-נוכחות-${format(month, "yyyy-MM")}`,
      ["עובד", "ימי נוכחות", "ימי שיבוץ", "פער", "עלות משוערת"],
      rows.map((r) => [r.name, r.present, r.assigned, r.gap, r.cost]),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm sm:text-base">
            {format(month, "MMMM yyyy", { locale: he })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            החודש
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="h-4 w-4 ml-1" /> ייצוא Excel
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">סך ימי נוכחות</p>
            <p className="text-2xl font-bold">{totals.present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">סך ימי שיבוץ</p>
            <p className="text-2xl font-bold">{totals.assigned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">עלות עבודה משוערת</p>
            <p className="text-2xl font-bold truncate">₪{totals.cost.toLocaleString("he-IL")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">נוכחות מול שיבוץ — {format(month, "MMMM yyyy", { locale: he })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarCheck className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
              <p>אין נתוני נוכחות או שיבוץ לחודש זה</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase">
                    <th className="text-right px-4 py-3 font-medium">עובד</th>
                    <th className="text-right px-4 py-3 font-medium">ימי נוכחות</th>
                    <th className="text-right px-4 py-3 font-medium">ימי שיבוץ</th>
                    <th className="text-right px-4 py-3 font-medium">פער</th>
                    <th className="text-right px-4 py-3 font-medium">עלות משוערת</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} className={`border-b hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3">{r.present}</td>
                      <td className="px-4 py-3">{r.assigned}</td>
                      <td className="px-4 py-3">
                        {r.gap > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" /> {r.gap}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{r.gap}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">₪{r.cost.toLocaleString("he-IL")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        פער = ימי שיבוץ ללא צ'ק-אין. עלות משוערת לפי snapshot של עלות יומית בשיבוצים.
      </p>
    </div>
  );
}
