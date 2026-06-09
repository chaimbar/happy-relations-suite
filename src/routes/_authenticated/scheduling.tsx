import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Calendar, Users, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { he } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/scheduling")({
  component: SchedulingPage,
});

type Employee = { id: string; full_name: string; status: string; daily_cost_estimated: number };
type Site = { id: string; name: string; status: string };
type Assignment = {
  id: string;
  employee_id: string;
  site_id: string;
  date: string;
  shift_type: "full" | "morning" | "afternoon";
  cost_estimated: number | null;
  employees: { full_name: string };
  sites: { name: string };
};

function SchedulingPage() {
  const qc = useQueryClient();
  const { isManager } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [addDialog, setAddDialog] = useState<{ open: boolean; date?: string }>({ open: false });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const from = format(weekStart, "yyyy-MM-dd");
      const to = format(addDays(weekStart, 6), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("assignments")
        .select("*, employees(full_name), sites(name)")
        .gte("date", from)
        .lte("date", to)
        .order("date");
      if (error) throw error;
      return data as Assignment[];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, status, daily_cost_estimated")
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data as Employee[];
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, name, status")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data as Site[];
    },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("שיבוץ הוסר");
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error("שגיאה", { description: e.message }),
  });

  const todayAssignments = assignments.filter((a) => isSameDay(new Date(a.date), new Date()));
  const unassignedToday = employees.filter(
    (e) => !assignments.some((a) => a.employee_id === e.id && isSameDay(new Date(a.date), new Date()))
  );

  return (
    <div className="space-y-5">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-base">
            {format(weekStart, "d MMM", { locale: he })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: he })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}>
            השבוע
          </Button>
        </div>
        {isManager && (
          <Button onClick={() => setAddDialog({ open: true })}>
            <Plus className="h-4 w-4" /> שיבוץ חדש
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">משובצים היום</p>
              <p className="text-xl font-bold">{todayAssignments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50">
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">לא משובצים היום</p>
              <p className="text-xl font-bold">{unassignedToday.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-50">
              <Building2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">אתרים פעילים</p>
              <p className="text-xl font-bold">{sites.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">שיבוצים השבוע</p>
              <p className="text-xl font-bold">{assignments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayAssignments = assignments.filter((a) => isSameDay(new Date(a.date), day));
          const isToday = isSameDay(day, new Date());
          const dateStr = format(day, "yyyy-MM-dd");
          return (
            <div
              key={dateStr}
              className={`rounded-xl border p-2 min-h-[160px] flex flex-col gap-1.5 ${
                isToday ? "border-blue-400 bg-blue-50/40" : "bg-white border-border/60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className={`text-xs font-semibold ${isToday ? "text-blue-600" : "text-muted-foreground"}`}>
                    {format(day, "EEE", { locale: he })}
                  </p>
                  <p className={`text-sm font-bold ${isToday ? "text-blue-700" : ""}`}>
                    {format(day, "d")}
                  </p>
                </div>
                {isManager && (
                  <button
                    onClick={() => setAddDialog({ open: true, date: dateStr })}
                    className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-blue-100 text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
              {dayAssignments.map((a) => (
                <div
                  key={a.id}
                  className="text-[11px] rounded-lg bg-white border border-border/60 px-2 py-1 flex items-start justify-between gap-1 group"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.employees.full_name}</p>
                    <p className="text-muted-foreground truncate">{a.sites.name}</p>
                  </div>
                  {isManager && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity shrink-0 mt-0.5">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>הסר שיבוץ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {a.employees.full_name} ← {a.sites.name}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteM.mutate(a.id)}>הסר</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Unassigned employees today */}
      {unassignedToday.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2 text-orange-600">עובדים ללא שיבוץ היום ({unassignedToday.length})</p>
            <div className="flex flex-wrap gap-2">
              {unassignedToday.map((e) => (
                <Badge key={e.id} variant="outline" className="text-xs">{e.full_name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <AddAssignmentDialog
        open={addDialog.open}
        defaultDate={addDialog.date}
        employees={employees}
        sites={sites}
        onClose={() => setAddDialog({ open: false })}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["assignments"] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }}
      />
    </div>
  );
}

function AddAssignmentDialog({
  open, defaultDate, employees, sites, onClose, onSuccess,
}: {
  open: boolean;
  defaultDate?: string;
  employees: Employee[];
  sites: Site[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    employee_id: "",
    site_id: "",
    date: defaultDate ?? format(new Date(), "yyyy-MM-dd"),
  });

  const saveM = useMutation({
    mutationFn: async () => {
      const emp = employees.find((e) => e.id === form.employee_id);
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("assignments").insert({
        employee_id: form.employee_id,
        site_id: form.site_id,
        date: form.date,
        cost_estimated: emp?.daily_cost_estimated ?? 0,
        user_id: u.user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("שיבוץ נוסף");
      onSuccess();
      onClose();
    },
    onError: (e: Error) => toast.error("שגיאה", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>שיבוץ חדש</DialogTitle>
          <DialogDescription>שבץ עובד לאתר בתאריך</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>תאריך</Label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>עובד</Label>
            <Select required value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="בחר עובד" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name} — ₪{e.daily_cost_estimated}/יום
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>אתר</Label>
            <Select required value={form.site_id} onValueChange={(v) => setForm({ ...form, site_id: v })}>
              <SelectTrigger><SelectValue placeholder="בחר אתר" /></SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={saveM.isPending || !form.employee_id || !form.site_id}>
              {saveM.isPending ? "שומר..." : "שבץ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
