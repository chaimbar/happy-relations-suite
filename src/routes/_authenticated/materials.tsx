import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Package, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { exportToCsv } from "@/lib/export-csv";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/_authenticated/materials")({
  component: MaterialsPage,
});

type Material = {
  id: string;
  site_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  created_at: string;
};

type SiteLite = {
  id: string;
  name: string;
  materials_cost: number;
};

function fmt(n: number) {
  return `₪${Number(n).toLocaleString("he-IL")}`;
}

async function syncSiteMaterialsCost(siteId: string) {
  const { data } = await supabase
    .from("materials")
    .select("total_price")
    .eq("site_id", siteId);
  const total = (data ?? []).reduce((s, m) => s + Number(m.total_price), 0);
  await supabase.from("sites").update({ materials_cost: total }).eq("id", siteId);
}

function MaterialsPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites-lite-mat"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, name, materials_cost")
        .order("name");
      if (error) throw error;
      return data as SiteLite[];
    },
  });

  const { data: materials = [], isLoading: matsLoading } = useQuery({
    queryKey: ["materials", siteFilter],
    queryFn: async () => {
      let q = supabase.from("materials").select("*").order("created_at", { ascending: false });
      if (siteFilter !== "all") q = q.eq("site_id", siteFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Material[];
    },
  });

  const siteMap = new Map(sites.map((s) => [s.id, s]));

  const deleteM = useMutation({
    mutationFn: async (mat: Material) => {
      const { error } = await supabase.from("materials").delete().eq("id", mat.id);
      if (error) throw error;
      await syncSiteMaterialsCost(mat.site_id);
    },
    onSuccess: () => {
      toast.success("חומר נמחק");
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["sites-lite-mat"] });
      qc.invalidateQueries({ queryKey: ["profitability"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  const filtered = materials.filter((m) => {
    if (!search) return true;
    const site = siteMap.get(m.site_id);
    return (
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      site?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const selectedSite = siteFilter !== "all" ? siteMap.get(siteFilter) : null;
  const filteredTotal = filtered.reduce((s, m) => s + Number(m.total_price), 0);
  const isLoading = sitesLoading || matsLoading;

  const handleExport = () =>
    exportToCsv(
      `חומרים-${format(new Date(), "yyyy-MM-dd")}.csv`,
      ["אתר", "שם חומר", "כמות", "מחיר יחידה", "סה\"כ", "הערות"],
      filtered.map((m) => [
        siteMap.get(m.site_id)?.name ?? "",
        m.name,
        m.quantity,
        m.unit_price,
        m.total_price,
        m.notes,
      ]),
    );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">חומרים</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "טוען..." : `${filtered.length} פריטים · ${fmt(filteredTotal)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="חיפוש חומר..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="כל האתרים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל האתרים</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 ml-1" /> ייצוא Excel
          </Button>
          {isManager && (
            <Button
              onClick={() => { setEditing(null); setDialogOpen(true); }}
            >
              <Plus className="h-4 w-4" /> הוסף חומר
            </Button>
          )}
        </div>
      </div>

      {/* Site summary card */}
      {selectedSite && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">עלות חומרים בפועל</p>
              <p className="text-2xl font-bold">{fmt(filteredTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">תקציב חומרים (אתר)</p>
              <p className="text-2xl font-bold">{fmt(selectedSite.materials_cost)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">סטייה מתקציב</p>
              <p className={`text-2xl font-bold ${filteredTotal - selectedSite.materials_cost > 0 ? "text-destructive" : "text-green-600"}`}>
                {filteredTotal - selectedSite.materials_cost > 0 ? "+" : ""}
                {fmt(filteredTotal - selectedSite.materials_cost)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        {!selectedSite && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base">כל החומרים</CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Package className="h-7 w-7 text-muted-foreground" />
                </div>
              </div>
              <p className="text-base font-medium">אין חומרים</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "נסה לשנות את החיפוש" : "הוסף חומר ראשון לאתר"}
              </p>
              {isManager && !search && (
                <Button className="mt-4" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4" /> הוסף חומר
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase">
                    {siteFilter === "all" && (
                      <th className="text-right px-4 py-3 font-medium">אתר</th>
                    )}
                    <th className="text-right px-4 py-3 font-medium">שם חומר</th>
                    <th className="text-right px-4 py-3 font-medium">כמות</th>
                    <th className="text-right px-4 py-3 font-medium">מחיר יחידה</th>
                    <th className="text-right px-4 py-3 font-medium">סה"כ</th>
                    <th className="text-right px-4 py-3 font-medium">הערות</th>
                    {isManager && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr
                      key={m.id}
                      className={`border-b hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}
                    >
                      {siteFilter === "all" && (
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {siteMap.get(m.site_id)?.name ?? "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">{Number(m.quantity).toLocaleString("he-IL")}</td>
                      <td className="px-4 py-3">{fmt(m.unit_price)}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(m.total_price)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[180px] truncate">
                        {m.notes ?? "—"}
                      </td>
                      {isManager && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => { setEditing(m); setDialogOpen(true); }}
                              title="עריכה"
                            >
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
                                    <AlertDialogTitle>למחוק את "{m.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteM.mutate(m)}>מחק</AlertDialogAction>
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
                    <td
                      colSpan={siteFilter === "all" ? (isManager ? 4 : 3) : (isManager ? 3 : 2)}
                      className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left"
                    >
                      סה"כ
                    </td>
                    <td className="px-4 py-2.5 font-bold text-base">{fmt(filteredTotal)}</td>
                    <td colSpan={isManager ? 2 : 1} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <MaterialDialog
          editing={editing}
          sites={sites}
          defaultSiteId={siteFilter !== "all" ? siteFilter : undefined}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
        />
      </Dialog>
    </div>
  );
}

function MaterialDialog({
  editing,
  sites,
  defaultSiteId,
  onClose,
}: {
  editing: Material | null;
  sites: SiteLite[];
  defaultSiteId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    site_id: editing?.site_id ?? defaultSiteId ?? "",
    name: editing?.name ?? "",
    quantity: editing?.quantity != null ? editing.quantity.toString() : "",
    unit_price: editing?.unit_price != null ? editing.unit_price.toString() : "",
    notes: editing?.notes ?? "",
  });

  const totalPreview =
    form.quantity !== "" && form.unit_price !== ""
      ? Number(form.quantity) * Number(form.unit_price)
      : null;

  const saveM = useMutation({
    mutationFn: async () => {
      const qty = Number(form.quantity) || 0;
      const up = Number(form.unit_price) || 0;
      const payload = {
        site_id: form.site_id,
        name: form.name.trim(),
        quantity: qty,
        unit_price: up,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("materials").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("materials")
          .insert({ ...payload, user_id: u.user!.id });
        if (error) throw error;
      }
      await syncSiteMaterialsCost(form.site_id);
    },
    onSuccess: () => {
      toast.success(editing ? "חומר עודכן" : "חומר נוסף");
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["sites-lite-mat"] });
      qc.invalidateQueries({ queryKey: ["profitability"] });
      onClose();
    },
    onError: (e: Error) => toast.error("שמירה נכשלה", { description: e.message }),
  });

  return (
    <DialogContent dir="rtl" className="max-w-md">
      <DialogHeader>
        <DialogTitle>{editing ? "עריכת חומר" : "הוספת חומר"}</DialogTitle>
        <DialogDescription>פרטי החומר ועלות עבור האתר</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>אתר *</Label>
          <Select
            value={form.site_id || "_none"}
            onValueChange={(v) => setForm({ ...form, site_id: v === "_none" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר אתר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none" disabled>בחר אתר</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>שם חומר *</Label>
          <Input
            required
            placeholder='לדוגמה: בלוקים 20 ס"מ'
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>כמות *</Label>
            <Input
              required
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>מחיר יחידה (₪) *</Label>
            <Input
              required
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
            />
          </div>
        </div>
        {totalPreview !== null && (
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm flex justify-between items-center">
            <span className="text-muted-foreground">סה"כ:</span>
            <span className="font-bold text-base">₪{totalPreview.toLocaleString("he-IL")}</span>
          </div>
        )}
        <div className="space-y-2">
          <Label>הערות</Label>
          <Textarea
            rows={2}
            placeholder="ספק, מיקום, פרטים נוספים..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            type="submit"
            disabled={saveM.isPending || !form.site_id || !form.name.trim()}
          >
            {saveM.isPending ? "שומר..." : editing ? "עדכן" : "הוסף"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
