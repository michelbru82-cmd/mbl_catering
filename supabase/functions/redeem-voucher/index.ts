// ============================================================
// MBL Catering — "redeem-voucher" Supabase Edge Function
// ------------------------------------------------------------
// Redeems a voucher code for 1 month of full access, enforcing a
// limit of ONE redemption per account AND per IP.
//
// The web app invokes it (signed-in users only) with:  { code }
// It returns: { ok: true, full_access_until } on success, or
//             { ok: false, error } with a 4xx status otherwise.
//
// WIRE IT UP (once):
//   1. Run supabase/voucher_schema.sql in the SQL editor.
//   2. Deploy:  supabase functions deploy redeem-voucher
//      (SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
//       are provided to Edge Functions automatically.)
//   3. Optionally override the accepted code / grant length:
//      supabase secrets set VOUCHER_CODE=MBL_TECHNOLOGY_2026 VOUCHER_MONTHS=1
//
// Security: redemption limits and the entitlement write happen here,
// server-side, with the service role — the client cannot bypass them.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_CODE = (Deno.env.get("VOUCHER_CODE") ?? "MBL_TECHNOLOGY_2026").toUpperCase();
const GRANT_MONTHS = Number(Deno.env.get("VOUCHER_MONTHS") ?? "1");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// First public IP from the proxy chain (Supabase sets x-forwarded-for).
function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ---- authenticate the caller ----
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ ok: false, error: "not_signed_in" }, 401);

  const authClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json({ ok: false, error: "not_signed_in" }, 401);

  // ---- validate the code ----
  let code = "";
  try { code = String((await req.json())?.code ?? "").trim(); } catch { /* no body */ }
  if (!code) return json({ ok: false, error: "no_code" }, 400);
  if (code.toUpperCase() !== VALID_CODE) return json({ ok: false, error: "invalid_code" }, 400);

  const canonical = VALID_CODE; // store one canonical form so limits are consistent
  const ip = clientIp(req);

  // ---- enforce limits + grant, with the service role ----
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Already redeemed by this account, or from this IP?
  const orFilter = ip
    ? `user_id.eq.${user.id},ip.eq.${ip}`
    : `user_id.eq.${user.id}`;
  const { data: existing, error: exErr } = await admin
    .from("voucher_redemptions")
    .select("id,user_id,ip")
    .eq("code", canonical)
    .or(orFilter)
    .limit(1);
  if (exErr) return json({ ok: false, error: "server_error" }, 500);
  if (existing && existing.length) {
    const byAccount = existing.some((r: { user_id: string }) => r.user_id === user.id);
    return json({ ok: false, error: byAccount ? "already_redeemed_account" : "already_redeemed_ip" }, 409);
  }

  // Record the redemption (unique constraints are the source of truth under races).
  const { error: insErr } = await admin
    .from("voucher_redemptions")
    .insert({ code: canonical, user_id: user.id, ip: ip || null });
  if (insErr) {
    // Unique-violation → someone/something already redeemed it.
    if ((insErr as { code?: string }).code === "23505") {
      return json({ ok: false, error: "already_redeemed" }, 409);
    }
    return json({ ok: false, error: "server_error" }, 500);
  }

  // Grant full access for GRANT_MONTHS from now.
  const until = new Date();
  until.setMonth(until.getMonth() + GRANT_MONTHS);
  const { error: upErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, email: user.email, full_access_until: until.toISOString() }, { onConflict: "id" });
  if (upErr) return json({ ok: false, error: "server_error" }, 500);

  return json({ ok: true, full_access_until: until.toISOString() });
});
