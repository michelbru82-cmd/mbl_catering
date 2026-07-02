// ============================================================
// MBL CRM — "scan-card" Supabase Edge Function
// ------------------------------------------------------------
// Reads a business-card photo with Claude vision and returns the
// extracted contact fields as JSON. The app calls this with
// { image: "<data-url>" } and gets back { fields: {...} }.
//
// WIRE IT UP (once):
//   1. Set the API key secret (no trailing newline!):
//      supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//      (optional) supabase secrets set ANTHROPIC_MODEL=claude-opus-4-5
//   2. Deploy:
//      supabase functions deploy scan-card
//
// The model defaults to a vision-capable model and can be overridden
// with the ANTHROPIC_MODEL secret (any model your key can access).
// JSON is requested in the prompt (not via structured-output params),
// so this works on any current Claude model.
// ============================================================

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIELDS = [
  "first_name", "last_name", "full_name", "job_title", "company_name",
  "email_work", "email_home", "phone_mobile", "phone_work", "website",
  "line", "whatsapp", "wechat", "linkedin", "address_work", "city", "country",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Pull the first {...} JSON object out of the model's text (it may wrap it in
// prose or ```json fences).
function extractJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(candidate.slice(start, end + 1)); } catch (_e) { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") return json({ error: "no image" }, 400);

    const key = (Deno.env.get("ANTHROPIC_API_KEY") || "").trim();
    if (!key) return json({ error: "ANTHROPIC_API_KEY not set" }, 500);
    const model = (Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-5").trim();

    // Split a data URL: "data:image/jpeg;base64,XXXX"
    const m = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (!m) return json({ error: "image must be a base64 data URL" }, 400);
    const media_type = m[1], data = m[2];

    const prompt =
      "Extract the contact details from this business card. " +
      "Return VALID JSON ONLY — no prose, no markdown, no code fences — as a single object with exactly these string keys: " +
      FIELDS.join(", ") + ". " +
      "Use an empty string for any field not present. Keep phone numbers and handles exactly as printed. " +
      "If both a personal and a company email appear, put the company one in email_work.";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type, data } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!resp.ok) return json({ error: "anthropic " + resp.status, detail: await resp.text() }, 502);
    const out = await resp.json();
    const text = (out.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
    const fields = extractJson(text) || {};
    return json({ fields });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
