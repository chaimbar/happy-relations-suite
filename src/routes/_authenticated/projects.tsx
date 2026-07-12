import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, MapPin, Search, Calendar as CalIcon, Building2,
  ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, DollarSign,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

type Project = {
  id: string;
  name: string;
  client_id: string | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_price: number;
  materials_cost: number;
  status: "active" | "completed" | "paused" | "cancelled";
  notes: string | null;
};

type Stage = {
  id: string;
  site_id: string;
  name: string;
  payment_amount: number | null;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  notes: string | null;
  sort_order: number | null;
};

type Addition = {
  id: string;
  site_id: string;
  description: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "billed";
  notes: string | null;
};

const ADDITION_STATUS: Record<Addition["status"], { label: string; color: string }> = {
  pending:  { label: "ממתין",  color: "text-amber-600" },
  approved: { label: "אושר",   color: "text-blue-600" },
  billed:   { label: "חויב",   color: "text-green-600" },
};


type ClientLite = { id: string; full_name: string };

const STATUS_LABEL: Record<Project["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  active:    { label: "פעיל",    variant: "default" },
  paused:    { label: "מושהה",   variant: "outline" },
  completed: { label: "הסתיים",  variant: "secondary" },
  cancelled: { label: "בוטל",    variant: "outline" },
};

const STATUS_FILTERS: { value: Project["status"] | "all"; label: string }[] = [
  { value: "all",       label: "הכל" },
  { value: "active",    label: "פעיל" },
  { value: "paused",    label: "מושהה" },
  { value: "completed", label: "הסתיים" },
  { value: "cancelled", label: "בוטל" },
];

const STAGE_STATUS_LABELS: Record<Stage["status"], { label: string; icon: typeof Circle }> = {
  pending:     { label: "ממתין",    icon: Circle },
  in_progress: { label: "בביצוע",   icon: Clock },
  completed:   { label: "הושלם",    icon: CheckCircle2 },
};

const STAGE_STATUS_COLORS: Record<Stage["status"], string> = {
  pending:     "text-muted-foreground",
  in_progress: "text-amber-600",
  completed:   "text-green-600",
};

const PRESET_STAGES = ["שחור", "לבן", "גבס", "פינישים", "חוץ", "גגות", "ריצוף"];

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

function ProjectsPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Project["status"] | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [expandedAdditions, setExpandedAdditions] = useState<Set<string>>(new Set());


  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, full_name").order("full_name");
      if (error) throw error;
      return data as ClientLite[];
    },
  });

  const { data: allStages = [] } = useQuery({
    queryKey: ["all-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_stages").select("*").order("sort_order").order("created_at");
      if (error) throw error;
      return data as Stage[];
    },
  });

  const clientMap = new Map(clients.map((c) => [c.id, c.full_name]));
  const stagesBySite = new Map<string, Stage[]>();
  for (const s of allStages) {
    if (!stagesBySite.has(s.site_id)) stagesBySite.set(s.site_id, []);
    stagesBySite.get(s.site_id)!.push(s);
  }

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("אתר נמחק");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  const filtered = projects.filter((p) => {
    const matchesSearch = [p.name, p.address, clientMap.get(p.client_id ?? "")].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    );
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleStages = (id: string) =>
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">אתרים</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "טוען..." : (
                filtered.length === projects.length
                  ? `${projects.length} אתרים`
                  : `${filtered.length} מתוך ${projects.length} אתרים`
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="חיפוש לפי שם, כתובת, לקוח..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          {isManager && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> אתר חדש</Button>
              </DialogTrigger>
              <ProjectDialog
                editing={editing}
                clients={clients}
                onClose={() => { setDialogOpen(false); setEditing(null); }}
              />
            </Dialog>
          )}
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {f.label}
            {f.value !== "all" && (
              <span className="mr-1.5 text-xs opacity-70">
                ({projects.filter((p) => p.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <div className="pt-3 border-t grid grid-cols-3 gap-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>
            </div>
            {search || statusFilter !== "all" ? (
              <>
                <p className="text-base font-medium">לא נמצאו אתרים תואמים</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
                  נקה פילטרים
                </Button>
              </>
            ) : (
              <>
                <p className="text-base font-medium">אין אתרים עדיין</p>
                {isManager && (
                  <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" /> הוסף אתר ראשון
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {filtered.map((p) => {
            const status = STATUS_LABEL[p.status];
            const profitEstimate = Number(p.contract_price) - Number(p.materials_cost);
            const stages = stagesBySite.get(p.id) ?? [];
            const stagesExpanded = expandedStages.has(p.id);
            const completedStages = stages.filter((s) => s.status === "completed").length;
            const paidInStages = stages.reduce((s, st) =>
              st.status === "completed" ? s + Number(st.payment_amount ?? 0) : s, 0);

            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-base truncate">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                        {p.client_id && (
                          <span className="text-xs text-muted-foreground">{clientMap.get(p.client_id)}</span>
                        )}
                      </div>
                    </div>
                    {isManager && (
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setDialogOpen(true); }} title="עריכה">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" title="מחיקה">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>למחוק את {p.name}?</AlertDialogTitle>
                                <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteM.mutate(p.id)}>מחק</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {p.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.address}</span>
                      </div>
                    )}
                    {(p.start_date || p.end_date) && (
                      <div className="flex items-center gap-2">
                        <CalIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {p.start_date ?? "—"}
                          {p.end_date && <span className="text-muted-foreground/60"> — {p.end_date}</span>}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financials */}
                  <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">הכנסה</p>
                      <p className="font-semibold">{fmt(p.contract_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">חומרים</p>
                      <p className="font-semibold">{fmt(p.materials_cost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">רווח גס</p>
                      <p className={`font-semibold ${profitEstimate >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {fmt(profitEstimate)}
                      </p>
                    </div>
                  </div>

                  {/* Stages section */}
                  <div className="mt-3 pt-3 border-t">
                    <button
                      className="w-full flex items-center justify-between text-sm font-medium hover:text-primary transition-colors"
                      onClick={() => toggleStages(p.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span>שלבים</span>
                        {stages.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({completedStages}/{stages.length} הושלמו
                            {paidInStages > 0 && ` · ${fmt(paidInStages)} שולם`})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isManager && (
                          <span className="text-xs text-primary">+ הוסף</span>
                        )}
                        {stagesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>

                    {stagesExpanded && (
                      <StagesPanel
                        siteId={p.id}
                        stages={stages}
                        isManager={isManager}
                        isAdmin={isAdmin}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Stages Panel ──────────────────────────────────────────────────────────────

function StagesPanel({
  siteId, stages, isManager, isAdmin,
}: { siteId: string; stages: Stage[]; isManager: boolean; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editStage, setEditStage] = useState<Stage | null>(null);

  const updateStatusM = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Stage["status"] }) => {
      const { error } = await supabase.from("site_stages").update({
        status,
        completed_at: status === "completed" ? new Date().toISOString().slice(0, 10) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-stages"] }),
    onError: (e: Error) => toast.error("עדכון נכשל", { description: e.message }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("שלב נמחק");
      qc.invalidateQueries({ queryKey: ["all-stages"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  return (
    <div className="mt-3 space-y-2">
      {stages.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          אין שלבים — לחץ "הוסף" להגדרת שלבי הפרויקט
        </p>
      )}
      {stages.map((s) => {
        const StIcon = STAGE_STATUS_LABELS[s.status].icon;
        return (
          <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40 group">
            {isManager ? (
              <button
                className={`shrink-0 ${STAGE_STATUS_COLORS[s.status]} hover:opacity-70 transition-opacity`}
                onClick={() => {
                  const next: Stage["status"] = s.status === "pending" ? "in_progress"
                    : s.status === "in_progress" ? "completed" : "pending";
                  updateStatusM.mutate({ id: s.id, status: next });
                }}
                title="לחץ לשינוי סטטוס"
              >
                <StIcon className="h-4 w-4" />
              </button>
            ) : (
              <StIcon className={`h-4 w-4 shrink-0 ${STAGE_STATUS_COLORS[s.status]}`} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${s.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {s.name}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-1.5 ${STAGE_STATUS_COLORS[s.status]} border-current/30`}
                >
                  {STAGE_STATUS_LABELS[s.status].label}
                </Badge>
              </div>
              {s.payment_amount && (
                <div className="flex items-center gap-1 mt-0.5">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{fmt(s.payment_amount)}</span>
                  {s.completed_at && (
                    <span className="text-[10px] text-muted-foreground">· שולם {s.completed_at}</span>
                  )}
                </div>
              )}
            </div>
            {isManager && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setEditStage(s)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>למחוק שלב "{s.name}"?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteM.mutate(s.id)}>מחק</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isManager && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs border-dashed"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-3 w-3 ml-1" /> הוסף שלב
        </Button>
      )}

      <StageDialog
        open={addOpen || !!editStage}
        siteId={siteId}
        editing={editStage}
        sortOrder={stages.length}
        onClose={() => { setAddOpen(false); setEditStage(null); }}
      />
    </div>
  );
}

// ── Stage Dialog ──────────────────────────────────────────────────────────────

function StageDialog({
  open, siteId, editing, sortOrder, onClose,
}: {
  open: boolean;
  siteId: string;
  editing: Stage | null;
  sortOrder: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    payment_amount: editing?.payment_amount != null ? editing.payment_amount.toString() : "",
    status: (editing?.status ?? "pending") as Stage["status"],
    notes: editing?.notes ?? "",
  });

  // Sync form whenever the editing target changes (mirrors EmployeeDialog fix)
  useEffect(() => {
    setForm({
      name: editing?.name ?? "",
      payment_amount: editing?.payment_amount != null ? editing.payment_amount.toString() : "",
      status: (editing?.status ?? "pending") as Stage["status"],
      notes: editing?.notes ?? "",
    });
  }, [editing]);

  const saveM = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        name: form.name.trim(),
        payment_amount: form.payment_amount ? Number(form.payment_amount) : null,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("site_stages").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_stages").insert({
          ...payload, site_id: siteId, sort_order: sortOrder, user_id: u.user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "שלב עודכן" : "שלב נוסף");
      qc.invalidateQueries({ queryKey: ["all-stages"] });
      onClose();
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "עריכת שלב" : "שלב חדש"}</DialogTitle>
          <DialogDescription>הגדר שלב בפרויקט ותשלום מקביל</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>שם השלב *</Label>
            <div className="flex gap-2 flex-wrap mb-1">
              {PRESET_STAGES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, name: p })}
                  className="text-xs px-2 py-0.5 rounded-full border hover:bg-muted transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
            <Input
              required
              placeholder="שחור / לבן / גבס..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>סכום תשלום (₪)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={form.payment_amount}
                onChange={(e) => setForm({ ...form, payment_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Stage["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">ממתין</SelectItem>
                  <SelectItem value="in_progress">בביצוע</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={saveM.isPending || !form.name.trim()}>
              {saveM.isPending ? "שומר..." : editing ? "עדכן" : "הוסף"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Project Dialog ─────────────────────────────────────────────────────────────

function ProjectDialog({
  editing, clients, onClose,
}: { editing: Project | null; clients: ClientLite[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    client_id: editing?.client_id ?? "",
    address: editing?.address ?? "",
    start_date: editing?.start_date ?? "",
    end_date: editing?.end_date ?? "",
    contract_price: editing?.contract_price != null ? editing.contract_price.toString() : "",
    materials_cost: editing?.materials_cost != null ? editing.materials_cost.toString() : "",
    status: editing?.status ?? "active",
    notes: editing?.notes ?? "",
  });

  // Sync form whenever the editing target changes (mirrors EmployeeDialog fix)
  useEffect(() => {
    setForm({
      name: editing?.name ?? "",
      client_id: editing?.client_id ?? "",
      address: editing?.address ?? "",
      start_date: editing?.start_date ?? "",
      end_date: editing?.end_date ?? "",
      contract_price: editing?.contract_price != null ? editing.contract_price.toString() : "",
      materials_cost: editing?.materials_cost != null ? editing.materials_cost.toString() : "",
      status: editing?.status ?? "active",
      notes: editing?.notes ?? "",
    });
  }, [editing]);

  const saveM = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!form.client_id) throw new Error("יש לבחור לקוח");
      const payload = {
        name: form.name.trim(),
        client_id: form.client_id,
        address: form.address.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        contract_price: form.contract_price === "" ? 0 : Number(form.contract_price),
        materials_cost: form.materials_cost === "" ? 0 : Number(form.materials_cost),
        status: form.status as Project["status"],
        notes: form.notes.trim() || null,
        user_id: u.user!.id,
      };
      if (editing) {
        const { error } = await supabase.from("sites").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sites").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "אתר עודכן" : "אתר נוסף");
      qc.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  return (
    <DialogContent dir="rtl" className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? "עריכת אתר" : "אתר חדש"}</DialogTitle>
        <DialogDescription>פרטי הפרויקט, לקוח, תאריכים ועלויות</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="space-y-4">
        <div className="space-y-2">
          <Label>שם אתר *</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>לקוח *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
              <SelectTrigger><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>סטטוס</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Project["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="paused">מושהה</SelectItem>
                <SelectItem value="completed">הסתיים</SelectItem>
                <SelectItem value="cancelled">בוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>כתובת</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>תאריך התחלה</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>תאריך סיום</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>מחיר חוזה (₪)</Label>
            <Input type="number" min="0" step="any" value={form.contract_price}
              onChange={(e) => setForm({ ...form, contract_price: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>עלות חומרים (₪)</Label>
            <Input type="number" min="0" step="any" value={form.materials_cost}
              onChange={(e) => setForm({ ...form, materials_cost: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>הערות</Label>
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saveM.isPending}>
            {saveM.isPending ? "שומר..." : editing ? "עדכן" : "הוסף"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
