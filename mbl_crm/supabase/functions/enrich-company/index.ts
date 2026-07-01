// ============================================================
// MBL CRM — "enrich-company" Supabase Edge Function
// ------------------------------------------------------------
// Gathers a public overview of a company with Claude + web search
// and returns it as structured JSON. The app calls this with
// { name, website } and gets back { company: {...} }.
//
// WIRE IT UP (once):
//   1. Set the API key secret:
//      supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//      (optional) supabase secrets set ANTHROPIC_MODEL=claude-sonnet-5
//   2. Deploy:
//      supabase functions deploy enrich-company
// ============================================================

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Pull the first {...} JSON object out of a text blob (the model may
// wrap it in prose after using the web-search tool).
function extractJson(text: string): any {
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
    const { name, website } = await req.json();
    if (!name) return json({ error: "no name" }, 400);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "ANTHROPIC_API_KEY not set" }, 500);
    const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5";

    const prompt = `Research the company "${name}"${website ? ` (website: ${website})` : ""} using web search and return a concise public overview.\n\n` +
      `Respond with ONLY a JSON object (no prose) of this shape:\n` +
      `{\n` +
      `  "name": string,\n` +
      `  "industry": string,\n` +
      `  "size": string,          // e.g. "11-50", "1000+"\n` +
      `  "headquarters": string,\n` +
      `  "founded": string,\n` +
      `  "revenue": string,\n` +
      `  "website": string,\n` +
      `  "description": string,   // 1-3 sentences\n` +
      `  "socials": { "linkedin": string, "facebook": string, "x": string },\n` +
      `  "key_people": [ { "name": string, "title": string } ],\n` +
      `  "recent_news": [ { "title": string, "url": string } ]\n` +
      `}\n` +
      `Use empty strings / empty arrays for anything you cannot verify. Do not invent facts.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) return json({ error: "anthropic " + resp.status, detail: await resp.text() }, 502);
    const out = await resp.json();
    // Concatenate all text blocks (final answer follows the web_search_tool_result blocks).
    const text = (out.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
    const company = extractJson(text) || { name, description: "No public information found.", _mock: false };
    return json({ company });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
