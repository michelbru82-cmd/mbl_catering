// ============================================================
// MBL CRM — "scan-card" Supabase Edge Function
// ------------------------------------------------------------
// Reads a business-card photo with Claude vision and returns the
// extracted contact fields as structured JSON. The app calls this
// with { image: "<data-url>" } and gets back { fields: {...} }.
//
// WIRE IT UP (once):
//   1. Set the API key secret:
//      supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//      (optional) supabase secrets set ANTHROPIC_MODEL=claude-sonnet-5
//   2. Deploy:
//      supabase functions deploy scan-card
//
// The model defaults to a vision-capable current model and can be
// overridden with the ANTHROPIC_MODEL secret.
// ============================================================

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CONTACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    first_name: { type: "string" },
    last_name: { type: "string" },
    full_name: { type: "string" },
    job_title: { type: "string" },
    company_name: { type: "string" },
    email_work: { type: "string" },
    email_home: { type: "string" },
    phone_mobile: { type: "string" },
    phone_work: { type: "string" },
    website: { type: "string" },
    line: { type: "string" },
    whatsapp: { type: "string" },
    wechat: { type: "string" },
    linkedin: { type: "string" },
    address_work: { type: "string" },
    city: { type: "string" },
    country: { type: "string" },
  },
  required: ["full_name"],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") return json({ error: "no image" }, 400);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "ANTHROPIC_API_KEY not set" }, 500);
    const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5";

    // Split a data URL: "data:image/jpeg;base64,XXXX"
    const m = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (!m) return json({ error: "image must be a base64 data URL" }, 400);
    const media_type = m[1], data = m[2];

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        output_config: { format: { type: "json_schema", schema: CONTACT_SCHEMA } },
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type, data } },
            { type: "text", text: "Extract the contact details from this business card. Use empty strings for fields not present. Keep phone numbers and handles exactly as printed. If both a personal and company email appear, put the company one in email_work." },
          ],
        }],
      }),
    });

    if (!resp.ok) return json({ error: "anthropic " + resp.status, detail: await resp.text() }, 502);
    const out = await resp.json();
    const textBlock = (out.content || []).find((b: any) => b.type === "text");
    let fields: Record<string, unknown> = {};
    try { fields = JSON.parse(textBlock?.text || "{}"); } catch (_e) { /* leave empty */ }
    return json({ fields });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
