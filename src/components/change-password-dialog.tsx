import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const GRADIENT_BTN = "linear-gradient(145deg, #0F83F0, #1565C0)";
const MIN_LEN = 6;

/**
 * Self-service password change — available to ANY authenticated user
 * regardless of role (admin / team_manager / employee).
 * Uses supabase.auth.updateUser on the current session, so no admin
 * privileges or service-role key are required.
 */
export function ChangePasswordDialog({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [pending,  setPending]    = useState(false);

  function reset() {
    setPassword(""); setConfirm(""); setShowPass(false); setPending(false);
  }

  function handleClose() {
    if (pending) return;
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < MIN_LEN) {
      toast.error(`הסיסמה חייבת להכיל לפחות ${MIN_LEN} תווים`);
      return;
    }
    if (password !== confirm) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      toast.error("שינוי הסיסמה נכשל", { description: error.message });
      return;
    }

    toast.success("הסיסמה שונתה בהצלחה");
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> שינוי סיסמה
          </DialogTitle>
          <DialogDescription>
            בחר סיסמה חדשה לחשבון שלך. הסיסמה תתעדכן מיידית.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>סיסמה חדשה</Label>
            <div className="relative">
              <Input
                dir="ltr"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                className="pe-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-muted transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>אימות סיסמה</Label>
            <Input
              dir="ltr"
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="הקלד שוב את הסיסמה"
              autoComplete="new-password"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={pending}>
              ביטול
            </Button>
            <button
              type="submit"
              disabled={pending}
              className="btn-shine active:scale-[0.97] hover:-translate-y-0.5 transition-all px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: GRADIENT_BTN }}
            >
              {pending ? "שומר..." : "שמור סיסמה"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
