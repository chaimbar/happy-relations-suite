import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Phone, Mail, Search, Users, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { exportToCsv } from "@/lib/export-csv";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/clients")({
  component: ClientsPage,
});

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

// GAP-007: from client_balance view
type ClientBalance = {
  id: string;
  total_invoiced: number;
  total_paid: number;
  balance_due: number;
  total_sites: number;
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return ((parts[0][0] ?? "") + (parts[1][0] ?? "")).toUpperCase();
  return (name.trim().slice(0, 2) || "?").toUpperCase();
}

function getAvatarColor(name: string | null | undefined) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

function ClientsPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  // GAP-007: Financial summary from client_balance view
  const { data: balanceRows = [] } = useQuery({
    queryKey: ["client-balance-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_balance")
        .select("id, total_invoiced, total_paid, balance_due, total_sites");
      if (error) throw error;
      return data as ClientBalance[];
    },
  });

  const balanceMap = new Map(balanceRows.map((b) => [b.id, b]));

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      // A client can't be deleted while sites/payments still reference it (FK RESTRICT).
      // Check first so we can show a clear message instead of a raw SQL error.
      const [sitesRes, paysRes] = await Promise.all([
        supabase.from("sites").select("id", { count: "exact", head: true }).eq("client_id", id),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("client_id", id),
      ]);
      const siteCount = sitesRes.count ?? 0;
      const payCount = paysRes.count ?? 0;
      if (siteCount > 0 || payCount > 0) {
        const parts: string[] = [];
        if (siteCount > 0) parts.push(`${siteCount} אתרים`);
        if (payCount > 0) parts.push(`${payCount} תשלומים`);
        throw new Error(
          `ללקוח משויכים ${parts.join(" ו-")}. יש למחוק או להעביר אותם תחילה (מדף האתרים / התשלומים).`,
        );
      }
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("לקוח נמחק");
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: Error) => {
      const msg = /foreign key|violates|constraint/i.test(e.message)
        ? "לא ניתן למחוק לקוח שמשויכים אליו אתרים או תשלומים. מחק אותם תחילה."
        : e.message;
      toast.error("לא ניתן למחוק", { description: msg });
    },
  });

  const filtered = clients.filter((c) =>
    [c.full_name, c.phone, c.email].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const isFiltering = search.trim().length > 0;

  const handleExport = () =>
    exportToCsv(
      `לקוחות-${format(new Date(), "yyyy-MM-dd")}.csv`,
      ["שם", "טלפון", "אימייל", "סך חויב", "סך שולם", "יתרה", "מס' אתרים", "הערות"],
      filtered.map((c) => {
        const b = balanceMap.get(c.id);
        return [
          c.full_name,
          c.phone,
          c.email,
          b ? Number(b.total_invoiced) : 0,
          b ? Number(b.total_paid) : 0,
          b ? Number(b.balance_due) : 0,
          b ? Number(b.total_sites) : 0,
          c.notes,
        ];
      }),
    );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">לקוחות</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading
                ? "טוען..."
                : isFiltering
                ? `מציג ${filtered.length} מתוך ${clients.length} לקוחות`
                : `${clients.length} לקוחות במערכת`}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="חפש לפי שם, טלפון או אימייל..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-3 pe-9"
                aria-label="חיפוש לקוחות"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 self-center"
              onClick={handleExport}
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4 ml-1" /> ייצוא Excel
            </Button>
            {isManager && (
              <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
                <DialogTrigger asChild>
                  <Button className="shrink-0">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">לקוח חדש</span>
                    <span className="sm:hidden">חדש</span>
                  </Button>
                </DialogTrigger>
                <ClientDialog key={editing?.id ?? "new"} editing={editing} onClose={() => { setDialogOpen(false); setEditing(null); }} />
              </Dialog>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center text-center py-16 gap-4">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {isFiltering ? "לא נמצאו לקוחות תואמים" : "עדיין אין לקוחות"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isFiltering
                    ? `לא נמצאו תוצאות עבור "${search}"`
                    : "הוסף את הלקוח הראשון שלך כדי להתחיל"}
                </p>
              </div>
              {!isFiltering && isManager && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> הוסף לקוח ראשון
                </Button>
              )}
              {isFiltering && (
                <Button variant="outline" onClick={() => setSearch("")}>
                  נקה חיפוש
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                balance={balanceMap.get(c.id)}
                isManager={isManager}
                isAdmin={isAdmin}
                onEdit={() => { setEditing(c); setDialogOpen(true); }}
                onDelete={() => deleteM.mutate(c.id)}
                isDeleting={deleteM.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function ClientCard({
  client: c,
  balance: bal,
  isManager,
  isAdmin,
  onEdit,
  onDelete,
  isDeleting,
}: {
  client: Client;
  balance: ClientBalance | undefined;
  isManager: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const hasContact = c.phone || c.email;
  const avatarColor = getAvatarColor(c.full_name);
  const hasFinancials = bal && (Number(bal.total_invoiced) > 0 || Number(bal.total_sites) > 0);

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-5">
        {/* Card Header: Avatar + Name + Actions */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor}`}
              aria-hidden="true"
            >
              {getInitials(c.full_name)}
            </div>
            <h3 className="font-semibold text-base truncate leading-tight">{c.full_name}</h3>
          </div>

          {isManager && (
            <div className="flex gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={onEdit}
                    aria-label={`ערוך את ${c.full_name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>עריכה</TooltipContent>
              </Tooltip>

              {isAdmin && (
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label={`מחק את ${c.full_name}`}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>מחיקה</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>למחוק את {c.full_name}?</AlertDialogTitle>
                      <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
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

        {/* Contact Info */}
        {hasContact ? (
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="flex items-center gap-2 hover:text-foreground transition-colors w-fit"
                dir="ltr"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{c.phone}</span>
              </a>
            )}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-2 hover:text-foreground transition-colors min-w-0"
                dir="ltr"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.email}</span>
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">ללא פרטי קשר</p>
        )}

        {/* Notes preview */}
        {c.notes && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-2 border-t pt-2">{c.notes}</p>
        )}

        {/* GAP-007: Financial Summary from client_balance view */}
        {hasFinancials && (
          <div className="mt-3 pt-2 border-t grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">אתרים</p>
              <p className="text-sm font-semibold">{bal.total_sites}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">שולם</p>
              <p className="text-sm font-semibold text-green-600">{fmt(Number(bal.total_paid))}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">יתרה</p>
              <p className={`text-sm font-semibold ${Number(bal.balance_due) > 0 ? "text-destructive" : "text-green-600"}`}>
                {fmt(Number(bal.balance_due))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClientDialog({ editing, onClose }: { editing: Client | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: editing?.full_name ?? "",
    phone: editing?.phone ?? "",
    email: editing?.email ?? "",
    notes: editing?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = "שם הוא שדה חובה";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "כתובת אימייל לא תקינה";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("clients").insert({ ...payload, user_id: u.user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "לקוח עודכן" : "לקוח נוסף");
      qc.invalidateQueries({ queryKey: ["clients"] });
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
        <DialogTitle>{editing ? "עריכת לקוח" : "לקוח חדש"}</DialogTitle>
        <DialogDescription>פרטי קשר של הלקוח / הקבלן</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="client-name">
            שם <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="client-name"
            value={form.full_name}
            onChange={(e) => { setForm({ ...form, full_name: e.target.value }); setErrors({ ...errors, full_name: "" }); }}
            aria-invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? "name-error" : undefined}
          />
          {errors.full_name && <p id="name-error" className="text-xs text-destructive">{errors.full_name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="client-phone">טלפון</Label>
            <Input
              id="client-phone"
              dir="ltr"
              type="tel"
              placeholder="050-0000000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-email">אימייל</Label>
            <Input
              id="client-email"
              dir="ltr"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && <p id="email-error" className="text-xs text-destructive col-span-2">{errors.email}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="client-notes">הערות</Label>
          <Textarea
            id="client-notes"
            rows={3}
            placeholder="פרטים נוספים על הלקוח..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={saveM.isPending}>
            ביטול
          </Button>
          <Button type="submit" disabled={saveM.isPending}>
            {saveM.isPending ? "שומר..." : editing ? "עדכן לקוח" : "הוסף לקוח"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
