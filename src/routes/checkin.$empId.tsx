import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { HardHat, MapPin, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/checkin/$empId")({
  head: () => ({
    meta: [{ title: "צ'ק-אין נוכחות" }],
  }),
  component: CheckinPage,
});

type CheckinInfo = {
  employee_name: string | null;
  employee_status: string | null;
  site_name: string | null;
  site_id: string | null;
};

type Done = { name: string | null; site: string | null; at: string };

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function CheckinPage() {
  const { empId } = Route.useParams();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: info, isLoading, isError } = useQuery({
    queryKey: ["checkin-info", empId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_employee_checkin_info", { emp_id: empId });
      if (error) throw error;
      const row = (data as CheckinInfo[] | null)?.[0] ?? null;
      return row;
    },
    retry: false,
  });

  // Try to read GPS, but never block the check-in on it.
  function getLocation(): Promise<{ lat: number | null; long: number | null }> {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) return resolve({ lat: null, long: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
        () => resolve({ lat: null, long: null }),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
  }

  async function handleCheckin() {
    setSubmitting(true);
    setError(null);
    try {
      const { lat, long } = await getLocation();
      const { data, error } = await supabase.rpc("submit_checkin", {
        emp_id: empId,
        lat,
        long,
      });
      if (error) throw error;
      const row = (data as { employee_name: string; site_name: string; checked_in_at: string }[] | null)?.[0];
      setDone({
        name: row?.employee_name ?? info?.employee_name ?? null,
        site: row?.site_name ?? info?.site_name ?? null,
        at: row?.checked_in_at ?? new Date().toISOString(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("employee_inactive") ? "העובד אינו פעיל. פנה למנהל." :
        msg.includes("employee_not_found") ? "לא נמצא עובד מתאים לקישור הזה." :
        "אירעה שגיאה ברישום הנוכחות. נסה שוב.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="p-6 text-center">
          {/* Brand */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-400 text-white">
            <HardHat className="h-7 w-7" />
          </div>

          {isLoading && (
            <div className="py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              טוען פרטים…
            </div>
          )}

          {isError && (
            <div className="py-8">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-medium">קישור לא תקין</p>
              <p className="text-sm text-muted-foreground mt-1">פנה למנהל לקבלת קישור צ'ק-אין מעודכן.</p>
            </div>
          )}

          {/* Success state */}
          {done && (
            <div className="py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h1 className="text-xl font-bold">נרשמה נוכחות!</h1>
              {done.name && <p className="text-sm text-muted-foreground mt-1">{done.name}</p>}
              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                <p>אתר: <span className="font-medium">{done.site ?? "ללא שיבוץ להיום"}</span></p>
                <p className="mt-1">שעה: <span className="font-medium">{fmtTime(done.at)}</span></p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">אפשר לסגור את החלון.</p>
            </div>
          )}

          {/* Check-in state */}
          {info && !done && !isError && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">צ'ק-אין נוכחות</p>
              <h1 className="text-2xl font-bold mt-1">{info.employee_name ?? "עובד"}</h1>

              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                <span>{info.site_name ? `אתר היום: ${info.site_name}` : "אין שיבוץ לאתר היום"}</span>
              </div>

              {error && (
                <p className="text-sm text-destructive mt-4">{error}</p>
              )}

              <Button
                className="w-full mt-6 h-12 text-base"
                onClick={handleCheckin}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin me-2" /> רושם נוכחות…</>
                ) : (
                  <>אני באתר — צ'ק-אין</>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground mt-3">
                בלחיצה תירשם נוכחות עם המיקום הנוכחי (אם תאשר).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
