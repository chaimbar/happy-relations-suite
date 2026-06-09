/**
 * Edge Function: send-notification
 *
 * Processes pending rows from notification_queue and sends via:
 *   - Email: Resend API (https://resend.com)
 *   - WhatsApp: Make.com webhook
 *
 * Setup required:
 *   RESEND_API_KEY  — from resend.com (free tier: 100 emails/day)
 *   MAKE_WEBHOOK_URL — from Make.com scenario webhook URL
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 *   SUPABASE_URL              — auto-injected by Supabase
 *
 * Invoke:
 *   POST /functions/v1/send-notification
 *   (can be triggered by cron via pg_cron or Supabase Dashboard Cron)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY");
const MAKE_WEBHOOK    = Deno.env.get("MAKE_WEBHOOK_URL");
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

interface NotificationRow {
  id: string;
  channel: "email" | "whatsapp" | "both";
  recipient_email: string | null;
  recipient_phone: string | null;
  subject: string | null;
  body: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
}

async function sendEmail(n: NotificationRow): Promise<void> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  if (!n.recipient_email) throw new Error("No recipient_email");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CRM הלל מאן <noreply@crmbizflow.online>",
      to: [n.recipient_email],
      subject: n.subject ?? n.event_type,
      text: n.body,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

async function sendWhatsApp(n: NotificationRow): Promise<void> {
  if (!MAKE_WEBHOOK) throw new Error("MAKE_WEBHOOK_URL not set");

  const res = await fetch(MAKE_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: n.recipient_phone,
      message: `*${n.subject ?? n.event_type}*\n${n.body}`,
      event_type: n.event_type,
      event_data: n.event_data,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Make webhook error: ${err}`);
  }
}

Deno.serve(async (_req) => {
  const { data: pending, error } = await supabase
    .from("notification_queue")
    .select("*")
    .eq("status", "pending")
    .lt("attempts", 3)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: { id: string; status: string; error?: string }[] = [];

  for (const n of (pending ?? []) as NotificationRow[]) {
    try {
      if (n.channel === "email" || n.channel === "both") await sendEmail(n);
      if (n.channel === "whatsapp" || n.channel === "both") await sendWhatsApp(n);

      await supabase
        .from("notification_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", n.id);

      results.push({ id: n.id, status: "sent" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase
        .from("notification_queue")
        .update({
          status: "failed",
          attempts: (n as unknown as { attempts: number }).attempts + 1,
          last_error: msg,
        })
        .eq("id", n.id);

      results.push({ id: n.id, status: "failed", error: msg });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
