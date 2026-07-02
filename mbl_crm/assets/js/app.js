/* ============================================================
   MBL CRM — boot, sidebar nav, language toggle, cloud connect
   ============================================================ */
(function () {
  const NAV = [
    ["grp_work", ["dashboard", "contacts", "companies"]],
    ["grp_pipeline", ["deals", "tasks"]],
    ["grp_tools", ["cardscan"]],
    ["grp_admin", ["settings"]],
  ];

  function buildNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = "";
    NAV.forEach(([grp, keys]) => {
      nav.appendChild(U.h("div", { class: "nav__group-label" }, I18N.t(grp)));
      keys.forEach((key) => {
        const p = PAGES[key]; if (!p) return;
        nav.appendChild(U.h("a", { href: "#/" + key, dataset: { key } }, [
          U.h("span", { class: "ico" }, p.icon || "•"),
          U.h("span", {}, p.title ? p.title() : key),
        ]));
      });
    });
  }

  function applyBrand() {
    const cfg = window.MBL_CONFIG || {};
    document.querySelectorAll(".brand__name").forEach((el) => (el.textContent = I18N.lang === "zh" ? (cfg.ORG_NAME_ZH || cfg.ORG_NAME) : cfg.ORG_NAME));
    document.title = (cfg.ORG_NAME || "MBL") + " — " + (cfg.APP_NAME || "CRM");
  }

  function syncLangToggle() {
    document.querySelectorAll("#langToggle [data-lang]").forEach((s) => {
      s.style.display = (s.dataset.lang === I18N.lang) ? "inline" : "none";
    });
  }

  function boot() {
    buildNav(); applyBrand(); syncLangToggle();

    document.getElementById("langToggle").addEventListener("click", () => {
      I18N.set(I18N.lang === "en" ? "zh" : "en");
      buildNav(); applyBrand(); syncLangToggle();
      Router.rerender();
    });
    document.getElementById("menuBtn").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });

    // data-source badge → connect / disconnect cloud database
    const src = document.getElementById("dataSrc");
    if (src) { src.style.cursor = "pointer"; src.title = I18N.t("connectCloud"); src.addEventListener("click", connectDbModal); }

    // account button (only when auth is active)
    const ub = document.getElementById("userBtn");
    if (ub && Auth.enabled && Auth.user) {
      ub.style.display = "";
      ub.title = Auth.user.email || I18N.t("account");
      ub.addEventListener("click", () => Router.go("#/settings"));
    }

    if (!location.hash) location.hash = "#/dashboard";
    Router.render();
  }

  function connectDbModal() {
    const H = U.h, t = I18N.t.bind(I18N), connected = Data.source === "supabase";
    const cfg = window.MBL_CONFIG || {};
    const url = H("input", { class: "input", placeholder: "https://xxxx.supabase.co", value: (cfg.SUPABASE_URL || "") });
    const key = H("input", { class: "input", placeholder: "Legacy JWT anon key — eyJ…", value: (cfg.SUPABASE_ANON_KEY || "") });
    const body = H("div", {}, [
      H("div", { class: "banner " + (connected ? "banner--info" : ""), style: "margin-bottom:12px" }, [
        H("span", {}, connected ? "☁️" : "💾"),
        H("div", { class: "small" }, connected ? t("cloudMode") : t("localMode")),
      ]),
      H("div", { class: "field" }, [H("label", {}, t("supaUrl")), url]),
      H("div", { class: "field" }, [H("label", {}, t("supaKey")), key]),
      H("div", { class: "small", style: "margin:-4px 0 6px;color:var(--warn)" }, "⚠ Use the Legacy JWT anon key (starts with eyJ…), from Settings → API Keys → Legacy. The new sb_publishable_ key does NOT work with Edge Functions (AI card scanning)."),
      H("div", { class: "small muted", style: "margin:0 0 10px" }, "Run supabase/schema.sql (and optionally seed.sql) in your Supabase project first."),
      H("button", { class: "btn btn--sm", onClick: () => Data.exportJson() }, "⤓ " + t("exportData")),
      connected ? H("button", { class: "btn btn--danger btn--sm", style: "margin-left:8px", onClick: () => { try { localStorage.removeItem("mblcrm_sb_url"); localStorage.removeItem("mblcrm_sb_key"); } catch (e) {} location.reload(); } }, t("disconnect")) : null,
    ]);
    U.modal("☁️ " + t("connectCloud"), body, {
      saveText: t("saveReload"),
      onSave() {
        const u = url.value.trim(), k = key.value.trim();
        if (!u || !k) { U.toast(t("bothRequired"), true); return false; }
        if (/^sb_(publishable|secret)_/.test(k)) {
          U.toast("Use the Legacy JWT anon key (eyJ…), not the sb_publishable_ key — Settings → API Keys → Legacy", true);
          return false;
        }
        try { localStorage.setItem("mblcrm_sb_url", u); localStorage.setItem("mblcrm_sb_key", k); } catch (e) {}
        location.reload();
      },
    });
  }

  window.MBLApp = { buildNav, connectDbModal };

  // wait for data, gate on auth, then boot UI
  Data.ready().then(() => Auth.ensure()).then(boot).catch((e) => { console.error(e); boot(); });
})();
