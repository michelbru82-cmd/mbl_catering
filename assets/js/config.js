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

  // ---- Events / mailings ----
  // Who event thank-you emails are sent from (falls back to NEWSLETTER_FROM).
  EVENT_FROM: "hello@fbws.tw",
  // Reusable email signature — used by BOTH the event thank-you emails and the
  // newsletter. This is your FBWS signature. To show the "add us on LINE" QR,
  // host the image somewhere public and set SIGNATURE_QR_URL below (leave blank
  // to hide it). You can also update the LINE link in SIGNATURE_LINE_URL.
  SIGNATURE_QR_URL:   "https://fbws.tw/fbws_qrcode.png",  // LINE QR image (blank = hidden)
  SIGNATURE_LINE_URL: "https://line.me/R/ti/p/@fbws",  // your LINE add-friend link
  // Details block only — U.signature() lays this out with the QR beside it.
  SIGNATURE_HTML:
    '<div style="font-size:16px;font-weight:700;margin-bottom:4px">FBWS 昇達人力顧問</div>' +
    '<div style="color:#23211c">台北市松山區民權東路三段178號8樓</div>' +
    '<div style="color:#5566aa;margin-bottom:6px">8F, 178, MinQuan E. Rd., Sec. 3, Taipei, Taiwan</div>' +
    '<div>📱 WhatsApp: <b>0927 205 382</b></div>' +
    '<div>💬 LINE: <a href="https://line.me/R/ti/p/@fbws" style="color:#2f9d5f;font-weight:600;text-decoration:none">Add us on LINE</a></div>' +
    '<div>🕐 Mon–Fri 09:00–18:00</div>' +
    '<div>🌐 <a href="https://www.fbws.tw" style="color:#2f7d4f;font-weight:600;text-decoration:none">www.fbws.tw</a></div>',
  SIGNATURE_TEXT:
    "—\nFBWS 昇達人力顧問\n8F, 178, MinQuan E. Rd., Sec. 3, Taipei, Taiwan\nWhatsApp: 0927 205 382 · LINE: @fbws\nMon–Fri 09:00–18:00\nwww.fbws.tw",

  // ---- Defaults ----
  DEFAULT_LANG: "en",          // "en" | "zh"
  CURRENCY: "NT$"
};
