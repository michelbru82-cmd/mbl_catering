/* ============================================================
   MBL CRM — CONFIGURATION
   ------------------------------------------------------------
   Fill these in to connect a real Supabase backend. If they are
   left blank, the app runs in LOCAL mode (demo data + your
   browser's localStorage) so you can use & demo it immediately.

   Supabase can also be connected in-app (Sidebar → the data-source
   badge), which stores the keys in localStorage below.
   ============================================================ */
var _sbUrl = "", _sbKey = "";
try { _sbUrl = (localStorage.getItem("mblcrm_sb_url") || "").trim(); _sbKey = (localStorage.getItem("mblcrm_sb_key") || "").trim(); } catch (e) {}

window.MBL_CONFIG = {
  // ---- Supabase (blank = local demo mode; filled = cloud) ----
  SUPABASE_URL:      _sbUrl,   // e.g. https://xxxx.supabase.co
  SUPABASE_ANON_KEY: _sbKey,   // public anon key

  // ---- Branding (also editable in assets/css/theme.css) ----
  ORG_NAME:    "MBL",
  ORG_NAME_ZH: "MBL",
  APP_NAME:    "CRM",

  // ---- AI (business-card scanning + company enrichment) ----
  // These call Supabase Edge Functions that hold the AI API key server-side.
  // In LOCAL mode (no Supabase) a built-in mock extractor is used so the whole
  // flow works offline for demos.
  AI_SCAN_FUNCTION:   "scan-card",
  AI_ENRICH_FUNCTION: "enrich-company",

  // ---- Auth ----
  // When Supabase is connected the app requires email login (Supabase Auth).
  // In local demo mode login is skipped.
  REQUIRE_AUTH: true,

  // ---- Defaults ----
  DEFAULT_LANG: "en",          // "en" | "zh"
  CURRENCY: "NT$"
};
