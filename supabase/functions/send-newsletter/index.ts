// ============================================================
// MBL Catering — "send-newsletter" Supabase Edge Function
// ------------------------------------------------------------
// Sends the daily newsletter to the provided recipients over SMTP.
// The web app's Newsletter page invokes this with:
//   { menu_date, subject, html, text, recipients:[{email,name}], from }
//
// WIRE IT UP (once):
//   1. Create the function:   supabase functions new send-newsletter
//      (or just deploy this file)
//   2. Set your SMTP secrets:
//      supabase secrets set SMTP_HOST=smtp.yourhost.com SMTP_PORT=465 \
//        SMTP_USER=kitchen@fbws.tw SMTP_PASS=*** SMTP_FROM=kitchen@fbws.tw
//   3. Deploy:                 supabase functions deploy send-newsletter
//
// Until secrets are set it runs in DRY-RUN mode (logs + returns ok)
// so the "Send" button works end-to-end without sending real mail.
// ============================================================

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();
    const { subject, html, text, recipients = [], from, menu_date } = body;
    if (!recipients.length) return json({ ok: false, error: "no recipients" }, 400);

    const host = Deno.env.get("SMTP_HOST");
    const dryRun = !host;
    let sent = 0;

    if (!dryRun) {
      const client = new SMTPClient({
        connection: {
          hostname: host!,
          port: Number(Deno.env.get("SMTP_PORT") ?? "465"),
          tls: (Deno.env.get("SMTP_PORT") ?? "465") === "465",
          auth: { username: Deno.env.get("SMTP_USER")!, password: Deno.env.get("SMTP_PASS")! },
        },
      });
      const sender = from || Deno.env.get("SMTP_FROM") || Deno.env.get("SMTP_USER")!;
      for (const r of recipients) {
        try {
          await client.send({ from: sender, to: r.email, subject, content: text || "", html });
          sent++;
        } catch (e) { console.error("send fail", r.email, e); }
      }
      await client.close();
    } else {
      console.log(`[DRY-RUN] would send "${subject}" to ${recipients.length} recipients`);
      sent = recipients.length;
    }

    // optional: log the send
    try {
      const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && key) {
        const sb = createClient(url, key);
        await sb.from("newsletter_log").insert({ menu_date, recipients: recipients.length, ok: true, detail: { sent, dryRun } });
      }
    } catch (e) { console.error("log fail", e); }

    return json({ ok: true, count: sent, dryRun });
  } catch (e) {
    return json({ ok: false, error: String(e?.message ?? e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
