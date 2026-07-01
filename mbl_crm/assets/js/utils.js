/* ============================================================
   MBL Catering — small DOM + helper utilities
   ============================================================ */
(function () {
  // hyperscript-ish element builder
  function h(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "text") el.textContent = v;
      else if (k === "dataset") for (const d in v) el.dataset[d] = v[d];
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "value") el.value = v;
      else el.setAttribute(k, v);
    }
    if (children != null) (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null || c === false) return;
      el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
    });
    return el;
  }
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function toast(msg, isErr) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = "toast"), 2600);
  }

  // Promise-based modal. content = DOM node or html string. opts.onSave -> return false to keep open.
  function modal(title, content, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const body = typeof content === "string" ? h("div", { html: content }) : content;
      const foot = h("div", { class: "modal__foot" });
      const close = (val) => { document.body.removeChild(back); resolve(val); };
      if (opts.hideCancel !== true)
        foot.appendChild(h("button", { class: "btn", onClick: () => close(null) }, opts.cancelText || I18N.t("cancel")));
      if (opts.onSave)
        foot.appendChild(h("button", { class: "btn btn--primary", onClick: async () => {
          const r = await opts.onSave(box); if (r !== false) close(r === undefined ? true : r);
        } }, opts.saveText || I18N.t("save")));
      if (opts.buttons) opts.buttons.forEach((b) => foot.appendChild(
        h("button", { class: "btn " + (b.class || ""), onClick: () => { if (b.onClick) b.onClick(); if (b.close !== false) close(b.value); } }, b.label)));
      const box = h("div", { class: "modal" + (opts.wide ? " wide" : "") }, [
        h("div", { class: "modal__head" }, [h("h3", {}, title),
          h("button", { class: "btn btn--ghost", onClick: () => close(null) }, "✕")]),
        body, foot,
      ]);
      const back = h("div", { class: "modal-backdrop", onClick: (e) => { if (e.target === back) close(null); } }, box);
      document.body.appendChild(back);
      const first = box.querySelector("input,select,textarea"); if (first) first.focus();
    });
  }

  async function confirmDelete(msg) {
    return await modal(I18N.t("delete"), h("p", {}, msg || I18N.t("confirmDelete")), {
      hideCancel: true,
      buttons: [
        { label: I18N.t("cancel"), value: false, class: "" },
        { label: I18N.t("delete"), value: true, class: "btn--danger" },
      ],
    });
  }

  // date helpers — TODAY is the real current date (local time), used for follow-ups.
  const _now = new Date();
  const TODAY = [_now.getFullYear(), String(_now.getMonth() + 1).padStart(2, "0"), String(_now.getDate()).padStart(2, "0")].join("-");
  function isoAddDays(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return dt.toISOString().slice(0, 10);
  }
  function fmtDate(iso, withWeekday) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const loc = I18N.lang === "zh" ? "zh-TW" : "en-GB";
    return dt.toLocaleDateString(loc, { year: "numeric", month: "short", day: "numeric", weekday: withWeekday ? "short" : undefined, timeZone: "UTC" });
  }
  function weekdayName(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString(I18N.lang === "zh" ? "zh-TW" : "en-GB", { weekday: "long", timeZone: "UTC" });
  }
  const round = (n, d = 1) => n == null ? null : Math.round(n * 10 ** d) / 10 ** d;
  const fmtNum = (n) => n == null ? "—" : (Math.round(n * 10) / 10).toLocaleString();
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  window.U = { h, esc, toast, modal, confirmDelete, isoAddDays, fmtDate, weekdayName, round, fmtNum, debounce, TODAY };
})();
