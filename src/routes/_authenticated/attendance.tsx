import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Clock, Users, CalendarCheck, ExternalLink } from "lucide-react";
import { format, isToday } from "date-fns";
import { he } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">טוען נתוני נוכחות...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">נוכחות</h2>
        <p className="text-sm text-muted-foreground mt-1">צ'ק-אין של עובדים באתרים — לפי שעה ומיקום</p>
      </div>

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
