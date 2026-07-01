/* Print Labels — professional food-packaging labels for a chosen day's menu.
   Pick a day (default today) → its dishes' labels show below; search to add extra
   dishes (no full list); choose size + orientation; print. */
PAGES.labels = {
  icon: "🏷️", title: () => I18N.t("labels"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    const SLOTS = ["meat", "veg1", "veg2", "carb", "dairy", "fruit", "side"];
    // default day = today; if today has no menu, jump to the nearest upcoming menu day
    const menuDates = Data.all("menu_days").map((d) => d.date).sort();
    const initDate = menuDates.includes(U.TODAY) ? U.TODAY : (menuDates.find((d) => d >= U.TODAY) || U.TODAY);
    // default: landscape 12 cm × 5.2 cm
    const state = { scope: "day", date: initDate, orientation: "landscape", w: 12, hh: 5.2, showNut: true, showAlg: true, showIngr: true, showQR: true, selected: new Set(), qty: {} };
    const qtyOf = (id) => Math.max(1, Math.round(state.qty[id] || 1));

    // ---- controls ----
    const scopeSel = h("select", { class: "input", onChange: (e) => { state.scope = e.target.value; render(); } },
      [h("option", { value: "day", selected: true }, t("scopeDay")), h("option", { value: "week" }, t("scopeWeek"))]);
    const dateI = h("input", { class: "input", type: "date", value: state.date, onChange: (e) => { state.date = e.target.value; loadDay(); } });
    // Shop / restaurant: no menu days — just choose the production date for the labels.
    const shopDateI = h("input", { class: "input", type: "date", value: state.date, onChange: (e) => { state.date = e.target.value; render(); } });

    // Monday of the week containing an ISO date
    function monday(iso) { const [y, m, d] = iso.split("-").map(Number); const dt = new Date(Date.UTC(y, m - 1, d)); const wd = (dt.getUTCDay() + 6) % 7; dt.setUTCDate(dt.getUTCDate() - wd); return dt.toISOString().slice(0, 10); }

    const orientSel = h("select", { class: "input", onChange: (e) => {
      state.orientation = e.target.value;
      const lng = Math.max(state.w, state.hh), sht = Math.min(state.w, state.hh);
      if (e.target.value === "landscape") { state.w = lng; state.hh = sht; } else { state.w = sht; state.hh = lng; }
      widthI.value = state.w; heightI.value = state.hh; render();
    } }, [h("option", { value: "landscape", selected: true }, t("landscape")), h("option", { value: "portrait" }, t("portrait"))]);

    const PRESETS = [[12, 5.2], [10, 5], [9, 6], [8, 4], [7, 3.5]];
    const presetSel = h("select", { class: "input", onChange: (e) => {
      if (e.target.value === "") return;
      const [lng, sht] = PRESETS[Number(e.target.value)];
      if (state.orientation === "landscape") { state.w = lng; state.hh = sht; } else { state.w = sht; state.hh = lng; }
      widthI.value = state.w; heightI.value = state.hh; render();
    } }, [h("option", { value: "" }, t("sizePreset") + "…"), ...PRESETS.map(([a, b], i) => h("option", { value: i }, a + " × " + b + " cm"))]);

    const numI = (val, on) => h("input", { class: "input num", type: "number", min: "1", step: "0.1", value: val, style: "max-width:80px", oninput: (e) => { on(Number(e.target.value)); render(); } });
    const widthI = numI(state.w, (v) => (state.w = v));
    const heightI = numI(state.hh, (v) => (state.hh = v));

    const searchList = h("datalist", { id: "lbl-recipes" }, Data.all("recipes").map((r) => h("option", { value: r.name_en })));
    const search = h("input", { class: "input search", list: "lbl-recipes", placeholder: t("search") + " " + t("recipes"),
      onChange: (e) => { const v = e.target.value.trim().toLowerCase(); const r = Data.all("recipes").find((x) => x.name_en.toLowerCase() === v); if (r) { state.selected.add(r.id); e.target.value = ""; render(); } } });

    const nutChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [h("input", { type: "checkbox", checked: state.showNut, onChange: (e) => { state.showNut = e.target.checked; render(); } }), t("showNutrition")]);
    const algChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [h("input", { type: "checkbox", checked: state.showAlg, onChange: (e) => { state.showAlg = e.target.checked; render(); } }), t("showAllergens")]);
    const ingrChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [h("input", { type: "checkbox", checked: state.showIngr, onChange: (e) => { state.showIngr = e.target.checked; render(); } }), t("showIngredients")]);
    const qrChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [h("input", { type: "checkbox", checked: state.showQR, onChange: (e) => { state.showQR = e.target.checked; render(); } }), t("showQR")]);

    const isShop = Data.activePlaceType() === "shop";
    view.appendChild(searchList);
    view.appendChild(h("div", { class: "toolbar no-print" }, [
      ...(isShop ? [h("span", { class: "small muted" }, t("preparedOn")), shopDateI] : [scopeSel, dateI]),
      h("span", { class: "small muted" }, t("orientation")), orientSel, presetSel,
      h("span", { class: "small muted" }, t("widthCm")), widthI,
      h("span", { class: "small muted" }, t("heightCm")), heightI,
      nutChk, algChk, ingrChk, qrChk,
      h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => window.print() }, "🖨 " + t("print")),
    ]));
    view.appendChild(h("div", { id: "lbl-search-row", class: "toolbar no-print", style: "margin-top:0" }, [
      h("span", { class: "small muted" }, t("search") + ":"), search,
      h("div", { id: "lbl-selected", class: "pill-list", style: "flex:1" }),
    ]));

    // Shop / restaurant product picker (no menu days): tick which products to print.
    const shopPicker = isShop ? h("div", { class: "no-print", style: "margin:0 0 10px" }) : null;
    if (shopPicker) view.appendChild(shopPicker);

    function renderShopPicker() {
      if (!shopPicker) return;
      shopPicker.innerHTML = "";
      const recs = Data.all("recipes").slice().sort((a, b) => a.name_en.localeCompare(b.name_en));
      shopPicker.appendChild(h("div", { class: "toolbar no-print", style: "gap:8px" }, [
        h("span", { class: "small muted" }, t("chooseProducts")),
        h("button", { class: "btn btn--sm", onClick: () => { recs.forEach((r) => state.selected.add(r.id)); render(); } }, t("selectAll")),
        h("button", { class: "btn btn--sm", onClick: () => { state.selected.clear(); render(); } }, t("clearSel")),
      ]));
      const grid = h("div", { class: "pill-list", style: "display:flex;flex-wrap:wrap;gap:6px;margin-top:6px" });
      recs.forEach((r) => {
        const on = state.selected.has(r.id);
        const chip = h("button", { type: "button", class: "badge" + (on ? " badge--cat" : ""), style: "cursor:pointer",
          onClick: () => { on ? state.selected.delete(r.id) : state.selected.add(r.id); render(); } },
          [(on ? "✓ " : "") + r.name_en]);
        // when ticked, an inline "× N" input sets how many copies to print
        const qtyI = on ? h("input", { class: "input num", type: "number", min: "1", step: "1", value: qtyOf(r.id), title: t("copies"),
          style: "max-width:56px", onClick: (e) => e.stopPropagation(),
          oninput: (e) => { state.qty[r.id] = Math.max(1, Math.round(Number(e.target.value) || 1)); drawLabels(); } }) : null;
        grid.appendChild(h("span", { style: "display:inline-flex;align-items:center;gap:3px" }, [chip, on ? h("span", { class: "small muted" }, "×") : null, qtyI]));
      });
      shopPicker.appendChild(grid);
    }

    const labelArea = h("div", { class: "print-area" }); view.appendChild(labelArea);

    function loadDay() {
      state.selected = new Set();
      const menu = Data.menuForDate(state.date);
      if (menu) SLOTS.forEach((k) => { const s = menu.slots[k]; if (s && s.recipe_id) state.selected.add(s.recipe_id); });
      render();
    }

    function renderSelectedChips() {
      const host = document.getElementById("lbl-selected"); if (!host) return; host.innerHTML = "";
      [...state.selected].map((id) => Data.get("recipes", id)).filter(Boolean).forEach((r) => {
        host.appendChild(h("button", { type: "button", class: "badge badge--cat", style: "cursor:pointer", title: t("delete"), onClick: () => { state.selected.delete(r.id); render(); } }, [r.name_en, " ✕"]));
      });
    }

    function labelGrid(pairs) {
      // pairs: [{recipe, date}]
      const grid = h("div", { style: "display:flex;flex-wrap:wrap;gap:6mm;align-items:flex-start" });
      pairs.forEach(({ recipe, date }) => grid.appendChild(labelEl(recipe, date)));
      return grid;
    }

    function render() { renderShopPicker(); drawLabels(); }

    function drawLabels() {
      const searchRow = document.getElementById("lbl-search-row"); if (searchRow) searchRow.style.display = state.scope === "week" ? "none" : "";
      labelArea.innerHTML = "";
      if (state.scope === "week") { renderWeek(); return; }
      // ---- single day ----
      renderSelectedChips();
      const recs = [...state.selected].map((id) => Data.get("recipes", id)).filter(Boolean);
      if (!recs.length) {
        const prompt = isShop ? t("chooseProducts") : (Data.menuForDate(state.date) ? t("chooseDishes") : t("noMenu"));
        labelArea.appendChild(h("div", { class: "empty no-print" }, [h("div", { class: "big" }, "🏷️"), h("div", {}, prompt)]));
        return;
      }
      // repeat each label by its chosen copy count
      const pairs = [];
      recs.forEach((r) => { const n = qtyOf(r.id); for (let i = 0; i < n; i++) pairs.push({ recipe: r, date: state.date }); });
      labelArea.appendChild(labelGrid(pairs));
    }

    function renderWeek() {
      const wk = monday(state.date);
      const wdays = Data.all("menu_days").filter((d) => monday(d.date) === wk).sort((a, b) => a.date.localeCompare(b.date));
      if (!wdays.length) { labelArea.appendChild(h("div", { class: "empty no-print" }, [h("div", { class: "big" }, "🏷️"), h("div", {}, t("noMenu"))])); return; }
      wdays.forEach((d, i) => {
        const recs = SLOTS.map((k) => { const s = d.slots[k]; return s && s.recipe_id ? Data.get("recipes", s.recipe_id) : null; }).filter(Boolean);
        if (!recs.length) return;
        labelArea.appendChild(h("div", { class: "lbl-day-head", style: "margin:" + (i ? "16px" : "2px") + " 0 8px;font-weight:700;color:var(--brand-primary-dark);page-break-before:" + (i ? "always" : "auto") }, [
          U.weekdayName(d.date) + " · " + U.fmtDate(d.date, true),
        ]));
        labelArea.appendChild(labelGrid(recs.map((r) => ({ recipe: r, date: d.date }))));
      });
    }

    function nutritionPanel(nut, portion) {
      const box = h("div", { class: "fl-nutri" });
      box.appendChild(h("div", { class: "fl-nutri-head" }, [
        h("span", {}, t("nutritionFacts")),
        h("span", { class: "fl-nutri-sub" }, t("perPortion") + (portion ? " (" + portion + "g)" : "")),
      ]));
      if (!nut) { box.appendChild(h("div", { class: "fl-nutri-sub", style: "padding:1mm 0" }, "—")); return box; }
      const rows = [
        [t("kcal"), Math.round(nut.kcal), ""], [t("protein"), nut.protein, "g"], [t("fat"), nut.fat, "g"],
        [t("carbs"), nut.carbs, "g"], [t("sugar"), nut.sugar, "g"], [t("sodium"), nut.sodium, "g"], [t("calcium"), nut.calcium, "mg"],
      ];
      const tbl = h("table", { class: "fl-nutri-tbl" });
      rows.forEach(([lab, val, unit]) => tbl.appendChild(h("tr", {}, [h("td", {}, lab), h("td", { class: "fl-num" }, (val == null ? "—" : val) + unit)])));
      box.appendChild(tbl);
      return box;
    }

    function qrImg(text, mm) {
      if (!window.qrcode) return null;
      try {
        const qr = window.qrcode(0, "M"); qr.addData(text); qr.make();
        const img = h("img", { class: "fl-qr", alt: "QR", src: qr.createDataURL(4, 0) });
        img.style.width = mm + "mm"; img.style.height = mm + "mm";
        return img;
      } catch (e) { return null; }
    }

    function labelEl(r, dateStr) {
      dateStr = dateStr || state.date;
      const nut = Data.recipeNutrition(r);
      const algs = Data.recipeAllergens(r);
      const portion = (r.items || []).reduce((s, it) => s + (it.grams != null ? it.grams : 0), 0);
      const place = Data.activePlace() || {};
      const useByDays = place.use_by_days != null ? place.use_by_days : 2;
      const useBy = U.isoAddDays(dateStr, useByDays);
      const qrText = [
        r.name_en, r.name_zh || null,
        (algs.length ? t("contains") + ": " + algs.map((a) => Data.allergenName(a)).join(", ") : t("noAllergens")),
        t("preparedOn") + " " + U.fmtDate(dateStr) + " · " + t("useBy") + " " + U.fmtDate(useBy),
        place.name || null,
      ].filter(Boolean).join("\n");
      const qr = state.showQR ? qrImg(qrText, state.hh > state.w ? 16 : 14) : null;

      const card = h("div", { class: "food-label" + (state.hh > state.w ? " fl-portrait" : ""), style: `--lw:${state.w}cm;--lh:${state.hh}cm` });
      card.appendChild(h("div", { class: "fl-head" }, [
        h("div", { class: "fl-title" }, [h("div", { class: "fl-name" }, r.name_en), r.name_zh ? h("div", { class: "fl-name-zh zh" }, r.name_zh) : null]),
        h("div", { class: "fl-headright" }, [place.name ? h("div", { class: "fl-brand" }, place.name) : null, qr]),
      ]));
      card.appendChild(h("div", { class: "fl-rule" }));
      const ingrNames = (r.items || []).slice().sort((a, b) => (b.grams || 0) - (a.grams || 0)).map((it) => it.name_en).filter(Boolean);
      // body: allergens (bold) on the left, nutrition panel on the right
      const left = h("div", { class: "fl-left" }, [
        state.showAlg ? (algs.length
          ? h("div", { class: "fl-allergens" }, [h("b", {}, t("contains").toUpperCase() + ": " + algs.map((a) => Data.allergenName(a)).join(", "))])
          : h("div", { class: "fl-allergens fl-allergens--none" }, t("noAllergens"))) : null,
      ]);
      const body = [left];
      if (state.showNut) body.push(nutritionPanel(nut, portion));
      card.appendChild(h("div", { class: "fl-body" }, body));
      // ingredients: full-width line below the allergens (always has room to wrap)
      if (state.showIngr && ingrNames.length) card.appendChild(h("div", { class: "fl-ingr" }, [h("b", {}, t("ingredients") + ": "), ingrNames.join(", ")]));
      card.appendChild(h("div", { class: "fl-dates" }, [
        h("span", {}, [h("b", {}, t("preparedOn") + ": "), U.fmtDate(dateStr)]),
        h("span", {}, [h("b", {}, t("useBy") + ": "), U.fmtDate(useBy)]),
      ]));
      card.appendChild(h("div", { class: "fl-fresh" }, "❄ " + t("freshNote").replace("{d}", useByDays)));
      card.appendChild(h("div", { class: "fl-foot" }, [h("span", {}, place.name || ""), h("span", {}, t("keepRefrigerated"))]));
      return card;
    }

    if (isShop) { state.selected = new Set(); render(); } else { loadDay(); }
  },
};
