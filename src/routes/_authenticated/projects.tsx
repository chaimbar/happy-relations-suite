import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Search, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";

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
  total_price: number;
  materials_cost: number;
  status: "active" | "completed" | "on_hold";
  has_drywall: boolean;
  notes: string | null;
};

type ClientLite = { id: string; name: string };

const STATUS_LABEL: Record<Project["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "פעיל", variant: "default" },
  on_hold: { label: "מושהה", variant: "outline" },
  completed: { label: "הסתיים", variant: "secondary" },
};

function ProjectsPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
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

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("פרויקט נמחק");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  const filtered = projects.filter((p) =>
    [p.name, p.address, clientMap.get(p.client_id ?? "")].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-muted-foreground">{projects.length} אתרים במערכת</p>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="חיפוש..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-3 pe-9" />
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

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">טוען...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <p className="text-muted-foreground">לא נמצאו אתרים</p>
          {isManager && <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> הוסף אתר ראשון</Button>}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {filtered.map((p) => {
            const status = STATUS_LABEL[p.status];
            const profitEstimate = Number(p.total_price) - Number(p.materials_cost);
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-base truncate">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                        {p.has_drywall && <Badge variant="outline" className="text-xs">כולל גבס</Badge>}
                      </div>
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

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {p.client_id && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider">לקוח:</span>
                        <span className="font-medium text-foreground">{clientMap.get(p.client_id) ?? "—"}</span>
                      </div>
                    )}
                    {p.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" /><span className="truncate">{p.address}</span>
                      </div>
                    )}
                    {(p.start_date || p.end_date) && (
                      <div className="flex items-center gap-2">
                        <CalIcon className="h-3.5 w-3.5" />
                        <span>{p.start_date ?? "—"} ← {p.end_date ?? "—"}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">הכנסה</p>
                      <p className="font-semibold">₪{Number(p.total_price).toLocaleString("he-IL")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">חומרים</p>
                      <p className="font-semibold">₪{Number(p.materials_cost).toLocaleString("he-IL")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">רווח גס</p>
                      <p className={`font-semibold ${profitEstimate >= 0 ? "text-success" : "text-destructive"}`}>
                        ₪{profitEstimate.toLocaleString("he-IL")}
                      </p>
                    </div>
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
    total_price: editing?.total_price?.toString() ?? "0",
    materials_cost: editing?.materials_cost?.toString() ?? "0",
    status: editing?.status ?? "active",
    has_drywall: editing?.has_drywall ?? false,
    notes: editing?.notes ?? "",
  });

  const saveM = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        client_id: form.client_id || null,
        address: form.address.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        total_price: Number(form.total_price) || 0,
        materials_cost: Number(form.materials_cost) || 0,
        status: form.status as Project["status"],
        has_drywall: form.has_drywall,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("projects").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("projects").insert({ ...payload, created_by: u.user?.id });
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
            <Label>לקוח</Label>
            <Select value={form.client_id || "_none"} onValueChange={(v) => setForm({ ...form, client_id: v === "_none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">ללא</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>סטטוס</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Project["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="on_hold">מושהה</SelectItem>
                <SelectItem value="completed">הסתיים</SelectItem>
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
            <Label>מחיר פרויקט (₪)</Label>
            <Input type="number" min="0" step="any" value={form.total_price}
              onChange={(e) => setForm({ ...form, total_price: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>עלות חומרים (₪)</Label>
            <Input type="number" min="0" step="any" value={form.materials_cost}
              onChange={(e) => setForm({ ...form, materials_cost: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label className="text-sm">כולל גבס</Label>
            <p className="text-xs text-muted-foreground">לפרויקטים עם שלב גבס/פינישים</p>
          </div>
          <Switch checked={form.has_drywall} onCheckedChange={(c) => setForm({ ...form, has_drywall: c })} />
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
