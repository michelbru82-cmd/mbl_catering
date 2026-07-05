// ============================================================
// MBL Catering — "admin-invite" Supabase Edge Function
// ------------------------------------------------------------
// Lets an ADMIN invite a new user by email and pre-set which app
// sections that user may access. Supabase emails the invite link;
// the user follows it and sets their own password.
//
// The web app (admin only) invokes it with:
//   { email, sections?: string[] | null, redirectTo?: string }
// It returns { ok: true, user_id } on success, or { ok:false, error }.
//
// WIRE IT UP (once):
//   1. Run supabase/schema.sql, voucher_schema.sql, multiuser_schema.sql.
//   2. Deploy:  supabase functions deploy admin-invite
//      (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are
//       injected automatically.)
//   3. (Optional) also treat certain emails as admins even before their
//      profile role is set:  supabase secrets set ADMIN_EMAILS=you@example.com
//
// Security: the caller's JWT is verified and must resolve to an admin
// (profiles.role = 'admin' or an ADMIN_EMAILS entry). Only then does the
// service role create the invite — the public anon key can never do this.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "")
    .toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);

  // ---- authenticate the caller ----
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ ok: false, error: "not_signed_in" }, 401);

  const authClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  const caller = userData?.user;
  if (userErr || !caller) return json({ ok: false, error: "not_signed_in" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // ---- authorise: caller must be an admin ----
  const { data: prof } = await admin.from("profiles").select("role").eq("id", caller.id).maybeSingle();
  const isAdmin = prof?.role === "admin" || ADMIN_EMAILS.includes((caller.email ?? "").toLowerCase());
  if (!isAdmin) return json({ ok: false, error: "forbidden" }, 403);

  // ---- parse the request ----
  let email = "", sections: string[] | null = null, redirectTo: string | undefined;
  let resend = false, userId = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
    if (Array.isArray(body?.sections)) sections = body.sections.map((s: unknown) => String(s));
    if (typeof body?.redirectTo === "string") redirectTo = body.redirectTo;
    resend = body?.resend === true;
    if (typeof body?.user_id === "string") userId = body.user_id;
  } catch { /* no body */ }

  // ---- resend an invite to a user who hasn't accepted yet ----
  // inviteUserByEmail won't re-email an existing user, so we remove the pending
  // (unconfirmed) account and invite it again. Confirmed users are left alone.
  if (resend) {
    if (!userId) return json({ ok: false, error: "bad_request" }, 400);
    const { data: got } = await admin.auth.admin.getUserById(userId);
    const existing = got?.user;
    if (!existing) return json({ ok: false, error: "not_found" }, 404);
    if (existing.email_confirmed_at) return json({ ok: false, error: "already_active" }, 409);
    const targetEmail = (existing.email ?? email).toLowerCase();
    await admin.auth.admin.deleteUser(userId);
    const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(
      targetEmail, redirectTo ? { redirectTo } : undefined,
    );
    if (invErr || !inv?.user) return json({ ok: false, error: "invite_failed", detail: invErr?.message }, 400);
    await admin.from("profiles").upsert(
      { id: inv.user.id, email: targetEmail, role: "user", sections, active: true, invited_by: caller.id },
      { onConflict: "id" },
    );
    return json({ ok: true, user_id: inv.user.id, resent: true });
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "bad_email" }, 400);

  // ---- create the invite (service role) ----
  const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(
    email, redirectTo ? { redirectTo } : undefined,
  );
  if (invErr || !inv?.user) {
    const msg = (invErr?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return json({ ok: false, error: "already_exists" }, 409);
    }
    return json({ ok: false, error: "invite_failed", detail: invErr?.message }, 400);
  }

  // ---- pre-set the new user's profile (role + allowed sections) ----
  const { error: upErr } = await admin.from("profiles").upsert(
    { id: inv.user.id, email, role: "user", sections, active: true, invited_by: caller.id },
    { onConflict: "id" },
  );
  if (upErr) return json({ ok: true, user_id: inv.user.id, warning: "profile_not_set" });

  return json({ ok: true, user_id: inv.user.id });
});
