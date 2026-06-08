import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect, memo } from "react";
import {
  Plus, Pencil, Trash2, Phone, IdCard, Search,
  Users, UserCheck, TrendingUp, CalendarDays,
  FileSpreadsheet, ChevronLeft, Briefcase, Banknote,
  User, LayoutGrid, List, ArrowUpDown, CheckCircle2,
  Circle, Building2,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  id_number: string | null;
  status: "active" | "inactive";
  daily_cost_estimated: number;
  monthly_cost_actual: number | null;
  job_title: string | null;
  employment_type: string | null;
  start_date: string | null;
  timewatch_employee_id: string | null;
  notes: string | null;
};

type Assignment = {
  id: string;
  date: string;
  shift_type: "full" | "morning" | "afternoon";
  cost_estimated: number | null;
  sites: { name: string } | null;
};

type SalaryRecord = {
  id: string;
  month: string;
  amount_actual: number;
  is_paid: boolean;
  notes: string | null;
};

type FilterStatus = "all" | "active" | "inactive";
type SortType    = "name" | "cost_desc" | "cost_asc" | "seniority" | "status";
type ViewType    = "grid" | "list";

/* ─────────────────────────────────────────
   CONSTANTS & PURE HELPERS
   (defined outside components → stable refs)
───────────────────────────────────────── */
const GRADIENT_BTN = "linear-gradient(145deg, #0F83F0, #1565C0)";
const GRADIENT_CARDS: Record<string, string> = {
  blue:   "linear-gradient(to right bottom, rgba(15,131,240,0.08), white)",
  green:  "linear-gradient(to right bottom, rgba(34,197,94,0.08), white)",
  orange: "linear-gradient(to right bottom, rgba(249,115,22,0.08), white)",
  purple: "linear-gradient(to right bottom, rgba(139,92,246,0.08), white)",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

const EMPLOYMENT_TYPES = ["שכיר", "עצמאי", "קבלן", "זמני"];

const SHIFT_LABELS: Record<string, string> = {
  full:      "משמרת מלאה",
  morning:   "בוקר",
  afternoon: "צהריים",
};

/** Deterministic avatar color per employee name */
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/** Initials (up to 2 words) */
function getInitials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0]).join("");
}

/** Human-readable seniority from start_date */
function calcSeniority(startDate: string | null): string {
  if (!startDate) return "";
  const start  = new Date(startDate);
  const now    = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (months < 1)  return "פחות מחודש";
  if (months < 12) return `${months} חוד׳`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${yrs} שנ׳` : `${yrs} שנ׳ ו-${rem} חוד׳`;
}

/** Format date to he-IL */
function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("he-IL", opts ?? {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/** Sort a copy of the employees array */
function sortEmployees(list: Employee[], sort: SortType): Employee[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case "name":
        return a.full_name.localeCompare(b.full_name, "he");
      case "cost_desc":
        return b.daily_cost_estimated - a.daily_cost_estimated;
      case "cost_asc":
        return a.daily_cost_estimated - b.daily_cost_estimated;
      case "seniority":
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      case "status":
        return a.status === b.status ? 0 : a.status === "active" ? -1 : 1;
      default:
        return 0;
    }
  });
}

/** CSV export with updated column names */
function exportCSV(employees: Employee[]) {
  const header = [
    "שם מלא", "תפקיד", "סוג העסקה", "טלפון", "ת\"ז",
    "סטטוס", "עלות יומית", "עלות חודשית", "תאריך התחלה", "הערות",
  ];
  const rows = employees.map((e) => [
    e.full_name,
    e.job_title          ?? "",
    e.employment_type    ?? "",
    e.phone              ?? "",
    e.id_number          ?? "",
    e.status === "active" ? "פעיל" : "לא פעיל",
    e.daily_cost_estimated,
    e.monthly_cost_actual ?? "",
    e.start_date          ?? "",
    e.notes               ?? "",
  ]);
  const csv  = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), {
    href: url, download: "עובדים.csv",
  });
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────
   CUSTOM HOOKS  (data separated from UI)
───────────────────────────────────────── */

/** All employees — query key is stable; invalidated by mutations */
function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Employee[];
    },
    staleTime: 30_000, // 30 s — avoids refetch on tab-switch
  });
}

/** Assignments for a single employee (lazy — only loads when sheet opens) */
function useEmployeeAssignments(employeeId: string | null) {
  return useQuery({
    queryKey: ["employee-assignments", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, date, shift_type, cost_estimated, sites(name)")
        .eq("employee_id", employeeId!)
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data as Assignment[];
    },
    staleTime: 60_000,
  });
}

/** Salary records for a single employee */
function useEmployeeSalaries(employeeId: string | null) {
  return useQuery({
    queryKey: ["employee-salaries", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_records")
        .select("id, month, amount_actual, is_paid, notes")
        .eq("employee_id", employeeId!)
        .order("month", { ascending: false });
      if (error) throw error;
      return data as SalaryRecord[];
    },
    staleTime: 60_000,
  });
}

/* ─────────────────────────────────────────
   SMALL REUSABLE UI PIECES
───────────────────────────────────────── */

const KPICard = memo(function KPICard({
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
});

const FilterPill = memo(function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
        active ? "text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
      )}
      style={active ? { background: GRADIENT_BTN } : {}}
    >
      {label}
    </button>
  );
});

/* ─────────────────────────────────────────
   EMPLOYEES PAGE  (main orchestrator)
───────────────────────────────────────── */
function EmployeesPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();

  // ── UI state ──
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState<FilterStatus>("all");
  const [filterEmpType, setFilterEmpType] = useState("all");
  const [sort,          setSort]          = useState<SortType>("name");
  const [view,          setView]          = useState<ViewType>("grid");
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editing,       setEditing]       = useState<Employee | null>(null);
  const [selectedEmp,   setSelectedEmp]   = useState<Employee | null>(null);

  // ── Data ──
  const { data: employees = [], isLoading, isError } = useEmployees();

  // ── Mutations ──
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

  // ── KPIs (memoized — recalculate only when employees changes) ──
  const kpi = useMemo(() => {
    const active       = employees.filter((e) => e.status === "active");
    const monthlyCost  = active.reduce(
      (s, e) => s + (e.monthly_cost_actual ?? e.daily_cost_estimated * 22), 0
    );
    const avgDaily = employees.length
      ? Math.round(employees.reduce((s, e) => s + e.daily_cost_estimated, 0) / employees.length)
      : 0;
    const shkirim = employees.filter(
      (e) => !e.employment_type || e.employment_type === "שכיר"
    ).length;
    return { total: employees.length, activeCount: active.length, monthlyCost, avgDaily, shkirim };
  }, [employees]);

  // ── Filtered + sorted list (memoized) ──
  const filtered = useMemo(() => {
    const lc = search.toLowerCase();
    const base = employees.filter((e) => {
      const matchSearch = !lc || [e.full_name, e.phone, e.id_number, e.job_title]
        .some((v) => v?.toLowerCase().includes(lc));
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active"   && e.status === "active") ||
        (filterStatus === "inactive" && e.status === "inactive");
      const matchType =
        filterEmpType === "all" ||
        (e.employment_type ?? "שכיר") === filterEmpType;
      return matchSearch && matchStatus && matchType;
    });
    return sortEmployees(base, sort);
  }, [employees, search, filterStatus, filterEmpType, sort]);

  // ── Stable callbacks (prevent re-render of memoized children) ──
  const openEdit = useCallback((e: Employee) => {
    setEditing(e);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => deleteM.mutate(id),
    [deleteM],
  );

  const handleSelect = useCallback((emp: Employee) => setSelectedEmp(emp), []);

  const handleExport = useCallback(() => exportCSV(filtered), [filtered]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">ניהול עובדים</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {kpi.total} עובדים במערכת • {kpi.activeCount} פעילים
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          {isManager && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); else setDialogOpen(true); }}>
              <DialogTrigger asChild>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: GRADIENT_BTN }}
                >
                  <Plus className="h-4 w-4" /> עובד חדש
                </button>
              </DialogTrigger>
              <EmployeeDialog editing={editing} onClose={closeDialog} />
            </Dialog>
          )}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="סה״כ עובדים"      value={kpi.total}
          subText={`${kpi.activeCount} פעילים`} icon={Users} gradient="blue" />
        <KPICard title="עובדים פעילים"     value={kpi.activeCount}
          subText={`${kpi.total - kpi.activeCount} לא פעילים`} icon={UserCheck} gradient="green" />
        <KPICard title="עלות חודשית (פעילים)"
          value={`₪${kpi.monthlyCost.toLocaleString("he-IL")}`}
          subText="לפי עובדים פעילים" icon={TrendingUp} gradient="orange" />
        <KPICard title="ממוצע יומי לעובד"
          value={`₪${kpi.avgDaily.toLocaleString("he-IL")}`}
          subText={`${kpi.shkirim} שכירים`} icon={CalendarDays} gradient="purple" />
      </div>

      {/* ── Filters ── */}
      <div className="space-y-3">
        {/* Row 1: Status + Employment type pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {(["all","active","inactive"] as FilterStatus[]).map((f) => (
            <FilterPill
              key={f}
              label={f === "all" ? "כולם" : f === "active" ? "פעיל" : "לא פעיל"}
              active={filterStatus === f}
              onClick={() => setFilterStatus(f)}
            />
          ))}
          <div className="h-5 w-px bg-border mx-1" />
          <FilterPill label="כל הסוגים" active={filterEmpType === "all"} onClick={() => setFilterEmpType("all")} />
          {EMPLOYMENT_TYPES.map((t) => (
            <FilterPill key={t} label={t} active={filterEmpType === t} onClick={() => setFilterEmpType(t)} />
          ))}
        </div>

        {/* Row 2: Search + Sort + View toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="חיפוש לפי שם, תפקיד, טלפון, ת״ז..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-9"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="name">שם (א–ת)</SelectItem>
                <SelectItem value="cost_desc">עלות ↓</SelectItem>
                <SelectItem value="cost_asc">עלות ↑</SelectItem>
                <SelectItem value="seniority">ותק</SelectItem>
                <SelectItem value="status">סטטוס</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-border overflow-hidden h-9">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "px-2.5 transition-colors",
                  view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
                title="תצוגת כרטיסיות"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "px-2.5 transition-colors",
                  view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
                title="תצוגת רשימה"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      {isLoading ? (
        <LoadingSkeleton view={view} />
      ) : isError ? (
        <ErrorState />
      ) : filtered.length === 0 ? (
        <EmptyState
          hasFilters={!!(search || filterStatus !== "all" || filterEmpType !== "all")}
          isManager={isManager}
          onAdd={() => setDialogOpen(true)}
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              isManager={isManager}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">עובד</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">תפקיד</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">טלפון</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">ותק</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">עלות יומית</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">סטטוס</th>
                {isManager && <th className="py-3 px-4 w-20" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
                  isManager={isManager}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onSelect={handleSelect}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Sheet ── */}
      <EmployeeSheet
        emp={selectedEmp}
        onClose={() => setSelectedEmp(null)}
        isManager={isManager}
        onEdit={(e) => { setSelectedEmp(null); openEdit(e); }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   LOADING / EMPTY / ERROR STATES
───────────────────────────────────────── */

function LoadingSkeleton({ view }: { view: ViewType }) {
  if (view === "list") {
    return (
      <div className="rounded-2xl border border-border/50 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-border/30 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-muted rounded w-32" />
              <div className="h-3 bg-muted/60 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/50 p-5 animate-pulse space-y-3">
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 rounded-xl bg-muted" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-muted rounded w-28" />
              <div className="h-3 bg-muted/60 rounded w-16" />
            </div>
          </div>
          <div className="h-3 bg-muted/60 rounded w-full" />
          <div className="h-3 bg-muted/60 rounded w-3/4" />
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="h-8 bg-muted/40 rounded" />
            <div className="h-8 bg-muted/40 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters, isManager, onAdd,
}: { hasFilters: boolean; isManager: boolean; onAdd: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">{hasFilters ? "🔍" : "😊"}</div>
      <h3 className="text-lg font-semibold mb-2">
        {hasFilters ? "לא נמצאו עובדים תואמים" : "אין עובדים עדיין"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {hasFilters
          ? "נסה לשנות את הסינון או החיפוש"
          : "הוסף את העובד הראשון שלך"}
      </p>
      {isManager && !hasFilters && (
        <button
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: GRADIENT_BTN }}
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 inline ml-1" /> הוסף עובד
        </button>
      )}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold mb-2">שגיאה בטעינת הנתונים</h3>
      <p className="text-sm text-muted-foreground">נסה לרענן את הדף</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   EMPLOYEE CARD  (grid view)
   memo → re-renders only when its own props change
───────────────────────────────────────── */
const EmployeeCard = memo(function EmployeeCard({
  emp, isManager, isAdmin, onEdit, onDelete, onSelect,
}: {
  emp: Employee;
  isManager: boolean;
  isAdmin: boolean;
  onEdit:   (e: Employee) => void;
  onDelete: (id: string)  => void;
  onSelect: (e: Employee) => void;
}) {
  const initials         = useMemo(() => getInitials(emp.full_name),   [emp.full_name]);
  const color            = useMemo(() => getAvatarColor(emp.full_name), [emp.full_name]);
  const estimatedMonthly = emp.monthly_cost_actual ?? emp.daily_cost_estimated * 22;
  const sen              = useMemo(() => calcSeniority(emp.start_date), [emp.start_date]);

  const handleEdit   = useCallback(() => onEdit(emp),    [onEdit, emp]);
  const handleSelect = useCallback(() => onSelect(emp),  [onSelect, emp]);

  return (
    <div
      className="rounded-2xl border border-border/50 bg-white p-5 hover:shadow-md transition-all cursor-pointer group"
      onClick={handleSelect}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0", color)}>
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate">{emp.full_name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant={emp.status === "active" ? "default" : "secondary"} className="text-xs">
                {emp.status === "active" ? "פעיל" : "לא פעיל"}
              </Badge>
              {emp.employment_type && emp.employment_type !== "שכיר" && (
                <Badge variant="outline" className="text-xs">{emp.employment_type}</Badge>
              )}
            </div>
          </div>
        </div>
        {isManager && (
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleEdit} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {isAdmin && <DeleteButton id={emp.id} name={emp.full_name} onDelete={onDelete} />}
          </div>
        )}
      </div>

      {/* Job title */}
      {emp.job_title && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{emp.job_title}</span>
        </div>
      )}

      {/* Info rows */}
      <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
        {emp.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span dir="ltr">{emp.phone}</span>
          </div>
        )}
        {emp.id_number && (
          <div className="flex items-center gap-2">
            <IdCard className="h-3.5 w-3.5 shrink-0" />
            <span>{emp.id_number}</span>
          </div>
        )}
        {sen && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>ותק: {sen}</span>
          </div>
        )}
      </div>

      {/* Cost strip */}
      <div className="pt-3 border-t grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">יומית</p>
          <p className="font-bold">₪{Number(emp.daily_cost_estimated).toLocaleString("he-IL")}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">חודשית</p>
          <p className="font-bold">₪{Number(estimatedMonthly).toLocaleString("he-IL")}</p>
          {!emp.monthly_cost_actual && (
            <p className="text-[10px] text-muted-foreground">משוערת</p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>לחץ לפרטים</span>
        <ChevronLeft className="h-3.5 w-3.5" />
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   EMPLOYEE ROW  (list / table view)
───────────────────────────────────────── */
const EmployeeRow = memo(function EmployeeRow({
  emp, isManager, isAdmin, onEdit, onDelete, onSelect,
}: {
  emp: Employee;
  isManager: boolean;
  isAdmin: boolean;
  onEdit:   (e: Employee) => void;
  onDelete: (id: string)  => void;
  onSelect: (e: Employee) => void;
}) {
  const initials = useMemo(() => getInitials(emp.full_name),    [emp.full_name]);
  const color    = useMemo(() => getAvatarColor(emp.full_name), [emp.full_name]);
  const sen      = useMemo(() => calcSeniority(emp.start_date), [emp.start_date]);

  return (
    <tr
      className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer group"
      onClick={() => onSelect(emp)}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0", color)}>
            {initials}
          </div>
          <span className="font-medium">{emp.full_name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
        {emp.job_title ?? "—"}
      </td>
      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
        <span dir="ltr">{emp.phone ?? "—"}</span>
      </td>
      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
        {sen || "—"}
      </td>
      <td className="py-3 px-4 font-semibold">
        ₪{Number(emp.daily_cost_estimated).toLocaleString("he-IL")}
      </td>
      <td className="py-3 px-4">
        <Badge variant={emp.status === "active" ? "default" : "secondary"} className="text-xs">
          {emp.status === "active" ? "פעיל" : "לא פעיל"}
        </Badge>
      </td>
      {isManager && (
        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(emp)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {isAdmin && <DeleteButton id={emp.id} name={emp.full_name} onDelete={onDelete} />}
          </div>
        </td>
      )}
    </tr>
  );
});

/* ─────────────────────────────────────────
   DELETE BUTTON  (shared between card & row)
───────────────────────────────────────── */
const DeleteButton = memo(function DeleteButton({
  id, name, onDelete,
}: { id: string; name: string; onDelete: (id: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>למחוק את {name}?</AlertDialogTitle>
          <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(id)}>מחק</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

/* ─────────────────────────────────────────
   EMPLOYEE DETAIL SHEET
───────────────────────────────────────── */
function EmployeeSheet({
  emp, onClose, isManager, onEdit,
}: {
  emp: Employee | null;
  onClose: () => void;
  isManager: boolean;
  onEdit: (e: Employee) => void;
}) {
  const initials = emp ? getInitials(emp.full_name)    : "";
  const color    = emp ? getAvatarColor(emp.full_name) : "";

  return (
    <Sheet open={!!emp} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto" dir="rtl">
        {emp && (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold", color)}>
                    {initials}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{emp.full_name}</SheetTitle>
                    {emp.job_title && (
                      <p className="text-sm text-muted-foreground mt-0.5">{emp.job_title}</p>
                    )}
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant={emp.status === "active" ? "default" : "secondary"} className="text-xs">
                        {emp.status === "active" ? "פעיל" : "לא פעיל"}
                      </Badge>
                      {emp.employment_type && (
                        <Badge variant="outline" className="text-xs">{emp.employment_type}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {isManager && (
                  <button
                    onClick={() => onEdit(emp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" /> עריכה
                  </button>
                )}
              </div>
            </SheetHeader>

            <Tabs defaultValue="details" dir="rtl">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="details"     className="flex-1 gap-1.5"><User      className="h-4 w-4" /> פרטים</TabsTrigger>
                <TabsTrigger value="assignments" className="flex-1 gap-1.5"><Briefcase className="h-4 w-4" /> שיבוצים</TabsTrigger>
                <TabsTrigger value="salary"      className="flex-1 gap-1.5"><Banknote  className="h-4 w-4" /> שכר</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <EmployeeDetailsTab emp={emp} />
              </TabsContent>
              <TabsContent value="assignments">
                <EmployeeAssignmentsTab employeeId={emp.id} dailyCost={emp.daily_cost_estimated} />
              </TabsContent>
              <TabsContent value="salary">
                <EmployeeSalaryTab employeeId={emp.id} empName={emp.full_name} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────
   TAB: פרטים
───────────────────────────────────────── */
function EmployeeDetailsTab({ emp }: { emp: Employee }) {
  const estimatedMonthly = emp.monthly_cost_actual ?? emp.daily_cost_estimated * 22;
  const sen = calcSeniority(emp.start_date);

  const rows: { label: string; value?: string | null; dir?: "ltr"; note?: string }[] = [
    { label: "תפקיד",               value: emp.job_title },
    { label: "סוג העסקה",           value: emp.employment_type },
    { label: "טלפון",               value: emp.phone, dir: "ltr" },
    { label: 'ת"ז / מזהה',         value: emp.id_number },
    { label: "סטטוס",               value: emp.status === "active" ? "פעיל" : "לא פעיל" },
    {
      label: "תאריך התחלה",
      value: emp.start_date ? fmtDate(emp.start_date) : null,
      note:  sen ? `ותק: ${sen}` : undefined,
    },
    { label: "עלות יומית",          value: `₪${Number(emp.daily_cost_estimated).toLocaleString("he-IL")}` },
    {
      label: "עלות חודשית בפועל",
      value: emp.monthly_cost_actual
        ? `₪${Number(emp.monthly_cost_actual).toLocaleString("he-IL")}`
        : null,
    },
    {
      label: "עלות חודשית (חישוב)",
      value: `₪${Number(estimatedMonthly).toLocaleString("he-IL")}`,
      note:  !emp.monthly_cost_actual ? "× 22 ימי עבודה" : undefined,
    },
  ];

  return (
    <div className="space-y-0">
      {rows.map(({ label, value, dir, note }) =>
        value ? (
          <div key={label} className="flex justify-between items-start py-3 border-b border-border/40 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="text-start">
              <span className="text-sm font-medium" dir={dir}>{value}</span>
              {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
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

/* ─────────────────────────────────────────
   TAB: שיבוצים
   (uses lazy hook — only loads when tab is shown)
───────────────────────────────────────── */
function EmployeeAssignmentsTab({
  employeeId, dailyCost,
}: { employeeId: string; dailyCost: number }) {
  const { data: assignments = [], isLoading, isError } = useEmployeeAssignments(employeeId);

  const { totalDays, totalCost } = useMemo(() => ({
    totalDays: assignments.length,
    totalCost: assignments.reduce((s, a) => s + (a.cost_estimated ?? dailyCost), 0),
  }), [assignments, dailyCost]);

  if (isLoading) return <TabLoader />;
  if (isError)   return <TabError text="שגיאה בטעינת שיבוצים" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 p-3 text-center" style={{ background: GRADIENT_CARDS.blue }}>
          <p className="text-2xl font-bold">{totalDays}</p>
          <p className="text-xs text-muted-foreground mt-0.5">ימי עבודה</p>
        </div>
        <div className="rounded-xl border border-border/50 p-3 text-center" style={{ background: GRADIENT_CARDS.orange }}>
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
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium">{a.sites?.name ?? "אתר לא ידוע"}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 mr-5">
                  <p className="text-xs text-muted-foreground">{fmtDate(a.date)}</p>
                  {a.shift_type && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0">
                      {SHIFT_LABELS[a.shift_type] ?? a.shift_type}
                    </Badge>
                  )}
                </div>
              </div>
              <span className="text-sm font-semibold shrink-0">
                ₪{Number(a.cost_estimated ?? dailyCost).toLocaleString("he-IL")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   TAB: שכר
───────────────────────────────────────── */
function EmployeeSalaryTab({
  employeeId, empName,
}: { employeeId: string; empName: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ month: "", amount: "", notes: "" });

  const { data: salaries = [], isLoading, isError } = useEmployeeSalaries(employeeId);

  const { totalSalaries, paidCount } = useMemo(() => ({
    totalSalaries: salaries.reduce((s, r) => s + r.amount_actual, 0),
    paidCount:     salaries.filter((r) => r.is_paid).length,
  }), [salaries]);

  const addM = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("salary_records").insert({
        employee_id:  employeeId,
        month:        form.month + "-01",
        amount_actual: Number(form.amount),
        notes:        form.notes.trim() || null,
        user_id:      u.user?.id,
        is_paid:      false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("שכר נוסף בהצלחה");
      qc.invalidateQueries({ queryKey: ["employee-salaries", employeeId] });
      setForm({ month: "", amount: "", notes: "" });
      setShowForm(false);
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  const togglePaidM = useMutation({
    mutationFn: async ({ id, is_paid }: { id: string; is_paid: boolean }) => {
      const { error } = await supabase
        .from("salary_records").update({ is_paid }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { is_paid }) => {
      toast.success(is_paid ? "✓ סומן כשולם" : "סומן כלא שולם");
      qc.invalidateQueries({ queryKey: ["employee-salaries", employeeId] });
    },
    onError: (e: Error) => toast.error("עדכון נכשל", { description: e.message }),
  });

  const deleteS = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("רשומת שכר נמחקה");
      qc.invalidateQueries({ queryKey: ["employee-salaries", employeeId] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  if (isLoading) return <TabLoader />;
  if (isError)   return <TabError text="שגיאה בטעינת שכר" />;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">סה"כ שכר מוזן</p>
          <p className="text-2xl font-bold">₪{totalSalaries.toLocaleString("he-IL")}</p>
          {salaries.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {paidCount} / {salaries.length} חודשים שולמו
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white shrink-0"
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
              <Input type="month" required value={form.month}
                onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">סכום (₪)</Label>
              <Input type="number" min="0" required value={form.amount}
                placeholder="0"
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">הערות (אופציונלי)</Label>
            <Input value={form.notes} placeholder="הערות..."
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
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
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Paid toggle */}
                <button
                  onClick={() => togglePaidM.mutate({ id: sal.id, is_paid: !sal.is_paid })}
                  disabled={togglePaidM.isPending}
                  className="shrink-0 transition-colors disabled:opacity-40"
                  title={sal.is_paid ? "בטל תשלום" : "סמן כשולם"}
                >
                  {sal.is_paid
                    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                    : <Circle       className="h-5 w-5 text-muted-foreground/40 hover:text-green-500" />
                  }
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(sal.month).toLocaleDateString("he-IL", { month: "long", year: "numeric" })}
                  </p>
                  {sal.notes && <p className="text-xs text-muted-foreground truncate">{sal.notes}</p>}
                  {sal.is_paid && <p className="text-[10px] text-green-600 font-medium">שולם ✓</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-sm font-bold", sal.is_paid ? "text-green-700" : "")}>
                  ₪{Number(sal.amount_actual).toLocaleString("he-IL")}
                </span>
                <button
                  onClick={() => deleteS.mutate(sal.id)}
                  disabled={deleteS.isPending}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all disabled:opacity-40"
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

/* ─────────────────────────────────────────
   EMPLOYEE ADD / EDIT DIALOG
   Bug fix: useEffect syncs form when `editing` changes
───────────────────────────────────────── */
const EMPTY_FORM = {
  full_name:            "",
  phone:                "",
  id_number:            "",
  job_title:            "",
  employment_type:      "שכיר",
  start_date:           "",
  status:               "active" as "active" | "inactive",
  daily_cost_estimated: "0",
  monthly_cost_actual:  "",
  notes:                "",
};

function EmployeeDialog({
  editing, onClose,
}: { editing: Employee | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  // Sync form whenever the editing target changes
  useEffect(() => {
    if (editing) {
      setForm({
        full_name:            editing.full_name,
        phone:                editing.phone                   ?? "",
        id_number:            editing.id_number               ?? "",
        job_title:            editing.job_title               ?? "",
        employment_type:      editing.employment_type         ?? "שכיר",
        start_date:           editing.start_date              ?? "",
        status:               editing.status,
        daily_cost_estimated: String(editing.daily_cost_estimated ?? 0),
        monthly_cost_actual:  editing.monthly_cost_actual != null
                                ? String(editing.monthly_cost_actual)
                                : "",
        notes:                editing.notes ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editing]);

  const f = useCallback(
    <K extends keyof typeof EMPTY_FORM>(key: K, val: typeof EMPTY_FORM[K]) =>
      setForm((p) => ({ ...p, [key]: val })),
    [],
  );

  const saveM = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name:            form.full_name.trim(),
        phone:                form.phone.trim()      || null,
        id_number:            form.id_number.trim()  || null,
        job_title:            form.job_title.trim()  || null,
        employment_type:      form.employment_type,
        start_date:           form.start_date        || null,
        status:               form.status,
        daily_cost_estimated: Number(form.daily_cost_estimated) || 0,
        monthly_cost_actual:  form.monthly_cost_actual ? Number(form.monthly_cost_actual) : null,
        notes:                form.notes.trim()      || null,
      };
      if (editing) {
        const { error } = await supabase.from("employees").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("employees").insert({ ...payload, user_id: u.user?.id });
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
    <DialogContent dir="rtl" className="max-w-lg max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? "עריכת עובד" : "עובד חדש"}</DialogTitle>
        <DialogDescription>פרטי העובד, תפקיד ועלויות שכר</DialogDescription>
      </DialogHeader>

      <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="space-y-4 pt-1">

        {/* שם מלא */}
        <div className="space-y-1.5">
          <Label>שם מלא *</Label>
          <Input required value={form.full_name}
            onChange={(e) => f("full_name", e.target.value)} />
        </div>

        {/* תפקיד + סוג העסקה */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>תפקיד</Label>
            <Input value={form.job_title} placeholder="בנאי, נגר, חשמלאי..."
              onChange={(e) => f("job_title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>סוג העסקה</Label>
            <Select value={form.employment_type} onValueChange={(v) => f("employment_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">
                {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* טלפון + ת"ז */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>טלפון</Label>
            <Input dir="ltr" value={form.phone}
              onChange={(e) => f("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ת"ז / מזהה</Label>
            <Input value={form.id_number}
              onChange={(e) => f("id_number", e.target.value)} />
          </div>
        </div>

        {/* תאריך התחלה */}
        <div className="space-y-1.5">
          <Label>תאריך התחלה</Label>
          <Input type="date" value={form.start_date}
            onChange={(e) => f("start_date", e.target.value)} />
        </div>

        {/* עלויות */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>עלות יומית משוערת (₪)</Label>
            <Input type="number" min="0" step="any" value={form.daily_cost_estimated}
              onChange={(e) => f("daily_cost_estimated", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>עלות חודשית בפועל (₪)</Label>
            <Input type="number" min="0" step="any" value={form.monthly_cost_actual}
              placeholder="אופציונלי"
              onChange={(e) => f("monthly_cost_actual", e.target.value)} />
          </div>
        </div>

        {/* סטטוס */}
        <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
          <div>
            <Label className="text-sm">עובד פעיל</Label>
            <p className="text-xs text-muted-foreground">זמין לשיבוץ</p>
          </div>
          <Switch
            checked={form.status === "active"}
            onCheckedChange={(c) => f("status", c ? "active" : "inactive")}
          />
        </div>

        {/* הערות */}
        <div className="space-y-1.5">
          <Label>הערות</Label>
          <Textarea rows={2} value={form.notes}
            onChange={(e) => f("notes", e.target.value)} />
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <button
            type="submit"
            disabled={saveM.isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: GRADIENT_BTN }}
          >
            {saveM.isPending ? "שומר..." : editing ? "עדכן" : "הוסף עובד"}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/* ─────────────────────────────────────────
   MICRO HELPERS for tabs
───────────────────────────────────────── */
function TabLoader() {
  return (
    <div className="space-y-2 pt-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function TabError({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-sm text-muted-foreground">
      <div className="text-3xl mb-2">⚠️</div>
      {text}
    </div>
  );
}
