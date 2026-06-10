import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Plus, Pencil, Trash2, Search, CheckCircle2, Circle, DollarSign, TrendingDown, Users,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, subMonths } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/salaries")({
  component: SalariesPage,
});

type Employee = { id: string; full_name: string; status: string; daily_cost_estimated: number };
type SiteLite = { id: string; name: string };
type SalaryRecord = {
  id: string;
  employee_id: string;
  site_id: string | null;
  month: string;
  amount_actual: number;
  is_paid: boolean;
  notes: string | null;
};

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

function monthLabel(d: string) {
  const dt = new Date(d);
  return format(dt, "MM/yyyy");
}

function SalariesPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [empFilter, setEmpFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryRecord | null>(null);

  const { data: employees = [], isLoading: empLoad } = useQuery({
    queryKey: ["employees-all-sal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees").select("id, full_name, status, daily_cost_estimated").order("full_name");
      if (error) throw error;
      return data as Employee[];
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites-lite-sal"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name").order("name");
      return (data ?? []) as SiteLite[];
    },
  });

  const { data: records = [], isLoading: recLoad } = useQuery({
    queryKey: ["salary-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_records").select("*").order("month", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data as SalaryRecord[];
    },
  });

  const empMap = new Map(employees.map((e) => [e.id, e.full_name]));
  const siteMap = new Map(sites.map((s) => [s.id, s.name]));

  const availableMonths = useMemo(() => {
    const months = new Set(records.map((r) => r.month.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [records]);

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("רשומה נמחקה");
      qc.invalidateQueries({ queryKey: ["salary-records"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  const togglePaidM = useMutation({
    mutationFn: async ({ id, is_paid }: { id: string; is_paid: boolean }) => {
      const { error } = await supabase.from("salary_records").update({ is_paid }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary-records"] }),
    onError: (e: Error) => toast.error("עדכון נכשל", { description: e.message }),
  });

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (empFilter !== "all" && r.employee_id !== empFilter) return false;
      if (monthFilter !== "all" && !r.month.startsWith(monthFilter)) return false;
      if (search.trim()) {
        const empName = empMap.get(r.employee_id) ?? "";
        if (!empName.toLowerCase().includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, empFilter, monthFilter, search, empMap]);

  const totalActual = filtered.reduce((s, r) => s + Number(r.amount_actual), 0);
  const totalUnpaid = filtered.filter((r) => !r.is_paid).reduce((s, r) => s + Number(r.amount_actual), 0);

  // Group by month for tab view
  const byMonth = useMemo(() => {
    const map = new Map<string, SalaryRecord[]>();
    for (const r of records) {
      const m = r.month.slice(0, 7);
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(r);
    }
    return map;
  }, [records]);

  const isLoading = empLoad || recLoad;

  // Suggest months for filter
  const recentMonths = Array.from({ length: 6 }, (_, i) =>
    format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM")
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">שכר בפועל</h1>
            <p className="text-xs text-muted-foreground">רישום משכורות אמיתיות לעובדים</p>
          </div>
        </div>
        {isManager && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> הוסף רשומת שכר
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">עובדים פעילים</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold tabular-nums truncate">
              {employees.filter((e) => e.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">סך שכר (סינון)</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold tabular-nums truncate">{fmt(totalActual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Circle className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">לא שולם</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold tabular-nums truncate text-destructive">{fmt(totalUnpaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground">שולם</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold tabular-nums truncate text-green-600">{fmt(totalActual - totalUnpaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש עובד..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pe-3 pr-9 h-8 text-sm"
          />
        </div>
        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="כל העובדים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העובדים</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="כל החודשים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל החודשים</SelectItem>
            {recentMonths.map((m) => (
              <SelectItem key={m} value={m}>{m.slice(5, 7)}/{m.slice(0, 4)}</SelectItem>
            ))}
            {availableMonths.filter((m) => !recentMonths.includes(m)).map((m) => (
              <SelectItem key={m} value={m}>{m.slice(5, 7)}/{m.slice(0, 4)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(empFilter !== "all" || monthFilter !== "all" || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => { setSearch(""); setEmpFilter("all"); setMonthFilter("all"); }}
          >
            נקה סינון
          </Button>
        )}
      </div>

      {/* Table */}
      <Tabs defaultValue="list" dir="rtl">
        <TabsList>
          <TabsTrigger value="list">רשימה</TabsTrigger>
          <TabsTrigger value="by-month">לפי חודש</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">אין רשומות שכר</p>
                {isManager && (
                  <Button className="mt-4" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4" /> הוסף רשומה ראשונה
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase">
                        <th className="text-right px-4 py-3 font-medium">עובד</th>
                        <th className="text-right px-4 py-3 font-medium">חודש</th>
                        <th className="text-right px-4 py-3 font-medium">אתר</th>
                        <th className="text-right px-4 py-3 font-medium">סכום</th>
                        <th className="text-right px-4 py-3 font-medium">שולם</th>
                        <th className="text-right px-4 py-3 font-medium">הערות</th>
                        {isManager && <th className="px-4 py-3" />}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={r.id} className={`border-b hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                          <td className="px-4 py-3 font-medium">{empMap.get(r.employee_id) ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{monthLabel(r.month)}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{r.site_id ? siteMap.get(r.site_id) ?? "—" : "—"}</td>
                          <td className="px-4 py-3 font-semibold">{fmt(r.amount_actual)}</td>
                          <td className="px-4 py-3">
                            <button
                              disabled={!isManager}
                              onClick={() => isManager && togglePaidM.mutate({ id: r.id, is_paid: !r.is_paid })}
                              className="flex items-center gap-1"
                            >
                              {r.is_paid
                                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                                : <Circle className="h-4 w-4 text-muted-foreground" />}
                              <span className={`text-xs ${r.is_paid ? "text-green-600" : "text-muted-foreground"}`}>
                                {r.is_paid ? "שולם" : "לא שולם"}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">
                            {r.notes ?? "—"}
                          </td>
                          {isManager && (
                            <td className="px-4 py-3">
                              <div className="flex gap-1 justify-end">
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={() => { setEditing(r); setDialogOpen(true); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                {isAdmin && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-7 w-7">
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>למחוק רשומת שכר?</AlertDialogTitle>
                                        <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteM.mutate(r.id)}>מחק</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/20">
                        <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">סה"כ</td>
                        <td className="px-4 py-2.5 font-bold">{fmt(totalActual)}</td>
                        <td colSpan={isManager ? 3 : 2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="by-month" className="mt-4 space-y-3">
          {byMonth.size === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">אין נתונים</CardContent>
            </Card>
          ) : (
            Array.from(byMonth.entries()).map(([month, recs]) => {
              const monthTotal = recs.reduce((s, r) => s + Number(r.amount_actual), 0);
              const unpaid = recs.filter((r) => !r.is_paid).reduce((s, r) => s + Number(r.amount_actual), 0);
              return (
                <Card key={month}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{month.slice(5, 7)}/{month.slice(0, 4)}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-muted-foreground">{recs.length} עובדים</span>
                        <span className="font-semibold">{fmt(monthTotal)}</span>
                        {unpaid > 0 && <span className="text-destructive">לא שולם: {fmt(unpaid)}</span>}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-1">
                      {recs.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-b-0">
                          <div className="flex items-center gap-3">
                            <button
                              disabled={!isManager}
                              onClick={() => isManager && togglePaidM.mutate({ id: r.id, is_paid: !r.is_paid })}
                            >
                              {r.is_paid
                                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                                : <Circle className="h-4 w-4 text-muted-foreground" />}
                            </button>
                            <span className={r.is_paid ? "line-through text-muted-foreground" : "font-medium"}>
                              {empMap.get(r.employee_id) ?? "—"}
                            </span>
                            {r.site_id && (
                              <Badge variant="outline" className="text-[10px]">{siteMap.get(r.site_id)}</Badge>
                            )}
                          </div>
                          <span className={`font-semibold ${r.is_paid ? "text-muted-foreground" : ""}`}>
                            {fmt(r.amount_actual)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <SalaryDialog
        open={dialogOpen}
        editing={editing}
        employees={employees}
        sites={sites}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
      />
    </div>
  );
}

// ── Salary Dialog ─────────────────────────────────────────────────────────────

function SalaryDialog({
  open, editing, employees, sites, onClose,
}: {
  open: boolean;
  editing: SalaryRecord | null;
  employees: Employee[];
  sites: SiteLite[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const thisMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [form, setForm] = useState({
    employee_id: editing?.employee_id ?? "",
    site_id: editing?.site_id ?? "",
    month: editing?.month ?? thisMonth,
    amount_actual: editing?.amount_actual != null ? editing.amount_actual.toString() : "",
    is_paid: editing?.is_paid ?? false,
    notes: editing?.notes ?? "",
  });

  const saveM = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        employee_id: form.employee_id,
        site_id: form.site_id || null,
        month: form.month,
        amount_actual: Number(form.amount_actual),
        is_paid: form.is_paid,
        notes: form.notes.trim() || null,
        user_id: u.user!.id,
      };
      if (editing) {
        const { error } = await supabase.from("salary_records").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("salary_records").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "שכר עודכן" : "שכר נוסף");
      qc.invalidateQueries({ queryKey: ["salary-records"] });
      onClose();
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "עריכת שכר" : "רשומת שכר חדשה"}</DialogTitle>
          <DialogDescription>רישום שכר בפועל לעובד עבור חודש</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>עובד *</Label>
            <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="בחר עובד" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name} {e.status !== "active" ? "(לא פעיל)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>חודש *</Label>
              <Input
                type="month"
                required
                value={form.month.slice(0, 7)}
                onChange={(e) => setForm({ ...form, month: e.target.value + "-01" })}
              />
            </div>
            <div className="space-y-2">
              <Label>סכום שכר (₪) *</Label>
              <Input
                type="number"
                min="0"
                step="any"
                required
                placeholder="0"
                value={form.amount_actual}
                onChange={(e) => setForm({ ...form, amount_actual: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>אתר (אופציונלי)</Label>
            <Select value={form.site_id || "_none"} onValueChange={(v) => setForm({ ...form, site_id: v === "_none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="ללא אתר ספציפי" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">ללא אתר</SelectItem>
                {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is-paid"
              checked={form.is_paid}
              onCheckedChange={(c) => setForm({ ...form, is_paid: !!c })}
            />
            <Label htmlFor="is-paid" className="cursor-pointer">שכר שולם</Label>
          </div>
          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={saveM.isPending || !form.employee_id || !form.amount_actual}>
              {saveM.isPending ? "שומר..." : editing ? "עדכן" : "הוסף"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
