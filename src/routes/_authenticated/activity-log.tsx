import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { History, Download, Search } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { exportToCsv } from "@/lib/export-csv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/activity-log")({
  component: ActivityLogPage,
});

type AuditRow = {
  id: string;
  created_at: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_name: string | null;
};

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  INSERT: { label: "יצירה", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UPDATE: { label: "עדכון", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  DELETE: { label: "מחיקה", cls: "bg-red-50 text-red-700 border-red-200" },
};

const ENTITY_LABELS: Record<string, string> = {
  employees: "עובד",
  employee: "עובד",
  clients: "לקוח",
  client: "לקוח",
  sites: "אתר",
  site: "אתר",
  assignments: "שיבוץ",
  assignment: "שיבוץ",
  payments: "תשלום",
  payment: "תשלום",
  salary_records: "שכר",
  salaries: "שכר",
  materials: "חומר",
  material: "חומר",
  project_stages: "שלב פרויקט",
};

function normalizeAction(action: string): string {
  const a = action.toUpperCase();
  if (a.startsWith("CREAT") || a === "INSERT") return "INSERT";
  if (a.startsWith("UPDAT")) return "UPDATE";
  if (a.startsWith("DELET")) return "DELETE";
  return a;
}

function ActivityLogPage() {
  const { isManager, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    enabled: isManager,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, created_at, user_email, action, entity_type, entity_name")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as unknown as AuditRow[];
    },
  });

  const entityOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => ENTITY_LABELS[r.entity_type] ?? r.entity_type))),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const entityHe = ENTITY_LABELS[r.entity_type] ?? r.entity_type;
        if (entityFilter !== "all" && entityHe !== entityFilter) return false;
        if (actionFilter !== "all" && normalizeAction(r.action) !== actionFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const hay = `${r.entity_name ?? ""} ${r.user_email ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [rows, search, entityFilter, actionFilter],
  );

  const handleExport = () => {
    exportToCsv(
      `היסטוריית-פעולות-${format(new Date(), "yyyy-MM-dd")}`,
      ["תאריך", "שעה", "משתמש", "פעולה", "ישות", "שם"],
      filtered.map((r) => [
        format(new Date(r.created_at), "yyyy-MM-dd"),
        format(new Date(r.created_at), "HH:mm"),
        r.user_email ?? "",
        ACTION_LABELS[normalizeAction(r.action)]?.label ?? r.action,
        ENTITY_LABELS[r.entity_type] ?? r.entity_type,
        r.entity_name ?? "",
      ]),
    );
  };

  if (loading) return null;
  if (!isManager) return <Navigate to="/" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">היסטוריית פעולות</h2>
          <p className="text-sm text-muted-foreground mt-1">
            כל יצירה, עדכון ומחיקה במערכת — נרשם אוטומטית
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 ml-1" /> ייצוא Excel
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">יומן ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם / משתמש"
                className="h-8 w-48 pr-8 text-xs"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue placeholder="כל הישויות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הישויות</SelectItem>
                {entityOptions.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue placeholder="כל הפעולות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הפעולות</SelectItem>
                <SelectItem value="INSERT">יצירה</SelectItem>
                <SelectItem value="UPDATE">עדכון</SelectItem>
                <SelectItem value="DELETE">מחיקה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
              <p>אין פעולות להצגה</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase">
                    <th className="text-right px-4 py-3 font-medium">תאריך ושעה</th>
                    <th className="text-right px-4 py-3 font-medium">משתמש</th>
                    <th className="text-right px-4 py-3 font-medium">פעולה</th>
                    <th className="text-right px-4 py-3 font-medium">ישות</th>
                    <th className="text-right px-4 py-3 font-medium">שם</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const act = ACTION_LABELS[normalizeAction(r.action)];
                    return (
                      <tr key={r.id} className={`border-b hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(r.created_at), "d MMM yyyy, HH:mm", { locale: he })}
                        </td>
                        <td className="px-4 py-3 text-xs">{r.user_email ?? "—"}</td>
                        <td className="px-4 py-3">
                          {act ? (
                            <Badge variant="outline" className={`text-xs ${act.cls}`}>{act.label}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">{r.action}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">{ENTITY_LABELS[r.entity_type] ?? r.entity_type}</td>
                        <td className="px-4 py-3 font-medium">{r.entity_name ?? "—"}</td>
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
