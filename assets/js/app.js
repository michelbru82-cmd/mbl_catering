/* ============================================================
   MBL Catering — boot, sidebar nav, language toggle
   ============================================================ */
(function () {
  // navigation layout: [groupLabelKey, [pageKey,...]]
  const NAV = [
    ["grp_planning", ["dashboard", "menu"]],
    ["grp_kitchen", ["recipes", "ingredients", "production", "people"]],
    ["grp_print", ["printMenu", "labels", "newsletter"]],
    ["grp_admin", ["places", "allergens"]],
  ];

  function buildPlaceSwitcher() {
    const places = Data.places();
    const sel = U.h("select", { class: "input", style: "width:100%;font-weight:600", onChange: (e) => { Data.setActivePlace(e.target.value); buildNav(); Router.rerender(); } },
      places.map((p) => U.h("option", { value: p.id, selected: p.id === Data.activePlaceId() }, (I18N.lang === "zh" && p.name_zh) ? p.name_zh : p.name)));
    return U.h("div", { style: "padding:10px 12px 12px" }, [
      U.h("div", { style: "font-size:11px;text-transform:uppercase;letter-spacing:.04em;opacity:.7;margin-bottom:4px" }, "🏢 " + I18N.t("place")),
      sel,
    ]);
  }

  function buildNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = "";
    nav.appendChild(buildPlaceSwitcher());
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
    document.title = (cfg.ORG_NAME || "MBL Catering") + " — Management";
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

    if (!location.hash) location.hash = "#/dashboard";
    Router.render();
  }

  // expose nav rebuild so the Places page can refresh the switcher after changes
  window.MBLApp = { buildNav };

  // wait for data then boot UI
  Data.ready().then(boot);
})();
