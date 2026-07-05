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

// Capture a Supabase invite / password-reset action from the URL NOW, before the
// Supabase client is created (it parses and clears the hash on init, which would
// otherwise hide the "type=invite|recovery" flag from auth.js).
try {
  var _mblAuth = /[#&?]type=(invite|recovery|signup|magiclink)/i.exec((location.hash || "") + (location.search || ""));
  window.MBL_AUTH_ACTION = _mblAuth ? _mblAuth[1].toLowerCase() : "";
} catch (e) { window.MBL_AUTH_ACTION = ""; }

window.MBL_CONFIG = {
  // ---- Supabase (blank = local demo mode; filled = cloud) ----
  // MBL Catering's OWN Supabase project (separate from MBL Tools). The publishable
  // key is public and safe to commit — the data is protected by Row Level Security.
  // (New Supabase API-key system: sb_publishable_… replaces the legacy anon JWT.)
  // A URL/key entered in-app (the data-source badge) overrides these defaults.
  SUPABASE_URL:      _sbUrl || "https://mmmjpkkvqfjegyawrisg.supabase.co",
  SUPABASE_ANON_KEY: _sbKey || "sb_publishable_aBheAvlkuLo_R_ipfO7O1Q_BEEJQ9Zr",

  // ---- Authentication (email login via Supabase Auth) ----
  // When connected to Supabase, the homepage requires visitors to sign in
  // before the management app loads. Set to false to leave it open (data is
  // still protected by Supabase RLS). Ignored in local demo mode.
  REQUIRE_AUTH: true,

  // ---- Login isolation (KEEP CATERING SEPARATE FROM MBL TOOLS) ----
  // Supabase logins belong to a Supabase PROJECT. Two apps that share the
  // same project also share the same users — a Catering account could then
  // sign into MBL Tools / MBL Shopping, and vice-versa. To keep the logins
  // separate, MBL Catering MUST use its OWN Supabase project, distinct from
  // the one MBL Tools uses.
  //
  // Safeguard: list here the Supabase project URL(s) used by your OTHER MBL
  // apps (e.g. MBL Tools / MBL Shopping). Catering will then REFUSE to connect
  // to any of them — so this app can never accidentally share their user pool.
  // Example: OTHER_APP_SUPABASE_URLS: ["https://abcd1234.supabase.co"]
  OTHER_APP_SUPABASE_URLS: ["https://axgxaeovlcvjbyqpybla.supabase.co"], // MBL Tools / MBL Shopping project

  // ---- Branding (also editable in assets/css/theme.css) ----
  ORG_NAME:    "MBL Catering",
  ORG_NAME_ZH: "MBL 餐飲",
  APP_NAME:    "Management",
  APP_NAME_ZH: "管理系統",

  // ---- Sites / campuses served (used by menus, production, people) ----
  DEFAULT_SITES: ["Liu-Gong Campus", "Yongchun"],

  // ---- Newsletter ----
  NEWSLETTER_FROM:     "kitchen@fbws.tw",
  NEWSLETTER_REPLY_TO: "kitchen@fbws.tw",
  // When Supabase is connected, the "Send" button calls this Edge Function.
  NEWSLETTER_FUNCTION: "send-newsletter",

  // ---- Defaults ----
  DEFAULT_LANG: "en",          // "en" | "zh"
  CURRENCY: "NT$",

  // ---- Pricing (homepage) ----
  // The MBL suite of apps, shown as pricing modules on every app's homepage.
  // `THIS_MODULE` marks which one IS this app: its card starts the trial here;
  // the others link out to their own site. Annual = 12 months − ANNUAL_DISCOUNT.
  THIS_MODULE: "catering",
  ANNUAL_DISCOUNT: 0.2,        // 20% off when paid annually (690×12×0.8 = 6,624)
  MODULES: [
    { key: "shopping", url: "https://www.fbws.tw/mbl",          monthly: 690 },
    { key: "catering", url: "https://www.fbws.tw/mbl_catering", monthly: 690 },
    { key: "crm",      url: "https://www.fbws.tw/mbl_crm",      monthly: 690 },
  ],
  BUNDLE: { monthly: 1990, comingSoon: true },

  // ---- Demo mode / full access ----
  // Without full access the app is a read-only demo of the seed data; any
  // add/edit/delete invites the visitor to subscribe. Full access is granted
  // while profiles.full_access_until is in the future (see supabase/voucher_schema.sql),
  // or for the emails listed here (so the owner is never demo-locked).
  ADMIN_EMAILS: ["michel.bru82@gmail.com"],
  // Supabase Edge Function that redeems a voucher for 1 month of full access.
  VOUCHER_FUNCTION: "redeem-voucher"
};
