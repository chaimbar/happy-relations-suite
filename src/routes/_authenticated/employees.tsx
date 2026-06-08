import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Phone, IdCard, Search } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

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

function EmployeesPage() {
  const qc = useQueryClient();
  const { isManager, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

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

  const filtered = employees.filter((e) =>
    [e.full_name, e.phone, e.identifier].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-muted-foreground">
          {employees.length} עובדים במערכת
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-3 pe-9"
            />
          </div>
          {isManager && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  עובד חדש
                </Button>
              </DialogTrigger>
              <EmployeeDialog
                editing={editing}
                onClose={() => { setDialogOpen(false); setEditing(null); }}
              />
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">טוען...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">לא נמצאו עובדים</p>
            {isManager && (
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> הוסף עובד ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <Card key={emp.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-base truncate">{emp.full_name}</h3>
                    <Badge variant={emp.status === "active" ? "default" : "secondary"} className="mt-1 text-xs">
                      {emp.status === "active" ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>
                  {isManager && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(emp); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>למחוק את {emp.full_name}?</AlertDialogTitle>
                              <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteM.mutate(emp.id)}>מחק</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span dir="ltr">{emp.phone}</span>
                    </div>
                  )}
                  {emp.identifier && (
                    <div className="flex items-center gap-2">
                      <IdCard className="h-3.5 w-3.5" />
                      <span>{emp.identifier}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">יומית משוערת</p>
                    <p className="font-semibold">₪{Number(emp.daily_cost_estimate).toLocaleString("he-IL")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">חודשית בפועל</p>
                    <p className="font-semibold">
                      {emp.monthly_cost_actual ? `₪${Number(emp.monthly_cost_actual).toLocaleString("he-IL")}` : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmployeeDialog({ editing, onClose }: { editing: Employee | null; onClose: () => void }) {
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
          <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
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
            <Input type="number" min="0" step="any" value={form.daily_cost_estimate}
              onChange={(e) => setForm({ ...form, daily_cost_estimate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>עלות חודשית בפועל (₪)</Label>
            <Input type="number" min="0" step="any" value={form.monthly_cost_actual}
              onChange={(e) => setForm({ ...form, monthly_cost_actual: e.target.value })}
              placeholder="אופציונלי" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
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
          <Button type="submit" disabled={saveM.isPending}>
            {saveM.isPending ? "שומר..." : editing ? "עדכן" : "הוסף"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
