/* Menu Builder — Configuration modal + generate/preview/apply.
   Opened from the ⚙️ Configuration button on the Monthly Menu page. */
window.MenuBuilder = (function () {
  const t = () => I18N.t.bind(I18N);
  const h = () => U.h;

  const WD = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const WD_LABEL = { mon: "Mon 週一", tue: "Tue 週二", wed: "Wed 週三", thu: "Thu 週四", fri: "Fri 週五", sat: "Sat 週六", sun: "Sun 週日" };
  const PROTEIN_OPTS = ["any", "chicken", "beef", "pork", "fish", "duck", "vegetarian", "vegan"];
  const PROTEIN_KEY = { any: "anyOpt", chicken: "chicken", beef: "beef", pork: "pork", fish: "fish", duck: "duck", vegetarian: "vegetarianP", vegan: "veganP" };
  const CUR = () => (window.MBL_CONFIG.CURRENCY || "NT$");

  function nextMonths(n) {
    const out = []; let [y, m] = U.TODAY.split("-").map(Number);
    for (let i = 0; i < n; i++) { out.push(`${y}-${String(m).padStart(2, "0")}`); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }
  const section = (title, node) => h()("div", { style: "margin:16px 0" }, [h()("h3", { style: "font-size:14px;margin-bottom:8px" }, title), node]);

  function open(currentMonth, profileId) {
    const T = t(), H = h();
    const curId = profileId || "menu_config";
    const cfg = MenuGen.getConfig(curId);
    const profiles = MenuGen.listProfiles();
    const monthsAvail = [...new Set([].concat(nextMonths(6), Data.all("menu_days").map((d) => d.date.slice(0, 7))))].sort();

    // ---- Profile selector ----
    const profSel = H("select", { class: "input", style: "max-width:220px", onChange: (e) => { document.querySelector(".modal-backdrop").click(); setTimeout(() => open(currentMonth, e.target.value), 40); } },
      profiles.map((p) => H("option", { value: p.id, selected: p.id === curId }, p.name)));
    const newProfBtn = H("button", { class: "btn btn--sm", onClick: () => newProfile(cfg, currentMonth) }, "＋ " + T("newProfile"));

    // ---- Months ----
    const monthChecks = {};
    const monthsBox = H("div", { class: "pill-list" }, monthsAvail.map((m) => {
      const cb = H("input", { type: "checkbox", checked: (cfg.months && cfg.months.length) ? cfg.months.includes(m) : m === currentMonth });
      monthChecks[m] = cb;
      return H("label", { class: "badge", style: "cursor:pointer;gap:6px" }, [cb, m]);
    }));

    // ---- Weekday rules ----
    const wdRows = {};
    const wdTable = H("table", { class: "data" }, [
      H("thead", {}, H("tr", {}, [H("th", {}, T("serviceDays")), H("th", {}, T("proteinLabel")), H("th", {}, T("cuisine"))])),
      H("tbody", {}, WD.map((wk) => {
        const r = (cfg.weekday && cfg.weekday[wk]) || { protein: "any", cuisine: "any" };
        const svc = H("input", { type: "checkbox", checked: (cfg.service_days || []).includes(wk) });
        const prot = H("select", { class: "input" }, PROTEIN_OPTS.map((p) => H("option", { value: p, selected: p === r.protein }, T(PROTEIN_KEY[p]))));
        const cui = H("select", { class: "input" }, ["any", "western", "asian"].map((c) => H("option", { value: c, selected: c === r.cuisine }, T(c === "any" ? "anyOpt" : c))));
        wdRows[wk] = { svc, prot, cui };
        return H("tr", {}, [H("td", {}, H("label", { style: "display:flex;gap:8px;align-items:center;cursor:pointer" }, [svc, WD_LABEL[wk]])), H("td", {}, prot), H("td", {}, cui)]);
      })),
    ]);

    // ---- Nutrition limits ----
    const nutRows = {};
    const nutTable = H("table", { class: "data" }, [
      H("thead", {}, H("tr", {}, [H("th", {}, T("nutritionRules")), H("th", { class: "num" }, T("minLbl")), H("th", { class: "num" }, T("maxLbl")), H("th", {}, T("compulsory"))])),
      H("tbody", {}, MenuGen.NUTRIENTS.map(([key, label, unit]) => {
        const cur = (cfg.nutrition && cfg.nutrition[key]) || {};
        const mn = H("input", { class: "input num", type: "number", step: "any", value: cur.min == null ? "" : cur.min, style: "max-width:90px" });
        const mx = H("input", { class: "input num", type: "number", step: "any", value: cur.max == null ? "" : cur.max, style: "max-width:90px" });
        const req = H("input", { type: "checkbox", checked: !!cur.required });
        nutRows[key] = { mn, mx, req };
        return H("tr", {}, [H("td", {}, [label, " ", H("span", { class: "small muted" }, unit)]), H("td", {}, mn), H("td", {}, mx), H("td", {}, H("label", { style: "cursor:pointer" }, req))]);
      })),
    ]);

    // ---- Options ----
    const rot = H("input", { class: "input num", type: "number", min: "1", step: "1", value: cfg.rotation_max || 4, style: "max-width:80px" });
    const gap = H("input", { class: "input num", type: "number", min: "0", step: "1", value: cfg.min_repeat_gap == null ? 7 : cfg.min_repeat_gap, style: "max-width:80px" });
    const maxCost = H("input", { class: "input num", type: "number", min: "0", step: "any", value: cfg.max_cost == null ? "" : cfg.max_cost, style: "max-width:100px" });
    const spread = H("input", { type: "checkbox", checked: cfg.spread_allergens !== false });
    const keep = H("input", { type: "checkbox", checked: cfg.keep_existing !== false });
    const optField = (label, node) => H("div", { class: "field", style: "margin:0" }, [H("label", {}, label), node]);
    const optToggle = (label, node) => H("label", { style: "display:flex;gap:8px;align-items:center;cursor:pointer;font-size:13px" }, [node, label]);
    const options = H("div", {}, [
      H("div", { class: "row", style: "align-items:flex-end" }, [
        optField(T("rotationRule"), H("div", { style: "display:flex;gap:6px;align-items:center" }, [rot, H("span", { class: "small muted" }, "× / " + (cfg.rotation_window_days || 60) + "d")])),
        optField(T("minGap"), gap),
        optField(T("maxCostLbl") + " (" + CUR() + ")", maxCost),
      ]),
      H("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:10px" }, [optToggle(T("spreadAllergens"), spread), optToggle(T("keepExisting"), keep)]),
    ]);

    const body = H("div", {}, [
      H("div", { class: "banner banner--info" }, [H("span", {}, "🧠"), H("div", { class: "small" }, T("builderIntro"))]),
      H("div", { class: "row", style: "align-items:flex-end" }, [
        H("div", { class: "field", style: "margin:0;flex:0 0 auto" }, [H("label", {}, T("profile")), profSel]),
        H("div", { style: "align-self:flex-end;padding-bottom:2px" }, newProfBtn),
      ]),
      section(T("months"), monthsBox),
      section(T("weekdayRules"), H("div", { class: "table-wrap" }, wdTable)),
      section(T("nutritionRules"), H("div", {}, [H("div", { class: "table-wrap" }, nutTable), H("div", { class: "small muted", style: "margin-top:6px" }, "Nutrition & cost are enforced only where ingredient data (macros / prices) exists; dishes missing data are skipped and reported.")])),
      section(T("optionsLbl"), options),
    ]);

    function collect() {
      const months = Object.keys(monthChecks).filter((m) => monthChecks[m].checked);
      const service_days = WD.filter((wk) => wdRows[wk].svc.checked);
      const weekday = {}; WD.forEach((wk) => (weekday[wk] = { protein: wdRows[wk].prot.value, cuisine: wdRows[wk].cui.value }));
      const nutrition = {};
      MenuGen.NUTRIENTS.forEach(([key]) => { const r = nutRows[key], o = {}; if (r.mn.value !== "") o.min = Number(r.mn.value); if (r.mx.value !== "") o.max = Number(r.mx.value); if (r.req.checked) o.required = true; if (Object.keys(o).length) nutrition[key] = o; });
      return {
        id: curId, name: cfg.name || (curId === "menu_config" ? "Default" : curId),
        months, service_days, weekday, nutrition,
        rotation_max: Number(rot.value) || 4, rotation_window_days: cfg.rotation_window_days || 60,
        min_repeat_gap: Number(gap.value) || 0, spread_allergens: spread.checked, keep_existing: keep.checked,
        max_cost: maxCost.value === "" ? null : Number(maxCost.value),
      };
    }

    U.modal("⚙️ " + T("menuBuilder"), body, {
      wide: true, saveText: "💾 " + T("saveConfig"),
      async onSave() { await MenuGen.saveConfig(collect(), curId); U.toast(T("saved")); return false; },
      buttons: [{
        label: "▶ " + T("generate"), class: "btn--primary", close: false, onClick: async () => {
          const c = collect();
          if (!c.months.length) { U.toast(T("months") + "?", true); return; }
          if (!c.service_days.length) { U.toast(T("serviceDays") + "?", true); return; }
          await MenuGen.saveConfig(c, curId);
          document.querySelector(".modal-backdrop").click();
          preview(MenuGen.generate(c.months, c), c, {});
        },
      }],
    });
  }

  function newProfile(baseCfg, currentMonth) {
    const T = t(), H = h();
    const nm = H("input", { class: "input", placeholder: T("profile") });
    U.modal(T("newProfile"), H("div", { class: "field" }, [H("label", {}, T("profile")), nm]), {
      async onSave() {
        const name = nm.value.trim(); if (!name) { U.toast("?", true); return false; }
        const id = "cfg_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        const clone = Object.assign({}, baseCfg, { id, name });
        await MenuGen.saveConfig(clone, id);
        U.toast(T("saved")); setTimeout(() => open(currentMonth, id), 40);
      },
    });
  }

  // ---------- preview & apply ----------
  function preview(result, cfg, lockedDays) {
    const T = t(), H = h();
    const locked = Object.assign({}, lockedDays || {});
    const rep = result.report;

    const summary = H("div", { class: "banner " + (rep.unfilled ? "" : "banner--info") }, [
      H("span", {}, rep.unfilled ? "⚠️" : "✅"),
      H("div", { class: "small" }, [
        H("b", {}, `${rep.days} ${T("daysBuilt")}`), rep.unfilled ? ` · ${rep.unfilled} ${T("slotsUnfilled")}` : " · all slots filled",
        H("div", { class: "muted", style: "margin-top:3px" }, `pools — main:${rep.poolSizes.main} veg:${rep.poolSizes.vegetable} carb:${rep.poolSizes.carb} dairy:${rep.poolSizes.dairy} fruit:${rep.poolSizes.fruit} side:${rep.poolSizes.side}`),
      ]),
    ]);

    let shortBox = null;
    if (rep.needed && rep.needed.length) {
      shortBox = H("div", { class: "card", style: "margin-bottom:14px;border-color:var(--allergen)" }, [
        H("div", { style: "display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap" }, [
          H("div", { style: "font-weight:700;color:var(--allergen)" }, "🧩 " + T("shortfall")), H("div", { style: "flex:1" }),
          H("button", { class: "btn btn--sm btn--accent", onClick: async () => {
            const r = await MenuGen.importMenuDishes();
            U.toast(`${r.created} ${T("imported")}`);
            document.querySelector(".modal-backdrop").click();
            setTimeout(() => preview(MenuGen.generate(cfg.months, cfg, { lockedDays: locked }), cfg, locked), 40);
          } }, "⬇ " + T("importDishes")),
        ]),
        H("table", { class: "data" }, [
          H("thead", {}, H("tr", {}, [H("th", {}, "Type"), H("th", { class: "num" }, "Days short"), H("th", { class: "num" }, "Suggest add")])),
          H("tbody", {}, rep.needed.map((n) => H("tr", {}, [H("td", {}, n.bucket), H("td", { class: "num" }, n.missingDays), H("td", { class: "num" }, "+" + n.suggestAdd)]))),
        ]),
        H("div", { class: "small muted", style: "margin-top:6px" }, T("addRecipesHint")),
      ]);
    }

    const SLOTS = [["meat", T("meat")], ["veg1", T("veg1")], ["veg2", T("veg2")], ["carb", T("carb")], ["dairy", T("dairy")], ["fruit", T("fruit")], ["side", "Side"]];
    const grid = H("div", { style: "display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));max-height:46vh;overflow:auto;padding:2px" },
      result.days.map((d) => {
        const lockCb = H("input", { type: "checkbox", checked: !!(locked[d.date] || d.kept), disabled: !!d.kept, onChange: (e) => { if (e.target.checked) locked[d.date] = d.slots; else delete locked[d.date]; } });
        return H("div", { class: "card", style: "padding:12px" + (d.kept ? ";opacity:.75" : "") }, [
          H("div", { style: "display:flex;align-items:center;gap:6px" }, [
            H("b", {}, U.fmtDate(d.date)), H("span", { class: "small muted" }, U.weekdayName(d.date)),
            d.kept ? H("span", { class: "badge", style: "margin-left:4px" }, T("kept")) : null,
            H("div", { style: "flex:1" }),
            d.cost != null ? H("span", { class: "small muted" }, CUR() + d.cost) : null,
            H("label", { class: "small", style: "display:flex;gap:4px;align-items:center;cursor:pointer" }, [lockCb, "🔒"]),
          ]),
          ...SLOTS.map(([k, lab]) => {
            const s = d.slots[k]; const r = s && s.recipe_id && Data.get("recipes", s.recipe_id); const zh = r && r.name_zh ? " · " + r.name_zh : "";
            return H("div", { style: "display:flex;gap:6px;font-size:12px;padding:3px 0;border-bottom:1px solid var(--border)" }, [
              H("span", { class: "badge badge--cat", style: "flex:0 0 60px;justify-content:flex-start;font-size:10px" }, lab),
              H("div", { style: "flex:1;min-width:0" }, s ? (s.na ? H("span", { class: "muted" }, T("notApplicable")) : [s.name_en, zh ? H("span", { class: "bilingual-zh zh" }, zh) : null]) : H("span", { style: "color:var(--allergen)" }, "— missing")),
            ]);
          }),
          d.violations && d.violations.length ? H("div", { class: "small", style: "color:var(--warn);margin-top:5px" }, "⚠ " + d.violations.map((v) => `${v.key} ${v.type} ${v.value}/${v.limit}`).join(", ")) : null,
        ]);
      }));

    const body = H("div", {}, [summary, shortBox, grid, H("div", { class: "small muted", style: "margin-top:10px" }, "🔒 lock a day to keep it when you regenerate · ⚠ " + T("overwriteWarn"))]);

    U.modal("▶ " + T("menuBuilder") + " — " + T("applyToMenu"), body, {
      wide: true, saveText: "✅ " + T("applyToMenu"),
      async onSave() {
        let n = 0;
        for (const d of result.days) {
          if (d.kept) continue; // existing menu left untouched
          const existing = Data.menuForDate(d.date);
          if (existing) await Data.update("menu_days", existing.id, { slots: d.slots });
          else await Data.create("menu_days", { id: "menu_" + d.date, date: d.date, site: "Liu-Gong Campus + Yongchun", slots: d.slots, notes: "" });
          n++;
        }
        U.toast(`${n} ${T("daysBuilt")}`);
        if (result.days[0]) Router.go("#/menu/" + result.days[0].date.slice(0, 7));
        Router.rerender();
      },
      buttons: [
        { label: "🔄 " + T("regenerate"), close: true, onClick: () => setTimeout(() => preview(MenuGen.generate(cfg.months, cfg, { lockedDays: locked }), cfg, locked), 40) },
        { label: "⚙️ " + T("config"), close: true, onClick: () => setTimeout(() => open((cfg.months || [])[0] || U.TODAY.slice(0, 7), cfg.id), 40) },
      ],
    });
  }

  return { open, preview };
})();
