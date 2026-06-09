import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Shield, UserPlus, Pencil, Trash2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type AppRole = "admin" | "team_manager" | "employee";

type UserRow = {
  user_id:    string;
  email:      string;
  full_name:  string | null;
  role:       AppRole | null;
  created_at: string;
};

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const GRADIENT_BTN = "linear-gradient(145deg, #0F83F0, #1565C0)";

const ROLE_LABELS: Record<AppRole, string> = {
  admin:        "אדמין",
  team_manager: "מנהל צוות",
  employee:     "עובד",
};

const ROLE_VARIANTS: Record<AppRole, string> = {
  admin:        "bg-red-100 text-red-700 border-red-200",
  team_manager: "bg-blue-100 text-blue-700 border-blue-200",
  employee:     "bg-gray-100 text-gray-700 border-gray-200",
};

/** Invoke an edge function and surface the Hebrew error message from its JSON body. */
async function invokeEdge<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
      if (ctx?.json) {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      }
    } catch { /* keep default message */ }
    throw new Error(msg);
  }
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String((data as { error: string }).error));
  }
  return data as T;
}

function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
function UsersPage() {
  const { isAdmin } = useAuth();

  // Only admins may access this page
  if (!isAdmin) return <Navigate to="/" />;

  return <UsersPageInner />;
}

function UsersPageInner() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();

  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<UserRow | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  /* ── Data ── */
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_users_for_admin");
      if (error) throw error;
      return data as UserRow[];
    },
    staleTime: 30_000,
  });

  /* ── Add user mutation ── */
  const addM = useMutation({
    mutationFn: async ({ email, fullName, role, password }: {
      email: string; fullName: string; role: AppRole; password: string;
    }) => {
      // Create via secure edge function (service role) so the admin's own
      // session is never replaced and the email is pre-confirmed.
      await invokeEdge("admin-create-user", { email, fullName, role, password });
    },
    onSuccess: (_, vars) => {
      toast.success("משתמש נוצר בהצלחה");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setAddOpen(false);
      setCreatedCreds({ email: vars.email, password: vars.password });
    },
    onError: (e: Error) => toast.error("יצירת משתמש נכשלה", { description: e.message }),
  });

  /* ── Update role mutation ── */
  const updateRoleM = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Upsert: delete old role then insert new
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("תפקיד עודכן");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error("עדכון נכשל", { description: e.message }),
  });

  /* ── Delete user mutation (full delete: auth user + role) ── */
  const deleteUserM = useMutation({
    mutationFn: async (userId: string) => {
      await invokeEdge("admin-delete-user", { userId });
    },
    onSuccess: () => {
      toast.success("המשתמש נמחק");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error("מחיקה נכשלה", { description: e.message }),
  });

  const openEdit = useCallback((u: UserRow) => setEditTarget(u), []);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} משתמשים במערכת — גישה לאדמין בלבד
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: GRADIENT_BTN }}
        >
          <UserPlus className="h-4 w-4" /> הוסף משתמש
        </button>
      </div>

      {/* ── Users list ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          <div className="text-4xl mb-3">⚠️</div>
          שגיאה בטעינת המשתמשים
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">משתמש</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">תאריך הצטרפות</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">תפקיד</th>
                <th className="py-3 px-4 w-24" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.user_id}
                  user={u}
                  isCurrentUser={u.user_id === currentUser?.id}
                  onEdit={openEdit}
                  onRemove={(id) => deleteUserM.mutate(id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add user dialog ── */}
      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={({ email, fullName, role, password }) =>
          addM.mutate({ email, fullName, role, password })
        }
        isPending={addM.isPending}
      />

      {/* ── Edit role dialog ── */}
      <EditRoleDialog
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={(role) => editTarget && updateRoleM.mutate({ userId: editTarget.user_id, role })}
        isPending={updateRoleM.isPending}
      />

      {/* ── Created credentials dialog ── */}
      {createdCreds && (
        <CredsDialog
          email={createdCreds.email}
          password={createdCreds.password}
          onClose={() => setCreatedCreds(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   USER ROW
───────────────────────────────────────── */
function UserRow({
  user, isCurrentUser, onEdit, onRemove,
}: {
  user: UserRow;
  isCurrentUser: boolean;
  onEdit: (u: UserRow) => void;
  onRemove: (id: string) => void;
}) {
  const initials = (user.full_name ?? user.email)
    .trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors group">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-medium leading-tight">
              {user.full_name ?? "—"}
              {isCurrentUser && (
                <span className="mr-2 text-[10px] text-muted-foreground font-normal">(אתה)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 text-muted-foreground text-xs hidden md:table-cell">
        {fmtDate(user.created_at)}
      </td>
      <td className="py-3.5 px-4">
        {user.role ? (
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
            ROLE_VARIANTS[user.role],
          )}>
            {user.role === "admin" && <Shield className="h-3 w-3" />}
            {ROLE_LABELS[user.role]}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">ללא תפקיד</span>
        )}
      </td>
      <td className="py-3.5 px-4">
        {!isCurrentUser && (
          <div className="flex gap-1 justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(user)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="שנה תפקיד"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="מחק משתמש"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>למחוק את {user.email}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    פעולה זו מוחקת את המשתמש לצמיתות — כולל החשבון והתפקיד. לא ניתן לשחזר.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onRemove(user.user_id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    מחק לצמיתות
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────
   ADD USER DIALOG
───────────────────────────────────────── */
function AddUserDialog({
  open, onClose, onSubmit, isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: { email: string; fullName: string; role: AppRole; password: string }) => void;
  isPending: boolean;
}) {
  const [email,    setEmail]    = useState("");
  const [fullName, setFullName] = useState("");
  const [role,     setRole]     = useState<AppRole>("employee");
  const [password, setPassword] = useState(() => generatePassword());
  const [showPass, setShowPass] = useState(false);

  function handleClose() {
    setEmail(""); setFullName(""); setRole("employee");
    setPassword(generatePassword()); setShowPass(false);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ email: email.trim(), fullName: fullName.trim(), role, password });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת משתמש חדש</DialogTitle>
          <DialogDescription>
            ייצור חשבון + הקצאת תפקיד. שתף את הסיסמה הזמנית עם המשתמש.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>אימייל *</Label>
            <Input
              type="email" required dir="ltr"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>שם מלא</Label>
            <Input
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="ישראל ישראלי"
            />
          </div>

          <div className="space-y-1.5">
            <Label>תפקיד</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="admin">
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-red-600" /> אדמין — גישה מלאה
                  </span>
                </SelectItem>
                <SelectItem value="team_manager">מנהל צוות — ניהול עובדים ואתרים</SelectItem>
                <SelectItem value="employee">עובד — צפייה בלבד</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>סיסמה זמנית</Label>
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="text-xs text-primary hover:underline"
              >
                צור חדשה
              </button>
            </div>
            <div className="relative">
              <Input
                dir="ltr" readOnly
                value={showPass ? password : "••••••••••"}
                className="font-mono pe-20"
              />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                >
                  {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <CopyButton text={password} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              העתק ושתף עם המשתמש — הוא יוכל לשנות אחר כך
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>ביטול</Button>
            <button
              type="submit" disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: GRADIENT_BTN }}
            >
              {isPending ? "יוצר..." : "צור משתמש"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────
   EDIT ROLE DIALOG
───────────────────────────────────────── */
function EditRoleDialog({
  user, onClose, onSubmit, isPending,
}: {
  user: UserRow | null;
  onClose: () => void;
  onSubmit: (role: AppRole) => void;
  isPending: boolean;
}) {
  const [role, setRole] = useState<AppRole>("employee");

  // Sync when user changes
  if (user && user.role && role !== user.role) setRole(user.role);

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>שינוי תפקיד</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="admin">
                <span className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-red-600" /> אדמין — גישה מלאה
                </span>
              </SelectItem>
              <SelectItem value="team_manager">מנהל צוות — ניהול עובדים ואתרים</SelectItem>
              <SelectItem value="employee">עובד — צפייה בלבד</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <button
            onClick={() => onSubmit(role)}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: GRADIENT_BTN }}
          >
            {isPending ? "שומר..." : "שמור"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────
   CREATED CREDENTIALS DIALOG
───────────────────────────────────────── */
function CredsDialog({
  email, password, onClose,
}: { email: string; password: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>✅ משתמש נוצר בהצלחה</DialogTitle>
          <DialogDescription>
            שלח את הפרטים הבאים למשתמש. לאחר כניסה ראשונה, מומלץ לשנות סיסמה.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-xl bg-muted/40 p-4 my-2">
          <CredRow label="אימייל" value={email} />
          <CredRow label="סיסמה זמנית" value={password} mono />
        </div>

        <DialogFooter>
          <Button onClick={onClose} style={{ background: GRADIENT_BTN }} className="text-white w-full">
            הבנתי, סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={cn("text-sm font-medium", mono && "font-mono")} dir="ltr">{value}</span>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted transition-colors"
      title="העתק"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-green-600" />
        : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      }
    </button>
  );
}
