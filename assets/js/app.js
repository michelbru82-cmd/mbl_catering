/* ============================================================
   MBL Catering — boot, sidebar nav, language toggle
   ============================================================ */
(function () {
  // navigation layout: [groupLabelKey, [pageKey,...]]
  const NAV_CATERING = [
    ["grp_planning", ["dashboard", "menu"]],
    ["grp_kitchen", ["recipes", "ingredients", "production", "people"]],
    ["grp_print", ["printMenu", "labels", "allergenMatrix", "newsletter"]],
    ["grp_admin", ["places", "allergens"]],
  ];
  const NAV_SHOP = [
    ["grp_kitchen", ["recipes", "ingredients"]],
    ["grp_print", ["recipeCards", "priceList", "labels", "allergenMatrix", "newsletter"]],
    ["grp_admin", ["places", "allergens"]],
  ];
  function currentNav() { return Data.activePlaceType() === "shop" ? NAV_SHOP : NAV_CATERING; }

  function buildPlaceSwitcher() {
    const places = Data.places();
    const sel = U.h("select", { class: "input", style: "width:100%;font-weight:600", onChange: (e) => {
      Data.setActivePlace(e.target.value); buildNav();
      const key = (location.hash.replace(/^#\//, "").split("/")[0]) || "";
      const allowed = new Set(currentNav().flatMap(([, ks]) => ks).concat("dashboard"));
      if (!allowed.has(key)) { location.hash = "#/" + currentNav()[0][1][0]; }
      Router.rerender();
    } },
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
    currentNav().forEach(([grp, keys]) => {
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

    // sign out — only meaningful when email auth is active (Supabase + REQUIRE_AUTH)
    const signOutBtn = document.getElementById("signOutBtn");
    if (signOutBtn && window.Auth && Auth.enabled) {
      signOutBtn.style.display = "";
      signOutBtn.title = I18N.t("signOut");
      signOutBtn.addEventListener("click", () => Auth.signOut());
    }
    // brand → reopen the homepage
    const brand = document.getElementById("brandHome");
    if (brand && window.Auth) brand.addEventListener("click", () => Auth.openHome());

    // data-source badge → connect / disconnect cloud database
    const src = document.getElementById("dataSrc");
    if (src) { src.style.cursor = "pointer"; src.title = "Connect cloud database"; src.addEventListener("click", connectDbModal); }

    if (!location.hash) location.hash = "#/dashboard";
    Router.render();
  }

  // Export the current (browser) data as a SQL script to load into Supabase.
  function exportSql() {
    const q = (v) => v == null ? "null" : typeof v === "number" ? String(v) : typeof v === "boolean" ? (v ? "true" : "false")
      : typeof v === "object" ? "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb" : "'" + String(v).replace(/'/g, "''") + "'";
    const TABLES = {
      allergens: ["id", "name_en", "name_zh", "code"],
      sites: ["id", "name", "name_zh", "covers"],
      places: ["id", "name", "name_zh", "type", "covers", "use_by_days", "food_cost_pct", "representative", "tax_number", "email", "phone", "address", "delivery_site"],
      ingredients: ["id", "name_en", "name_zh", "supplier", "category", "origin", "kcal", "protein", "carbs", "fat", "sugar", "added_sugar", "fiber", "sodium", "calcium", "salt", "price_per_kg", "unit_weight", "unit_label", "allergen_ids"],
      recipes: ["id", "name_en", "name_zh", "category", "yield_portions", "portion_weight", "method", "prep_min", "cook_min", "sale_price", "course", "protein", "cuisine", "contains_carb", "items", "allergen_ids"],
      menu_days: ["id", "place_id", "date", "site", "slots", "notes"],
      people: ["id", "place_id", "name", "kind", "site_id", "date_in", "date_out", "allergen_ids"],
      subscribers: ["id", "place_id", "email", "name", "active", "created_at"],
      settings: ["id", "place_id", "name", "months", "service_days", "weekday", "nutrition", "rotation_max", "rotation_window_days", "min_repeat_gap", "spread_allergens", "keep_existing", "max_cost"],
    };
    let out = "-- MBL Catering — data export\n-- Run AFTER supabase/schema.sql, in the Supabase SQL editor.\nbegin;\n";
    Object.keys(TABLES).forEach((tbl) => {
      const cols = TABLES[tbl], rows = Data.allRaw(tbl);
      if (!rows.length) return;
      out += `\n-- ${tbl} (${rows.length})\n`;
      rows.forEach((r) => { out += `insert into ${tbl} (${cols.join(",")}) values (${cols.map((c) => q(r[c])).join(",")}) on conflict (id) do nothing;\n`; });
    });
    out += "\ncommit;\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([out], { type: "text/sql" }));
    a.download = "mbl_data.sql"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    U.toast("mbl_data.sql downloaded");
  }

  function connectDbModal() {
    const H = U.h, connected = Data.source === "supabase";
    const url = H("input", { class: "input", placeholder: "https://xxxx.supabase.co", value: (window.MBL_CONFIG.SUPABASE_URL || "") });
    const key = H("input", { class: "input", placeholder: "anon public key", value: (window.MBL_CONFIG.SUPABASE_ANON_KEY || "") });
    const body = H("div", {}, [
      H("div", { class: "banner banner--info", style: "margin-bottom:12px" }, [H("span", {}, connected ? "☁️" : "💾"),
        H("div", { class: "small" }, connected
          ? "Connected to your cloud database (Supabase). Data is stored on the server and shared across devices."
          : "Currently LOCAL (this browser only). Paste your Supabase Project URL + anon key to store data in the cloud. First run supabase/schema.sql and supabase/seed.sql in your Supabase SQL editor.")]),
      H("div", { class: "field" }, [H("label", {}, "Supabase URL"), url]),
      H("div", { class: "field" }, [H("label", {}, "Supabase anon key"), key]),
      H("div", { class: "banner banner--allergen small", style: "margin:-4px 0 10px" },
        "⚠ Use a Supabase project that is ONLY for MBL Catering. Do NOT reuse the MBL Tools / MBL Shopping project, or the two apps would share the same logins."),
      H("div", { class: "small muted", style: "margin:-4px 0 10px" }, "Tip: export your current data first, then run it in Supabase so the cloud starts with everything you have now."),
      H("button", { class: "btn btn--sm", onClick: () => exportSql() }, "⤓ Export my current data as SQL"),
      connected ? H("button", { class: "btn btn--danger btn--sm", onClick: () => { try { localStorage.removeItem("mbl_sb_url"); localStorage.removeItem("mbl_sb_key"); } catch (e) {} location.reload(); } }, "Disconnect (back to local)") : null,
    ]);
    U.modal("☁️ " + "Connect cloud database", body, {
      saveText: "Save & reload",
      onSave() {
        const u = url.value.trim(), k = key.value.trim();
        if (!u || !k) { U.toast("Both fields required", true); return false; }
        // Login isolation: refuse a project used by another MBL app.
        const ref = (window.MBL_projRef || (() => ""))(u);
        if (ref && (window.MBL_forbiddenRefs || []).includes(ref)) {
          U.toast("That project belongs to another MBL app — use Catering's own Supabase project so logins stay separate.", true);
          return false;
        }
        try { localStorage.setItem("mbl_sb_url", u); localStorage.setItem("mbl_sb_key", k); } catch (e) {}
        location.reload();
      },
    });
  }

  // expose nav rebuild so the Places page can refresh the switcher after changes
  window.MBLApp = { buildNav, connectDbModal };

  // wait for data, gate on the homepage / auth, then boot the UI
  Data.ready()
    .then(() => (window.Auth ? Auth.ensure() : true))
    .then(boot);
})();
