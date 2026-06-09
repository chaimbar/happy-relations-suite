import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Calendar, Users, Building2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { he } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/scheduling")({
  component: SchedulingPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Employee = { id: string; full_name: string; status: string; daily_cost_estimated: number };
type Site = { id: string; name: string; status: string };
type Assignment = {
  id: string;
  employee_id: string;
  site_id: string;
  date: string;
  shift_type: "full" | "morning" | "afternoon";
  cost_estimated: number | null;
  notes: string | null;
  employees: { full_name: string };
  sites: { name: string };
};

type ColorSwatch = { bg: string; border: string; text: string; badge: string };

// ─── Color palette (consistent per employee) ─────────────────────────────────

const EMP_COLORS: ColorSwatch[] = [
  { bg: "bg-blue-100",   border: "border-blue-300",   text: "text-blue-800",   badge: "bg-blue-400"   },
  { bg: "bg-emerald-100",border: "border-emerald-300",text: "text-emerald-800",badge: "bg-emerald-400" },
  { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-800", badge: "bg-violet-400"  },
  { bg: "bg-amber-100",  border: "border-amber-300",  text: "text-amber-800",  badge: "bg-amber-400"   },
  { bg: "bg-rose-100",   border: "border-rose-300",   text: "text-rose-800",   badge: "bg-rose-400"    },
  { bg: "bg-cyan-100",   border: "border-cyan-300",   text: "text-cyan-800",   badge: "bg-cyan-400"    },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800", badge: "bg-orange-400"  },
  { bg: "bg-pink-100",   border: "border-pink-300",   text: "text-pink-800",   badge: "bg-pink-400"    },
  { bg: "bg-teal-100",   border: "border-teal-300",   text: "text-teal-800",   badge: "bg-teal-400"    },
  { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-800", badge: "bg-indigo-400"  },
];

function getColor(employeeId: string, employees: Employee[]): ColorSwatch {
  const idx = employees.findIndex((e) => e.id === employeeId);
  return EMP_COLORS[(idx >= 0 ? idx : 0) % EMP_COLORS.length];
}

const SHIFT_LABELS: Record<string, string> = {
  full: "מלאה",
  morning: "בוקר",
  afternoon: 'אחה"צ',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function SchedulingPage() {
  const qc = useQueryClient();
  const { isManager } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [activeView, setActiveView] = useState<"weekly" | "daily" | "bysite" | "byemployee">("weekly");
  const [addDialog, setAddDialog] = useState<{ open: boolean; date?: string }>({ open: false });
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterSite, setFilterSite] = useState("all");

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekFrom = format(weekStart, "yyyy-MM-dd");
  const weekTo = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", weekFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, employees(full_name), sites(name)")
        .gte("date", weekFrom)
        .lte("date", weekTo)
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

  const moveM = useMutation({
    mutationFn: async ({ id, newDate }: { id: string; newDate: string }) => {
      const { error } = await supabase
        .from("assignments")
        .update({ date: newDate, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("שיבוץ הועבר");
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error("שגיאה בהזזה", { description: e.message }),
  });

  const filtered = assignments.filter((a) => {
    if (filterEmployee !== "all" && a.employee_id !== filterEmployee) return false;
    if (filterSite !== "all" && a.site_id !== filterSite) return false;
    return true;
  });

  const today = new Date();
  const todayAssignments = assignments.filter((a) => isSameDay(new Date(a.date), today));
  const unassignedToday = employees.filter(
    (e) => !assignments.some((a) => a.employee_id === e.id && isSameDay(new Date(a.date), today))
  );

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["assignments"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const colorOf = (empId: string) => getColor(empId, employees);

  const sharedProps = {
    assignments: filtered,
    allAssignments: assignments,
    employees,
    sites,
    days,
    isManager,
    onDelete: (id: string) => deleteM.mutate(id),
    onMove: (id: string, newDate: string) => moveM.mutate({ id, newDate }),
    onAdd: (date?: string) => setAddDialog({ open: true, date }),
    colorOf,
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="icon"
            onClick={() => { setWeekStart(addDays(weekStart, -7)); setSelectedDay(addDays(selectedDay, -7)); }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm sm:text-base">
            {format(weekStart, "d MMM", { locale: he })} –{" "}
            {format(addDays(weekStart, 6), "d MMM yyyy", { locale: he })}
          </span>
          <Button
            variant="outline" size="icon"
            onClick={() => { setWeekStart(addDays(weekStart, 7)); setSelectedDay(addDays(selectedDay, 7)); }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 })); setSelectedDay(new Date()); }}
          >
            היום
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="כל העובדים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העובדים</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSite} onValueChange={setFilterSite}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="כל האתרים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל האתרים</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isManager && (
            <Button size="sm" onClick={() => setAddDialog({ open: true })}>
              <Plus className="h-4 w-4 ml-1" /> שיבוץ חדש
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary cards ── */}
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
              <AlertTriangle className="h-4 w-4 text-orange-500" />
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
              <p className="text-xl font-bold">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Views ── */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList className="mb-3">
          <TabsTrigger value="weekly">שבועי</TabsTrigger>
          <TabsTrigger value="daily">יומי</TabsTrigger>
          <TabsTrigger value="bysite">לפי אתר</TabsTrigger>
          <TabsTrigger value="byemployee">לפי עובד</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-0">
          <WeeklyView {...sharedProps} />
        </TabsContent>
        <TabsContent value="daily" className="mt-0">
          <DailyView {...sharedProps} selectedDay={selectedDay} onDayChange={setSelectedDay} />
        </TabsContent>
        <TabsContent value="bysite" className="mt-0">
          <SiteView {...sharedProps} />
        </TabsContent>
        <TabsContent value="byemployee" className="mt-0">
          <EmployeeView {...sharedProps} />
        </TabsContent>
      </Tabs>

      {/* ── Unassigned today ── */}
      {unassignedToday.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2 text-orange-600">
              עובדים ללא שיבוץ היום ({unassignedToday.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedToday.map((e) => {
                const c = colorOf(e.id);
                return (
                  <Badge key={e.id} variant="outline" className={`text-xs ${c.text} ${c.border}`}>
                    {e.full_name}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AddAssignmentDialog
        open={addDialog.open}
        defaultDate={addDialog.date}
        employees={employees}
        sites={sites}
        existingAssignments={assignments}
        onClose={() => setAddDialog({ open: false })}
        onSuccess={invalidateAll}
      />
    </div>
  );
}

// ─── Shared props type ────────────────────────────────────────────────────────

type SharedViewProps = {
  assignments: Assignment[];
  allAssignments: Assignment[];
  employees: Employee[];
  sites: Site[];
  days: Date[];
  isManager: boolean;
  onDelete: (id: string) => void;
  onMove: (id: string, newDate: string) => void;
  onAdd: (date?: string) => void;
  colorOf: (empId: string) => ColorSwatch;
};

// ─── Assignment Card (reusable, draggable) ────────────────────────────────────

function AssignmentCard({
  a, isManager, onDelete, onDragStart, color,
}: {
  a: Assignment;
  isManager: boolean;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  color: ColorSwatch;
}) {
  return (
    <div
      draggable={isManager && !!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, a.id) : undefined}
      className={`text-[11px] rounded-lg border px-2 py-1.5 flex items-start justify-between gap-1 group ${
        isManager && onDragStart ? "cursor-grab active:cursor-grabbing" : ""
      } ${color.bg} ${color.border}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`font-semibold truncate ${color.text}`}>{a.employees.full_name}</p>
        <p className="text-muted-foreground truncate text-[10px]">{a.sites.name}</p>
        {a.shift_type && a.shift_type !== "full" && (
          <span className="text-[9px] text-muted-foreground">{SHIFT_LABELS[a.shift_type]}</span>
        )}
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
                {a.employees.full_name} ← {a.sites.name} ({format(new Date(a.date), "d MMM", { locale: he })})
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(a.id)}>הסר</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// ─── Weekly View (GAP-001: Drag & Drop) ──────────────────────────────────────

function WeeklyView({ assignments, employees, days, isManager, onDelete, onMove, onAdd, colorOf }: SharedViewProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(date);
  };

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    if (dragId) {
      const a = assignments.find((x) => x.id === dragId);
      if (a && a.date !== date) onMove(dragId, date);
    }
    setDragId(null);
    setDragOverDate(null);
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayAssignments = assignments.filter((a) => a.date === dateStr);
        const isToday = isSameDay(day, new Date());
        const isDragTarget = dragOverDate === dateStr;

        return (
          <div
            key={dateStr}
            onDragOver={(e) => handleDragOver(e, dateStr)}
            onDrop={(e) => handleDrop(e, dateStr)}
            onDragLeave={() => setDragOverDate(null)}
            className={`rounded-xl border p-2 min-h-[160px] flex flex-col gap-1.5 transition-colors ${
              isDragTarget
                ? "border-blue-400 bg-blue-50/70 ring-2 ring-blue-200"
                : isToday
                ? "border-blue-400 bg-blue-50/40"
                : "bg-white border-border/60"
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
                  onClick={() => onAdd(dateStr)}
                  className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-blue-100 text-muted-foreground hover:text-blue-600 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>

            {dayAssignments.map((a) => (
              <AssignmentCard
                key={a.id}
                a={a}
                isManager={isManager}
                onDelete={onDelete}
                onDragStart={handleDragStart}
                color={colorOf(a.employee_id)}
              />
            ))}

            {isDragTarget && dayAssignments.length === 0 && (
              <div className="text-[11px] text-blue-400 text-center py-3 border-2 border-dashed border-blue-300 rounded-lg flex-1">
                שחרר כאן
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Daily View (GAP-009) ─────────────────────────────────────────────────────

function DailyView({
  assignments, employees, sites, isManager, onDelete, onAdd, onMove, colorOf, selectedDay, onDayChange,
}: SharedViewProps & { selectedDay: Date; onDayChange: (d: Date) => void }) {
  const dateStr = format(selectedDay, "yyyy-MM-dd");
  const isToday = isSameDay(selectedDay, new Date());
  const dayAssignments = assignments.filter((a) => a.date === dateStr);

  const bySite: Record<string, Assignment[]> = {};
  for (const a of dayAssignments) {
    if (!bySite[a.site_id]) bySite[a.site_id] = [];
    bySite[a.site_id].push(a);
  }
  const activeSites = sites.filter((s) => (bySite[s.id]?.length ?? 0) > 0);

  const assignedIds = new Set(dayAssignments.map((a) => a.employee_id));
  const unassigned = employees.filter((e) => !assignedIds.has(e.id));

  return (
    <div className="space-y-4">
      {/* Day nav */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => onDayChange(addDays(selectedDay, -1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className={`font-semibold ${isToday ? "text-blue-600" : ""}`}>
          {format(selectedDay, "EEEE, d MMMM yyyy", { locale: he })}
        </span>
        {isToday && <Badge className="text-xs bg-blue-100 text-blue-700 border border-blue-200 font-medium">היום</Badge>}
        <Button variant="outline" size="icon" onClick={() => onDayChange(addDays(selectedDay, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline">{dayAssignments.length} שיבוצים</Badge>
        <Badge variant="outline">{activeSites.length} אתרים</Badge>
        {isManager && (
          <Button size="sm" onClick={() => onAdd(dateStr)}>
            <Plus className="h-4 w-4 ml-1" /> הוסף שיבוץ
          </Button>
        )}
      </div>

      {dayAssignments.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p>אין שיבוצים ליום זה</p>
          {isManager && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => onAdd(dateStr)}>
              הוסף שיבוץ ראשון
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeSites.map((s) => (
            <Card key={s.id}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-500" />
                  {s.name}
                  <Badge variant="secondary" className="text-xs mr-auto">{bySite[s.id].length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {bySite[s.id].map((a) => (
                  <AssignmentCard
                    key={a.id}
                    a={a}
                    isManager={isManager}
                    onDelete={onDelete}
                    color={colorOf(a.employee_id)}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {unassigned.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2 text-orange-600">ללא שיבוץ ({unassigned.length})</p>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((e) => {
                const c = colorOf(e.id);
                return (
                  <Badge
                    key={e.id}
                    variant="outline"
                    className={`text-xs ${c.text} ${c.border} ${isManager ? "cursor-pointer hover:bg-orange-50" : ""}`}
                    onClick={() => isManager && onAdd(dateStr)}
                  >
                    {e.full_name}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Site View (GAP-017) ──────────────────────────────────────────────────────

function SiteView({ assignments, sites, days, isManager, onDelete, onAdd, onMove, colorOf }: SharedViewProps) {
  const activeSites = sites.filter((s) => assignments.some((a) => a.site_id === s.id));

  if (activeSites.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Building2 className="h-8 w-8 mx-auto mb-3 opacity-30" />
        <p>אין שיבוצים השבוע</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeSites.map((s) => {
        const siteAll = assignments.filter((a) => a.site_id === s.id);
        return (
          <Card key={s.id}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                {s.name}
                <Badge variant="secondary" className="text-xs mr-auto">{siteAll.length} השבוע</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayA = siteAll.filter((a) => a.date === dateStr);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={dateStr}
                      className={`rounded-lg p-1.5 min-h-[64px] border ${
                        isToday ? "border-blue-300 bg-blue-50/40" : "border-border/40 bg-muted/20"
                      }`}
                    >
                      <p className={`text-[10px] font-semibold mb-1 ${isToday ? "text-blue-600" : "text-muted-foreground"}`}>
                        {format(day, "EEE d", { locale: he })}
                      </p>
                      {dayA.map((a) => {
                        const c = colorOf(a.employee_id);
                        return (
                          <div key={a.id} className={`text-[10px] rounded px-1.5 py-0.5 mb-0.5 font-medium truncate ${c.bg} ${c.text}`}>
                            {a.employees.full_name}
                          </div>
                        );
                      })}
                      {isManager && dayA.length === 0 && (
                        <button
                          onClick={() => onAdd(dateStr)}
                          className="w-full text-[10px] text-muted-foreground hover:text-blue-500 transition-colors py-1"
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Employee View (GAP-020 + GAP-026: double detection) ─────────────────────

function EmployeeView({ assignments, employees, days, isManager, onDelete, onAdd, onMove, colorOf }: SharedViewProps) {
  const activeEmployees = employees.filter((e) => assignments.some((a) => a.employee_id === e.id));

  if (activeEmployees.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-3 opacity-30" />
        <p>אין שיבוצים השבוע</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeEmployees.map((emp) => {
        const empAll = assignments.filter((a) => a.employee_id === emp.id);
        const c = colorOf(emp.id);
        const estimatedCost = empAll.reduce((s, a) => s + (a.cost_estimated ?? 0), 0);
        return (
          <Card key={emp.id} className={`border-r-4 ${c.border}`}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${c.badge}`}>
                  {emp.full_name.charAt(0)}
                </div>
                <span>{emp.full_name}</span>
                <Badge variant="secondary" className="text-xs mr-auto">{empAll.length} ימים</Badge>
                {estimatedCost > 0 && (
                  <span className="text-xs text-muted-foreground">₪{estimatedCost.toLocaleString("he-IL")}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayA = empAll.filter((a) => a.date === dateStr);
                  const isToday = isSameDay(day, new Date());
                  const isDouble = dayA.length > 1;
                  return (
                    <div
                      key={dateStr}
                      className={`rounded-lg p-1.5 min-h-[64px] border ${
                        isDouble
                          ? "border-red-400 bg-red-50"
                          : isToday
                          ? "border-blue-300 bg-blue-50/40"
                          : "border-border/40 bg-muted/20"
                      }`}
                    >
                      <p className={`text-[10px] font-semibold mb-1 ${
                        isDouble ? "text-red-600" : isToday ? "text-blue-600" : "text-muted-foreground"
                      }`}>
                        {format(day, "EEE d", { locale: he })}
                      </p>
                      {dayA.map((a) => (
                        <div key={a.id} className={`text-[10px] rounded px-1.5 py-0.5 mb-0.5 font-medium truncate ${c.bg} ${c.text}`}>
                          {a.sites.name}
                        </div>
                      ))}
                      {isDouble && (
                        <div className="flex items-center gap-0.5 text-[9px] text-red-600 font-bold mt-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          כפול!
                        </div>
                      )}
                      {isManager && !isDouble && dayA.length === 0 && (
                        <button
                          onClick={() => onAdd(dateStr)}
                          className="w-full text-[10px] text-muted-foreground hover:text-blue-500 transition-colors py-1"
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Add Assignment Dialog (GAP-026: double detection) ────────────────────────

function AddAssignmentDialog({
  open, defaultDate, employees, sites, existingAssignments, onClose, onSuccess,
}: {
  open: boolean;
  defaultDate?: string;
  employees: Employee[];
  sites: Site[];
  existingAssignments: Assignment[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    employee_id: "",
    site_id: "",
    date: defaultDate ?? format(new Date(), "yyyy-MM-dd"),
    shift_type: "full" as "full" | "morning" | "afternoon",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        date: defaultDate ?? format(new Date(), "yyyy-MM-dd"),
        employee_id: "",
        site_id: "",
        notes: "",
        shift_type: "full",
      }));
    }
  }, [open, defaultDate]);

  const isDuplicate = !!(
    form.employee_id &&
    form.date &&
    existingAssignments.some((a) => a.employee_id === form.employee_id && a.date === form.date)
  );
  const dupEmployee = employees.find((e) => e.id === form.employee_id);

  const saveM = useMutation({
    mutationFn: async () => {
      const emp = employees.find((e) => e.id === form.employee_id);
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("assignments").insert({
        employee_id: form.employee_id,
        site_id: form.site_id,
        date: form.date,
        shift_type: form.shift_type,
        cost_estimated: emp?.daily_cost_estimated ?? 0,
        notes: form.notes || null,
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

        {isDuplicate && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{dupEmployee?.full_name} כבר משובץ בתאריך זה!</span>
          </div>
        )}

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
          <div className="space-y-2">
            <Label>משמרת</Label>
            <Select value={form.shift_type} onValueChange={(v) => setForm({ ...form, shift_type: v as "full" | "morning" | "afternoon" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">מלאה (כל היום)</SelectItem>
                <SelectItem value="morning">בוקר</SelectItem>
                <SelectItem value="afternoon">אחה"צ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>הערות (אופציונלי)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="הערות לשיבוץ..."
              className="text-sm resize-none h-16"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button
              type="submit"
              disabled={saveM.isPending || !form.employee_id || !form.site_id}
              variant={isDuplicate ? "destructive" : "default"}
            >
              {saveM.isPending ? "שומר..." : isDuplicate ? "שבץ בכל זאת" : "שבץ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
