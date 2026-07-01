/* ============================================================
   MBL Catering — CONFIGURATION
   ------------------------------------------------------------
   Fill these in to connect a real Supabase backend. If they are
   left blank, the app runs in LOCAL mode (seed data + your
   browser's localStorage) so you can use & demo it immediately.
   ============================================================ */

// Supabase credentials can be set here OR entered in-app (Sidebar → the data-source
// badge → Connect cloud database), which stores them in localStorage below.
var _sbUrl = "", _sbKey = "";
try { _sbUrl = localStorage.getItem("mbl_sb_url") || ""; _sbKey = localStorage.getItem("mbl_sb_key") || ""; } catch (e) {}

window.MBL_CONFIG = {
  // ---- Supabase (blank = local demo mode; filled = cloud) ----
  SUPABASE_URL:      _sbUrl,   // e.g. https://xxxx.supabase.co
  SUPABASE_ANON_KEY: _sbKey,   // public anon key

  // ---- Branding (also editable in assets/css/theme.css) ----
  ORG_NAME:    "MBL Catering",
  ORG_NAME_ZH: "MBL 餐飲",

  // ---- Sites / campuses served (used by menus, production, people) ----
  DEFAULT_SITES: ["Liu-Gong Campus", "Yongchun"],

  // ---- Newsletter ----
  NEWSLETTER_FROM:     "kitchen@fbws.tw",
  NEWSLETTER_REPLY_TO: "kitchen@fbws.tw",
  // When Supabase is connected, the "Send" button calls this Edge Function.
  NEWSLETTER_FUNCTION: "send-newsletter",

  // ---- Defaults ----
  DEFAULT_LANG: "en",          // "en" | "zh"
  CURRENCY: "NT$"
};
