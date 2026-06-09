import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp,
  DollarSign, TrendingUp, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

// ── Types ──────────────────────────────────────────────────────────────────────

type PaymentMethod = "cash" | "bank_transfer" | "check" | "credit_card" | "other";

type Payment = {
  id: string;
  site_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod | null;
  reference: string | null;
  notes: string | null;
  user_id: string | null;
  sites: {
    name: string;
    contract_price: number | null;
    client_id: string | null;
    clients: { full_name: string } | null;
  } | null;
};

type ClientBalance = {
  id: string;
  full_name: string;
  total_invoiced: number;
  total_paid: number;
  balance_due: number;
  total_sites: number;
};

type ClientLite = { id: string; full_name: string };
type SiteLite = { id: string; name: string; client_id: string | null };

// ── Constants ─────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "מזומן",
  bank_transfer: "העברה בנקאית",
  check: "צ'ק",
  credit_card: "כרטיס אשראי",
  other: "אחר",
};

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "מזומן" },
  { value: "bank_transfer", label: "העברה בנקאית" },
  { value: "check", label: "צ'ק" },
  { value: "credit_card", label: "כרטיס אשראי" },
  { value: "other", label: "אחר" },
];

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL");
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PaymentsPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();

  // GAP-023: filter state
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);

  // GAP-018: expanded clients in by-client tab
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  // Fetch all payment records with site + client names
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, sites(name, contract_price, client_id, clients(full_name))")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });

  // Stats from client_balance view (global, unfiltered)
  const { data: balanceRows = [] } = useQuery({
    queryKey: ["client-balance-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_balance")
        .select("id, full_name, total_invoiced, total_paid, balance_due, total_sites")
        .order("balance_due", { ascending: false });
      if (error) throw error;
      return data as ClientBalance[];
    },
  });

  // Clients for filter dropdown + dialog
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, full_name").order("full_name");
      return (data ?? []) as ClientLite[];
    },
  });

  // Sites for dialog
  const { data: sites = [] } = useQuery({
    queryKey: ["sites-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name, client_id").order("name");
      return (data ?? []) as SiteLite[];
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
      qc.invalidateQueries({ queryKey: ["client-balance-payments"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  // GAP-023: Multi-criteria filtered list
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (clientFilter !== "all" && p.sites?.client_id !== clientFilter) return false;
      if (methodFilter !== "all" && p.payment_method !== methodFilter) return false;
      if (dateFrom && p.payment_date < dateFrom) return false;
      if (dateTo && p.payment_date > dateTo) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const clientName = p.sites?.clients?.full_name ?? "";
        const siteName = p.sites?.name ?? "";
        if (
          !clientName.toLowerCase().includes(q) &&
          !siteName.toLowerCase().includes(q) &&
          !(p.reference ?? "").toLowerCase().includes(q) &&
          !(p.notes ?? "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [payments, clientFilter, methodFilter, dateFrom, dateTo, search]);

  // Global stats from client_balance
  const totalInvoiced = balanceRows.reduce((s, b) => s + Number(b.total_invoiced), 0);
  const totalPaid = balanceRows.reduce((s, b) => s + Number(b.total_paid), 0);
  const totalDebt = balanceRows.reduce((s, b) => s + Math.max(0, Number(b.balance_due)), 0);

  // GAP-018: by-client data from client_balance view + payments breakdown per site
  const byClient = useMemo(() => {
    return balanceRows
      .filter((b) => Number(b.total_invoiced) > 0 || Number(b.total_paid) > 0)
      .map((b) => {
        // Group payments for this client by site
        const clientPayments = payments.filter((p) => p.sites?.client_id === b.id);
        const siteMap = new Map<string, { siteName: string; contractPrice: number; paid: number }>();
        for (const p of clientPayments) {
          const sid = p.site_id ?? "__none__";
          const prev = siteMap.get(sid) ?? {
            siteName: p.sites?.name ?? "ללא אתר",
            contractPrice: Number(p.sites?.contract_price ?? 0),
            paid: 0,
          };
          siteMap.set(sid, { ...prev, paid: prev.paid + Number(p.amount) });
        }
        return {
          ...b,
          bySite: Array.from(siteMap.entries()).map(([siteId, s]) => ({
            siteId,
            siteName: s.siteName,
            contractPrice: s.contractPrice,
            paid: s.paid,
            balance: s.contractPrice - s.paid,
          })),
        };
      });
  }, [balanceRows, payments]);

  const hasActiveFilters =
    clientFilter !== "all" || methodFilter !== "all" || dateFrom || dateTo || search.trim().length > 0;

  const toggleExpand = (id: string) =>
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const clearFilters = () => {
    setSearch(""); setClientFilter("all"); setMethodFilter("all");
    setDateFrom(""); setDateTo("");
  };

  return (
    <div className="space-y-5">
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">סך חוזים</p>
            </div>
            <p className="text-2xl font-bold">{fmt(totalInvoiced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground">סך תקבולים</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">חובות פתוחים</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{fmt(totalDebt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="all" dir="rtl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="all">כל התשלומים</TabsTrigger>
            <TabsTrigger value="by-client">לפי לקוח</TabsTrigger>
          </TabsList>
          {isManager && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> תשלום חדש</Button>
              </DialogTrigger>
              <PaymentDialog
                editing={editing}
                clients={clients}
                sites={sites}
                onClose={() => { setDialogOpen(false); setEditing(null); }}
              />
            </Dialog>
          )}
        </div>

        {/* ── GAP-023: Advanced filters ── */}
        <div className="mt-3 flex flex-wrap gap-2 items-end">
          {/* Text search */}
          <div className="relative w-52">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="לקוח / אתר / אסמכתא..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-3 pe-9 h-8 text-sm"
            />
          </div>

          {/* Client filter */}
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="כל הלקוחות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הלקוחות</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Method filter */}
          <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as PaymentMethod | "all")}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="אמצעי תשלום" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל האמצעים</SelectItem>
              {METHOD_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 h-8 text-xs"
              title="מתאריך"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 h-8 text-xs"
              title="עד תאריך"
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearFilters}>
              נקה סינון
            </Button>
          )}
        </div>

        {/* ── All Payments Tab ── */}
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground">לא נמצאו תשלומים תואמים</p>
                    <Button variant="outline" className="mt-3" onClick={clearFilters}>נקה סינון</Button>
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
              {filtered.map((p) => (
                <Card key={p.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {p.sites?.clients?.full_name ?? "—"}
                          </span>
                          <span className="text-muted-foreground text-xs">←</span>
                          <span className="text-sm text-muted-foreground">{p.sites?.name ?? "—"}</span>
                          {p.payment_method && (
                            <Badge variant="outline" className="text-xs">
                              {METHOD_LABELS[p.payment_method]}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-4 text-sm">
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground">סכום</p>
                            <p className="font-semibold text-green-600">{fmt(p.amount)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground">תאריך</p>
                            <p className="font-medium">{fmtDate(p.payment_date)}</p>
                          </div>
                          {p.reference && (
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground">אסמכתא</p>
                              <p className="font-medium text-xs">{p.reference}</p>
                            </div>
                          )}
                          {p.notes && (
                            <div className="max-w-xs">
                              <p className="text-[10px] uppercase text-muted-foreground">הערות</p>
                              <p className="text-xs text-muted-foreground truncate">{p.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {isManager && (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => { setEditing(p); setDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>למחוק תשלום?</AlertDialogTitle>
                                  <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteM.mutate(p.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    מחק
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── GAP-018: By Client Tab ── */}
        <TabsContent value="by-client" className="mt-4">
          {byClient.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">אין נתוני לקוחות</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {byClient.map((c) => {
                const isExpanded = expandedClients.has(c.id);
                const pct = Number(c.total_invoiced) > 0
                  ? Math.round((Number(c.total_paid) / Number(c.total_invoiced)) * 100)
                  : 0;
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
                          <div className="shrink-0">
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="text-right">
                            <h3 className="font-semibold">{c.full_name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.total_sites} אתרים</p>
                            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden w-28">
                              <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% שולם</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm shrink-0">
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-muted-foreground">הסכם</p>
                            <p className="font-semibold">{fmt(Number(c.total_invoiced))}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-muted-foreground">שולם</p>
                            <p className="font-semibold text-green-600">{fmt(Number(c.total_paid))}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-muted-foreground">יתרה</p>
                            <p className={`font-semibold text-lg ${Number(c.balance_due) > 0 ? "text-destructive" : "text-green-600"}`}>
                              {fmt(Number(c.balance_due))}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* GAP-018: Per-site breakdown */}
                      {isExpanded && c.bySite.length > 0 && (
                        <div className="border-t bg-muted/20">
                          {c.bySite.map((site) => {
                            const sitePct = site.contractPrice > 0
                              ? Math.round((site.paid / site.contractPrice) * 100)
                              : 0;
                            return (
                              <div key={site.siteId} className="px-4 py-3 border-b last:border-b-0">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{site.siteName}</p>
                                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden w-28">
                                      <div
                                        className="h-full rounded-full bg-green-500"
                                        style={{ width: `${sitePct}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{sitePct}% שולם</p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3 text-sm shrink-0">
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted-foreground">חוזה</p>
                                      <p className="font-medium text-xs">{fmt(site.contractPrice)}</p>
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

                      {isExpanded && c.bySite.length === 0 && (
                        <div className="border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                          אין תשלומים מפורטים לאתרים
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

// ── Payment Dialog ─────────────────────────────────────────────────────────────

function PaymentDialog({
  editing, clients, sites, onClose,
}: {
  editing: Payment | null;
  clients: ClientLite[];
  sites: SiteLite[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_id: editing?.sites?.client_id ?? "",
    site_id: editing?.site_id ?? "",
    amount: editing?.amount?.toString() ?? "",
    payment_date: editing?.payment_date ?? new Date().toISOString().slice(0, 10),
    payment_method: (editing?.payment_method ?? "bank_transfer") as PaymentMethod,
    reference: editing?.reference ?? "",
    notes: editing?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredSites = form.client_id
    ? sites.filter((s) => s.client_id === form.client_id)
    : sites;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.client_id) next.client_id = "נדרש לבחור לקוח";
    if (!form.site_id) next.site_id = "נדרש לבחור אתר";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      next.amount = "סכום חייב להיות מספר חיובי";
    if (!form.payment_date) next.payment_date = "נדרש תאריך תשלום";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const payload = {
        site_id: form.site_id,
        amount: Number(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference: form.reference.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("payments").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("payments").insert({ ...payload, user_id: u.user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "תשלום עודכן" : "תשלום נוסף");
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["client-balance-payments"] });
      qc.invalidateQueries({ queryKey: ["client-balance-summary"] });
      onClose();
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) saveM.mutate();
  };

  return (
    <DialogContent dir="rtl" className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{editing ? "עריכת תשלום" : "תשלום חדש"}</DialogTitle>
        <DialogDescription>רישום קבלת תשלום מלקוח עבור אתר</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client + Site */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>לקוח <span className="text-destructive">*</span></Label>
            <Select
              value={form.client_id}
              onValueChange={(v) => setForm({ ...form, client_id: v, site_id: "" })}
            >
              <SelectTrigger className={errors.client_id ? "border-destructive" : ""}>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && <p className="text-xs text-destructive">{errors.client_id}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>אתר <span className="text-destructive">*</span></Label>
            <Select
              value={form.site_id}
              onValueChange={(v) => setForm({ ...form, site_id: v })}
              disabled={filteredSites.length === 0}
            >
              <SelectTrigger className={errors.site_id ? "border-destructive" : ""}>
                <SelectValue placeholder={form.client_id ? "בחר אתר" : "בחר לקוח תחילה"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.site_id && <p className="text-xs text-destructive">{errors.site_id}</p>}
          </div>
        </div>

        {/* Amount + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>סכום (₪) <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={form.amount}
              onChange={(e) => { setForm({ ...form, amount: e.target.value }); setErrors({ ...errors, amount: "" }); }}
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>תאריך תשלום <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={form.payment_date}
              onChange={(e) => { setForm({ ...form, payment_date: e.target.value }); setErrors({ ...errors, payment_date: "" }); }}
              className={errors.payment_date ? "border-destructive" : ""}
            />
            {errors.payment_date && <p className="text-xs text-destructive">{errors.payment_date}</p>}
          </div>
        </div>

        {/* Method + Reference */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>אמצעי תשלום</Label>
            <Select
              value={form.payment_method}
              onValueChange={(v) => setForm({ ...form, payment_method: v as PaymentMethod })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>אסמכתא</Label>
            <Input
              placeholder="מספר צ'ק / אסמכתא..."
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label>הערות</Label>
          <Textarea
            rows={2}
            placeholder="הערות נוספות..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={saveM.isPending}>
            ביטול
          </Button>
          <Button type="submit" disabled={saveM.isPending}>
            {saveM.isPending ? "שומר..." : editing ? "עדכן תשלום" : "הוסף תשלום"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
