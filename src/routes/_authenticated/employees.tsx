import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus, Pencil, Trash2, Phone, IdCard, Search,
  Users, UserCheck, TrendingUp, CalendarDays,
  FileSpreadsheet, ChevronLeft, Briefcase, Banknote,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

/* ─── Types ─── */
type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  identifier: string | null;
  status: "active" | "inactive";
  daily_cost_estimate: number;
  monthly_cost_actual: number | null;
  notes: string | null;
};

type Assignment = {
  id: string;
  date: string;
  cost_snapshot: number | null;
  projects: { name: string } | null;
};

type Salary = {
  id: string;
  month: string;
  amount: number;
  notes: string | null;
};

type FilterType = "all" | "active" | "inactive";

/* ─── Helpers ─── */
const GRADIENT_BTN = "linear-gradient(145deg, #0F83F0, #1565C0)";
const GRADIENT_CARDS: Record<string, string> = {
  blue:   "linear-gradient(to right bottom, rgba(15,131,240,0.08), white)",
  green:  "linear-gradient(to right bottom, rgba(34,197,94,0.08), white)",
  orange: "linear-gradient(to right bottom, rgba(249,115,22,0.08), white)",
  purple: "linear-gradient(to right bottom, rgba(139,92,246,0.08), white)",
};

function avatarColor(name: string) {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-orange-100 text-orange-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function exportCSV(employees: Employee[]) {
  const header = ["שם מלא", "טלפון", "מזהה", "סטטוס", "עלות יומית", "עלות חודשית", "הערות"];
  const rows = employees.map((e) => [
    e.full_name,
    e.phone ?? "",
    e.identifier ?? "",
    e.status === "active" ? "פעיל" : "לא פעיל",
    e.daily_cost_estimate,
    e.monthly_cost_actual ?? "",
    e.notes ?? "",
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "עובדים.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── KPI Card ─── */
function KPICard({
  title, value, subText, icon: Icon, gradient = "blue",
}: {
  title: string; value: string | number; subText?: string;
  icon: React.ElementType; gradient?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-border/50 p-5"
      style={{ background: GRADIENT_CARDS[gradient] ?? GRADIENT_CARDS.blue }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 rounded-xl bg-white/80">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="text-3xl font-bold mt-3">{value}</div>
      {subText && <p className="text-xs text-muted-foreground mt-1">{subText}</p>}
    </div>
  );
}

/* ─── Filter Pill ─── */
function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
        active ? "text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
      style={active ? { background: GRADIENT_BTN } : {}}
    >
      {label}
    </button>
  );
}

/* ─── Main Page ─── */
function EmployeesPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Employee[];
    },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("עובד נמחק");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  /* KPI calculations */
  const totalActive = employees.filter((e) => e.status === "active").length;
  const totalMonthlyCost = employees.reduce(
    (s, e) => s + (e.monthly_cost_actual ?? e.daily_cost_estimate * 22), 0
  );
  const avgDaily = employees.length
    ? Math.round(employees.reduce((s, e) => s + e.daily_cost_estimate, 0) / employees.length)
    : 0;

  /* Filtering */
  const filtered = employees.filter((e) => {
    const matchSearch = [e.full_name, e.phone, e.identifier].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    );
    const matchFilter =
      filter === "all" ||
      (filter === "active" && e.status === "active") ||
      (filter === "inactive" && e.status === "inactive");
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">ניהול עובדים</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {employees.length} עובדים במערכת • {totalActive} פעילים
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          {isManager && (
            <Dialog
              open={dialogOpen}
              onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
            >
              <DialogTrigger asChild>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: GRADIENT_BTN }}
                >
                  <Plus className="h-4 w-4" /> עובד חדש
                </button>
              </DialogTrigger>
              <EmployeeDialog
                editing={editing}
                onClose={() => { setDialogOpen(false); setEditing(null); }}
              />
            </Dialog>
          )}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="סה״כ עובדים" value={employees.length}
          subText={`${totalActive} פעילים`} icon={Users} gradient="blue"
        />
        <KPICard
          title="עובדים פעילים" value={totalActive}
          subText={`${employees.length - totalActive} לא פעילים`} icon={UserCheck} gradient="green"
        />
        <KPICard
          title="עלות חודשית כוללת"
          value={`₪${totalMonthlyCost.toLocaleString("he-IL")}`}
          subText="משוערת לפי כל העובדים" icon={TrendingUp} gradient="orange"
        />
        <KPICard
          title="ממוצע יומי לעובד"
          value={`₪${avgDaily.toLocaleString("he-IL")}`}
          subText="עלות יומית ממוצעת" icon={CalendarDays} gradient="purple"
        />
      </div>

      {/* ── Filter + Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2">
          <FilterPill label="כולם" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterPill label="פעיל" active={filter === "active"} onClick={() => setFilter("active")} />
          <FilterPill label="לא פעיל" active={filter === "inactive"} onClick={() => setFilter("inactive")} />
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, טלפון, מזהה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-3 pe-9"
          />
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-16">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">😊</div>
          <h3 className="text-lg font-semibold mb-2">
            {search || filter !== "all" ? "לא נמצאו עובדים תואמים" : "אין עובדים עדיין"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {search || filter !== "all"
              ? "נסה לשנות את הסינון או החיפוש"
              : "הוסף את העובד הראשון שלך"}
          </p>
          {isManager && !search && filter === "all" && (
            <button
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: GRADIENT_BTN }}
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 inline ml-1" /> הוסף עובד
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              isManager={isManager}
              isAdmin={isAdmin}
              onEdit={(e) => { setEditing(e); setDialogOpen(true); }}
              onDelete={(id) => deleteM.mutate(id)}
              onSelect={() => setSelectedEmp(emp)}
            />
          ))}
        </div>
      )}

      {/* ── Employee Detail Sheet ── */}
      <EmployeeSheet
        emp={selectedEmp}
        onClose={() => setSelectedEmp(null)}
        isManager={isManager}
        onEdit={(e) => {
          setSelectedEmp(null);
          setEditing(e);
          setDialogOpen(true);
        }}
      />
    </div>
  );
}

/* ─── Employee Card ─── */
function EmployeeCard({
  emp, isManager, isAdmin, onEdit, onDelete, onSelect,
}: {
  emp: Employee;
  isManager: boolean;
  isAdmin: boolean;
  onEdit: (e: Employee) => void;
  onDelete: (id: string) => void;
  onSelect: () => void;
}) {
  const initials = emp.full_name.trim().split(" ").slice(0, 2).map((w) => w[0]).join("");
  const estimatedMonthly = emp.monthly_cost_actual ?? emp.daily_cost_estimate * 22;

  return (
    <div
      className="rounded-2xl border border-border/50 bg-white p-5 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0",
              avatarColor(emp.full_name)
            )}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate">{emp.full_name}</h3>
            <Badge
              variant={emp.status === "active" ? "default" : "secondary"}
              className="mt-1 text-xs"
            >
              {emp.status === "active" ? "פעיל" : "לא פעיל"}
            </Badge>
          </div>
        </div>
        {isManager && (
          <div
            className="flex gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onEdit(emp)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>למחוק את {emp.full_name}?</AlertDialogTitle>
                    <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(emp.id)}>מחק</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
        {emp.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span dir="ltr">{emp.phone}</span>
          </div>
        )}
        {emp.identifier && (
          <div className="flex items-center gap-2">
            <IdCard className="h-3.5 w-3.5 shrink-0" />
            <span>{emp.identifier}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">יומית</p>
          <p className="font-bold">₪{Number(emp.daily_cost_estimate).toLocaleString("he-IL")}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">חודשית</p>
          <p className="font-bold">₪{Number(estimatedMonthly).toLocaleString("he-IL")}</p>
          {!emp.monthly_cost_actual && (
            <p className="text-[10px] text-muted-foreground">משוערת</p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>לחץ לפרטים מלאים</span>
        <ChevronLeft className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

/* ─── Employee Detail Sheet ─── */
function EmployeeSheet({
  emp, onClose, isManager, onEdit,
}: {
  emp: Employee | null;
  onClose: () => void;
  isManager: boolean;
  onEdit: (e: Employee) => void;
}) {
  if (!emp) return null;

  return (
    <Sheet open={!!emp} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto" dir="rtl">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                  avatarColor(emp.full_name)
                )}
              >
                {emp.full_name.trim().split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </div>
              <div>
                <SheetTitle className="text-xl">{emp.full_name}</SheetTitle>
                <Badge variant={emp.status === "active" ? "default" : "secondary"} className="text-xs mt-0.5">
                  {emp.status === "active" ? "פעיל" : "לא פעיל"}
                </Badge>
              </div>
            </div>
            {isManager && (
              <button
                onClick={() => onEdit(emp)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" /> עריכה
              </button>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" dir="rtl">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="details" className="flex-1 gap-1.5">
              <User className="h-4 w-4" /> פרטים
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex-1 gap-1.5">
              <Briefcase className="h-4 w-4" /> שיבוצים
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex-1 gap-1.5">
              <Banknote className="h-4 w-4" /> שכר
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <EmployeeDetailsTab emp={emp} />
          </TabsContent>
          <TabsContent value="assignments">
            <EmployeeAssignmentsTab employeeId={emp.id} dailyCost={emp.daily_cost_estimate} />
          </TabsContent>
          <TabsContent value="salary">
            <EmployeeSalaryTab employeeId={emp.id} empName={emp.full_name} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Tab: פרטים ─── */
function EmployeeDetailsTab({ emp }: { emp: Employee }) {
  const estimatedMonthly = emp.monthly_cost_actual ?? emp.daily_cost_estimate * 22;
  const rows = [
    { label: "טלפון", value: emp.phone, dir: "ltr" as const },
    { label: "מזהה / ת\"ז", value: emp.identifier },
    { label: "סטטוס", value: emp.status === "active" ? "פעיל" : "לא פעיל" },
    { label: "עלות יומית משוערת", value: `₪${Number(emp.daily_cost_estimate).toLocaleString("he-IL")}` },
    { label: "עלות חודשית בפועל", value: emp.monthly_cost_actual ? `₪${Number(emp.monthly_cost_actual).toLocaleString("he-IL")}` : "לא הוזן" },
    { label: "עלות חודשית (חישוב)", value: `₪${Number(estimatedMonthly).toLocaleString("he-IL")}`, note: !emp.monthly_cost_actual ? "× 22 ימי עבודה" : undefined },
  ];

  return (
    <div className="space-y-3">
      {rows.map(({ label, value, dir, note }) =>
        value ? (
          <div key={label} className="flex justify-between items-start py-2.5 border-b border-border/50 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="text-left">
              <span className="text-sm font-medium" dir={dir}>{value}</span>
              {note && <p className="text-xs text-muted-foreground">{note}</p>}
            </div>
          </div>
        ) : null
      )}
      {emp.notes && (
        <div className="mt-4 p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">הערות</p>
          <p className="text-sm">{emp.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: שיבוצים ─── */
function EmployeeAssignmentsTab({
  employeeId, dailyCost,
}: { employeeId: string; dailyCost: number }) {
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["employee-assignments", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, date, cost_snapshot, projects(name)")
        .eq("employee_id", employeeId)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Assignment[];
    },
  });

  const totalDays = assignments.length;
  const totalCost = assignments.reduce(
    (s, a) => s + (a.cost_snapshot ?? dailyCost), 0
  );

  if (isLoading) return <div className="text-center py-8 text-sm text-muted-foreground">טוען שיבוצים...</div>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 p-3 text-center"
          style={{ background: GRADIENT_CARDS.blue }}>
          <p className="text-2xl font-bold">{totalDays}</p>
          <p className="text-xs text-muted-foreground mt-0.5">ימי עבודה</p>
        </div>
        <div className="rounded-xl border border-border/50 p-3 text-center"
          style={{ background: GRADIENT_CARDS.orange }}>
          <p className="text-2xl font-bold">₪{totalCost.toLocaleString("he-IL")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">עלות מצטברת</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm text-muted-foreground">אין שיבוצים עדיין</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div key={a.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium">
                  {a.projects?.name ?? "אתר לא ידוע"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.date).toLocaleDateString("he-IL", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                  })}
                </p>
              </div>
              <span className="text-sm font-semibold">
                ₪{Number(a.cost_snapshot ?? dailyCost).toLocaleString("he-IL")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tab: שכר ─── */
function EmployeeSalaryTab({
  employeeId, empName,
}: { employeeId: string; empName: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ month: "", amount: "", notes: "" });

  const { data: salaries = [], isLoading } = useQuery({
    queryKey: ["employee-salaries", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .eq("employee_id", employeeId)
        .order("month", { ascending: false });
      if (error) throw error;
      return data as Salary[];
    },
  });

  const addM = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("salaries").insert({
        employee_id: employeeId,
        month: form.month + "-01",
        amount: Number(form.amount),
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("שכר נוסף בהצלחה");
      qc.invalidateQueries({ queryKey: ["employee-salaries", employeeId] });
      qc.invalidateQueries({ queryKey: ["employees"] });
      setForm({ month: "", amount: "", notes: "" });
      setShowForm(false);
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  const deleteS = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("רשומת שכר נמחקה");
      qc.invalidateQueries({ queryKey: ["employee-salaries", employeeId] });
    },
  });

  const totalSalaries = salaries.reduce((s, sal) => s + sal.amount, 0);

  if (isLoading) return <div className="text-center py-8 text-sm text-muted-foreground">טוען שכר...</div>;

  return (
    <div className="space-y-4">
      {/* Summary + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">סה"כ שכר מוזן</p>
          <p className="text-2xl font-bold">₪{totalSalaries.toLocaleString("he-IL")}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: GRADIENT_BTN }}
        >
          <Plus className="h-4 w-4" /> הוסף שכר
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); addM.mutate(); }}
          className="rounded-xl border border-border/50 p-4 space-y-3 bg-muted/20"
        >
          <p className="text-sm font-semibold">הוספת שכר חודשי — {empName}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">חודש</Label>
              <Input
                type="month"
                required
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">סכום (₪)</Label>
              <Input
                type="number"
                min="0"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">הערות</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="אופציונלי"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={addM.isPending}>
              {addM.isPending ? "שומר..." : "שמור"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              ביטול
            </Button>
          </div>
        </form>
      )}

      {/* Salary list */}
      {salaries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-sm text-muted-foreground">אין רשומות שכר עדיין</p>
        </div>
      ) : (
        <div className="space-y-2">
          {salaries.map((sal) => (
            <div key={sal.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
              <div>
                <p className="text-sm font-medium">
                  {new Date(sal.month).toLocaleDateString("he-IL", {
                    month: "long", year: "numeric",
                  })}
                </p>
                {sal.notes && (
                  <p className="text-xs text-muted-foreground">{sal.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-700">
                  ₪{Number(sal.amount).toLocaleString("he-IL")}
                </span>
                <button
                  onClick={() => deleteS.mutate(sal.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Employee Add/Edit Dialog ─── */
function EmployeeDialog({
  editing, onClose,
}: { editing: Employee | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: editing?.full_name ?? "",
    phone: editing?.phone ?? "",
    identifier: editing?.identifier ?? "",
    status: editing?.status ?? "active",
    daily_cost_estimate: editing?.daily_cost_estimate?.toString() ?? "0",
    monthly_cost_actual: editing?.monthly_cost_actual?.toString() ?? "",
    notes: editing?.notes ?? "",
  });

  const saveM = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        identifier: form.identifier.trim() || null,
        status: form.status as "active" | "inactive",
        daily_cost_estimate: Number(form.daily_cost_estimate) || 0,
        monthly_cost_actual: form.monthly_cost_actual ? Number(form.monthly_cost_actual) : null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("employees").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("employees").insert({ ...payload, created_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "עובד עודכן" : "עובד נוסף");
      qc.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  return (
    <DialogContent dir="rtl" className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{editing ? "עריכת עובד" : "עובד חדש"}</DialogTitle>
        <DialogDescription>פרטי העובד ועלויות שכר</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="space-y-4">
        <div className="space-y-2">
          <Label>שם מלא *</Label>
          <Input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>טלפון</Label>
            <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>מזהה / ת"ז</Label>
            <Input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>עלות יומית משוערת (₪)</Label>
            <Input
              type="number" min="0" step="any"
              value={form.daily_cost_estimate}
              onChange={(e) => setForm({ ...form, daily_cost_estimate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>עלות חודשית בפועל (₪)</Label>
            <Input
              type="number" min="0" step="any"
              value={form.monthly_cost_actual}
              onChange={(e) => setForm({ ...form, monthly_cost_actual: e.target.value })}
              placeholder="אופציונלי"
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
          <div>
            <Label className="text-sm">עובד פעיל</Label>
            <p className="text-xs text-muted-foreground">האם העובד זמין לשיבוץ</p>
          </div>
          <Switch
            checked={form.status === "active"}
            onCheckedChange={(c) => setForm({ ...form, status: c ? "active" : "inactive" })}
          />
        </div>
        <div className="space-y-2">
          <Label>הערות</Label>
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <button
            type="submit"
            disabled={saveM.isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: GRADIENT_BTN }}
          >
            {saveM.isPending ? "שומר..." : editing ? "עדכן" : "הוסף"}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
