/**
 * Edge Function: admin-create-user
 *
 * Securely creates a new auth user + assigns a role, WITHOUT touching the
 * caller's session (unlike client-side supabase.auth.signUp which replaces it).
 *
 * Flow:
 *   1. Validate the caller's JWT and verify they have the `admin` role.
 *   2. Create the user with the service role (email pre-confirmed).
 *   3. Assign the requested role in public.user_roles.
 *
 * Auto-injected env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type AppRole = "admin" | "team_manager" | "employee";
const VALID_ROLES: AppRole[] = ["admin", "team_manager", "employee"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // ── 1. Authenticate caller ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "חסר טוקן הזדהות" }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerErr } =
      await callerClient.auth.getUser();
    if (callerErr || !caller) return json({ error: "טוקן לא תקין" }, 401);

    // ── 2. Verify caller is admin ──
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    if (!isAdmin) return json({ error: "גישה לאדמין בלבד" }, 403);

    // ── 3. Validate input ──
    const { email, password, fullName, role } = await req.json();
    if (!email || !password) return json({ error: "אימייל וסיסמה חובה" }, 400);
    if (password.length < 8) return json({ error: "הסיסמה חייבת לפחות 8 תווים" }, 400);
    const safeRole: AppRole = VALID_ROLES.includes(role) ? role : "employee";

    // ── 4. Create the user (email pre-confirmed) ──
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
      user_metadata: { full_name: fullName ?? null },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "יצירת המשתמש נכשלה" }, 400);
    }

    // ── 5. Assign role (replace any existing) ──
    await admin.from("user_roles").delete().eq("user_id", created.user.id);
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: safeRole });
    if (roleErr) {
      // best-effort cleanup so we don't leave an orphaned user
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: `הקצאת תפקיד נכשלה: ${roleErr.message}` }, 400);
    }

    return json({ user_id: created.user.id, email, role: safeRole });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});
