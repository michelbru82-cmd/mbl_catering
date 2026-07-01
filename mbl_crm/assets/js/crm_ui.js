/* ============================================================
   MBL CRM — shared render helpers (avatars, pills, channels)
   ============================================================ */
(function () {
  const h = U.h;

  // Deterministic avatar colour from a string (no Math.random)
  function hueOf(s) {
    let n = 0; for (let i = 0; i < (s || "").length; i++) n = (n * 31 + s.charCodeAt(i)) % 360;
    return n;
  }

  const CRM = {
    avatar(contact, cls) {
      const name = Data.contactName(contact) || "?";
      const style = `background:hsl(${hueOf(name)},42%,42%)`;
      if (contact && contact.photo) {
        return h("span", { class: "avatar " + (cls || ""), style }, h("img", { src: contact.photo, alt: name }));
      }
      return h("span", { class: "avatar " + (cls || ""), style }, Data.initials(contact) || "?");
    },

    status(s) {
      const key = "st_" + (s || "lead");
      return h("span", { class: "status status--" + (s || "lead") }, I18N.t(key));
    },

    tags(list) {
      return h("div", { class: "pill-list" }, (list || []).map((tg) => h("span", { class: "tag" }, tg)));
    },

    // channel chips with click-to-open where possible
    channels(c) {
      if (!c) return h("span");
      const items = [];
      const add = (cls, label, href) => items.push(href
        ? h("a", { class: "chan " + cls, href, target: "_blank", rel: "noopener" }, label)
        : h("span", { class: "chan " + cls }, label));
      if (c.line) add("chan--line", "Line: " + c.line, null);
      if (c.whatsapp) add("chan--whatsapp", "WhatsApp", "https://wa.me/" + String(c.whatsapp).replace(/[^0-9]/g, ""));
      if (c.wechat) add("chan--wechat", "WeChat: " + c.wechat, null);
      if (c.telegram) add("chan", "Telegram: " + c.telegram, null);
      if (c.linkedin) add("chan--linkedin", "LinkedIn", c.linkedin);
      if (c.facebook) add("chan", "Facebook", c.facebook.startsWith("http") ? c.facebook : null);
      if (c.instagram) add("chan", "Instagram", null);
      if (c.x) add("chan", "X", null);
      return h("div", { class: "pill-list" }, items);
    },

    followupBadge(iso) {
      if (!iso) return h("span", { class: "muted small" }, "—");
      const state = Data.followState(iso);
      const cls = state === "over" ? "due-over" : state === "today" ? "due-soon" : "";
      return h("span", { class: "small " + cls }, U.fmtDate(iso));
    },

    money(v) {
      const cur = (window.MBL_CONFIG || {}).CURRENCY || "NT$";
      if (v == null || v === "") return "—";
      return cur + " " + Number(v).toLocaleString();
    },

    // a "mailto"/"tel" link cell
    link(kind, val) {
      if (!val) return h("span", { class: "muted" }, "—");
      const href = kind === "email" ? "mailto:" + val : kind === "tel" ? "tel:" + val : val;
      return h("a", { href, target: kind === "url" ? "_blank" : null, rel: "noopener" }, val);
    },

    empty(msg) {
      return h("div", { class: "empty" }, [h("div", { class: "big" }, "🗂️"), h("div", {}, msg || I18N.t("nothingHere"))]);
    },
  };

  window.CRM = CRM;
})();
