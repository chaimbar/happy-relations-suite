import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, TrendingDown, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsPage,
});

type Payment = {
  id: string;
  client_id: string;
  project_id: string;
  total_amount: number;
  paid_amount: number;
  status: "pending" | "partial" | "paid";
  payment_date: string | null;
  notes: string | null;
  clients: { name: string } | null;
  projects: { name: string } | null;
};

type ClientLite = { id: string; name: string };
type ProjectLite = { id: string; name: string; client_id: string | null };

const STATUS_MAP = {
  pending:  { label: "ממתין",  variant: "destructive" as const, icon: Clock },
  partial:  { label: "חלקי",   variant: "outline" as const,     icon: TrendingDown },
  paid:     { label: "שולם",   variant: "secondary" as const,   icon: CheckCircle },
};

const STATUS_FILTERS: { value: "all" | Payment["status"]; label: string }[] = [
  { value: "all",     label: "הכל" },
  { value: "pending", label: "ממתין" },
  { value: "partial", label: "חלקי" },
  { value: "paid",    label: "שולם" },
];

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

function PaymentsPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Payment["status"]>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  // GAP-018: track which client rows are expanded in by-client tab
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, clients(name), projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data as ClientLite[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name, client_id").order("name");
      if (error) throw error;
      return data as ProjectLite[];
    },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("תשלום נמחק");
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  // GAP-023: Multi-criteria filter
  const filtered = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (clientFilter !== "all" && p.client_id !== clientFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return [p.clients?.name, p.projects?.name, p.notes].some((v) =>
        v?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats (always from all payments, not filtered)
  const totalDebt = payments.reduce((s, p) => s + (Number(p.total_amount) - Number(p.paid_amount)), 0);
  const totalCollected = payments.reduce((s, p) => s + Number(p.paid_amount), 0);
  const openCount = payments.filter((p) => p.status !== "paid").length;

  // GAP-018: Group by client → by project for the expanded view
  const byClient = clients.map((c) => {
    const clientPayments = payments.filter((p) => p.client_id === c.id);
    if (clientPayments.length === 0) return null;

    const total = clientPayments.reduce((s, p) => s + Number(p.total_amount), 0);
    const paid = clientPayments.reduce((s, p) => s + Number(p.paid_amount), 0);
    const balance = total - paid;

    // Group by project within client
    const bySite = Object.values(
      clientPayments.reduce((acc, p) => {
        const key = p.project_id || "__none__";
        if (!acc[key]) {
          acc[key] = {
            projectId: key,
            projectName: p.projects?.name ?? "ללא פרויקט",
            rows: [] as Payment[],
          };
        }
        acc[key].rows.push(p);
        return acc;
      }, {} as Record<string, { projectId: string; projectName: string; rows: Payment[] }>)
    ).map((site) => ({
      ...site,
      total: site.rows.reduce((s, p) => s + Number(p.total_amount), 0),
      paid: site.rows.reduce((s, p) => s + Number(p.paid_amount), 0),
      balance: site.rows.reduce((s, p) => s + Number(p.total_amount) - Number(p.paid_amount), 0),
    }));

    return { id: c.id, name: c.name, total, paid, balance, bySite };
  }).filter(Boolean).sort((a, b) => b!.balance - a!.balance) as {
    id: string; name: string; total: number; paid: number; balance: number;
    bySite: { projectId: string; projectName: string; rows: Payment[]; total: number; paid: number; balance: number }[];
  }[];

  const toggleExpand = (id: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hasActiveFilters = statusFilter !== "all" || clientFilter !== "all" || search.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">חובות פתוחים</p>
            <p className="text-2xl font-bold text-destructive">{fmt(totalDebt)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{openCount} רשומות פתוחות</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">סך תקבולים</p>
            <p className="text-2xl font-bold text-green-600">{fmt(totalCollected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">סך חוזים</p>
            <p className="text-2xl font-bold">{fmt(totalCollected + totalDebt)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" dir="rtl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="all">כל התשלומים</TabsTrigger>
            <TabsTrigger value="by-client">לפי לקוח</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {isManager && (
              <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4" /> תשלום חדש</Button>
                </DialogTrigger>
                <PaymentDialog
                  editing={editing}
                  clients={clients}
                  projects={projects}
                  onClose={() => { setDialogOpen(false); setEditing(null); }}
                />
              </Dialog>
            )}
          </div>
        </div>

        {/* GAP-023: Advanced filters row */}
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {/* Text search */}
          <div className="relative w-56">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לקוח / פרויקט..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-3 pe-9"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Client filter */}
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="כל הלקוחות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הלקוחות</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => { setSearch(""); setStatusFilter("all"); setClientFilter("all"); }}
            >
              נקה סינון
            </Button>
          )}
        </div>

        {/* All payments tab */}
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground">לא נמצאו תשלומים תואמים</p>
                    <Button variant="outline" className="mt-3" onClick={() => { setSearch(""); setStatusFilter("all"); setClientFilter("all"); }}>
                      נקה סינון
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">לא נמצאו תשלומים</p>
                    {isManager && (
                      <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4" /> הוסף תשלום ראשון
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {hasActiveFilters && (
                <p className="text-xs text-muted-foreground mb-1">
                  מציג {filtered.length} מתוך {payments.length} תשלומים
                </p>
              )}
              {filtered.map((p) => {
                const balance = Number(p.total_amount) - Number(p.paid_amount);
                const pct = p.total_amount > 0 ? Math.round((Number(p.paid_amount) / Number(p.total_amount)) * 100) : 0;
                const s = STATUS_MAP[p.status];
                return (
                  <Card key={p.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{p.clients?.name ?? "—"}</span>
                            <span className="text-muted-foreground text-sm">←</span>
                            <span className="text-sm text-muted-foreground">{p.projects?.name ?? "—"}</span>
                            <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground">סכום כולל</p>
                              <p className="font-semibold">{fmt(p.total_amount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground">שולם</p>
                              <p className="font-semibold text-green-600">{fmt(p.paid_amount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground">יתרה</p>
                              <p className={`font-semibold ${balance > 0 ? "text-destructive" : "text-green-600"}`}>
                                {fmt(balance)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% שולם</p>
                        </div>
                        {isManager && (
                          <div className="flex gap-1 shrink-0">
                            <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>למחוק תשלום?</AlertDialogTitle>
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* GAP-018: By client with per-site breakdown */}
        <TabsContent value="by-client" className="mt-4">
          {byClient.length === 0 ? (
            <Card><CardContent className="text-center py-12 text-muted-foreground">אין נתונים</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {byClient.map((c) => {
                const isExpanded = expandedClients.has(c.id);
                return (
                  <Card key={c.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-0">
                      {/* Client header row */}
                      <button
                        className="w-full p-4 flex items-center justify-between gap-3 text-right"
                        onClick={() => toggleExpand(c.id)}
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div>
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                          </div>
                          <div className="text-right">
                            <h3 className="font-semibold">{c.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.bySite.length} אתרים</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm shrink-0">
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-muted-foreground">סכום כולל</p>
                            <p className="font-semibold">{fmt(c.total)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-muted-foreground">שולם</p>
                            <p className="font-semibold text-green-600">{fmt(c.paid)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-muted-foreground">יתרה</p>
                            <p className={`font-semibold text-lg ${c.balance > 0 ? "text-destructive" : "text-green-600"}`}>
                              {fmt(c.balance)}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* GAP-018: Per-site breakdown (expanded) */}
                      {isExpanded && (
                        <div className="border-t bg-muted/20">
                          {c.bySite.map((site) => {
                            const sitePct = site.total > 0
                              ? Math.round((site.paid / site.total) * 100)
                              : 0;
                            return (
                              <div key={site.projectId} className="px-4 py-3 border-b last:border-b-0">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{site.projectName}</p>
                                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden w-32">
                                      <div
                                        className="h-full rounded-full bg-green-500"
                                        style={{ width: `${sitePct}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{sitePct}% שולם</p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3 text-sm shrink-0">
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted-foreground">כולל</p>
                                      <p className="font-medium text-xs">{fmt(site.total)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted-foreground">שולם</p>
                                      <p className="font-medium text-xs text-green-600">{fmt(site.paid)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted-foreground">יתרה</p>
                                      <p className={`font-medium text-xs ${site.balance > 0 ? "text-destructive" : "text-green-600"}`}>
                                        {fmt(site.balance)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentDialog({
  editing, clients, projects, onClose,
}: {
  editing: Payment | null;
  clients: ClientLite[];
  projects: ProjectLite[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_id: editing?.client_id ?? "",
    project_id: editing?.project_id ?? "",
    total_amount: editing?.total_amount?.toString() ?? "0",
    paid_amount: editing?.paid_amount?.toString() ?? "0",
    status: editing?.status ?? "pending",
    payment_date: editing?.payment_date ?? "",
    notes: editing?.notes ?? "",
  });

  const filteredProjects = form.client_id
    ? projects.filter((p) => p.client_id === form.client_id)
    : projects;

  const saveM = useMutation({
    mutationFn: async () => {
      const totalAmt = Number(form.total_amount) || 0;
      const paidAmt = Number(form.paid_amount) || 0;
      let status: Payment["status"] = "pending";
      if (paidAmt >= totalAmt && totalAmt > 0) status = "paid";
      else if (paidAmt > 0) status = "partial";

      const payload = {
        client_id: form.client_id,
        project_id: form.project_id,
        total_amount: totalAmt,
        paid_amount: paidAmt,
        status,
        payment_date: form.payment_date || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("payments").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("payments").insert({ ...payload, created_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "תשלום עודכן" : "תשלום נוסף");
      qc.invalidateQueries({ queryKey: ["payments"] });
      onClose();
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  return (
    <DialogContent dir="rtl" className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{editing ? "עריכת תשלום" : "תשלום חדש"}</DialogTitle>
        <DialogDescription>מעקב תשלומים לפרויקט</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>לקוח *</Label>
            <Select required value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, project_id: "" })}>
              <SelectTrigger><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>פרויקט *</Label>
            <Select required value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="בחר פרויקט" /></SelectTrigger>
              <SelectContent>
                {filteredProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>סכום כולל (₪)</Label>
            <Input type="number" min="0" step="any" value={form.total_amount}
              onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>שולם עד כה (₪)</Label>
            <Input type="number" min="0" step="any" value={form.paid_amount}
              onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>תאריך תשלום אחרון</Label>
          <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>הערות</Label>
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saveM.isPending || !form.client_id || !form.project_id}>
            {saveM.isPending ? "שומר..." : editing ? "עדכן" : "הוסף"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
