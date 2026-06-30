/* Print Labels — per-dish labels, size in cm, EN + 中文 + nutrition/allergens */
PAGES.labels = {
  icon: "🏷️", title: () => I18N.t("labels"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    const state = { w: 9, hh: 6, showNut: true, showAlg: true, selected: new Set(), q: "" };

    // preselect: dishes from the next upcoming menu day
    const days = Data.all("menu_days").slice().sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = days.find((d) => d.date >= U.TODAY) || days[0];
    if (upcoming) ["meat", "veg1", "veg2", "carb", "dairy", "fruit", "side"].forEach((k) => { const s = upcoming.slots[k]; if (s && s.recipe_id) state.selected.add(s.recipe_id); });

    const num = (val, on) => h("input", { class: "input num", type: "number", min: "1", step: "0.5", value: val, style: "max-width:90px", oninput: (e) => { on(Number(e.target.value)); render(); } });
    const widthI = num(state.w, (v) => (state.w = v));
    const heightI = num(state.hh, (v) => (state.hh = v));

    const search = h("input", { class: "input search", placeholder: t("search") + " " + t("recipes"), oninput: U.debounce((e) => { state.q = e.target.value.toLowerCase(); renderPicker(); }) });
    const nutChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [h("input", { type: "checkbox", checked: state.showNut, onChange: (e) => { state.showNut = e.target.checked; render(); } }), t("showNutrition")]);
    const algChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [h("input", { type: "checkbox", checked: state.showAlg, onChange: (e) => { state.showAlg = e.target.checked; render(); } }), t("showAllergens")]);

    view.appendChild(h("div", { class: "toolbar no-print" }, [
      h("span", { class: "small muted" }, t("widthCm")), widthI,
      h("span", { class: "small muted" }, t("heightCm")), heightI,
      nutChk, algChk,
      h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => window.print() }, "🖨 " + t("print")),
    ]));

    // dish picker
    const pickerBox = h("div", { class: "card no-print", style: "margin-bottom:16px" }, [
      h("div", { class: "section-head" }, [h("h2", { style: "font-size:15px" }, t("chooseDishes")), h("div", { class: "spacer" }), search]),
      h("div", { id: "lbl-picker", style: "max-height:200px;overflow:auto" }),
    ]);
    view.appendChild(pickerBox);
    const labelArea = h("div", { class: "print-area" }); view.appendChild(labelArea);

    function renderPicker() {
      const host = document.getElementById("lbl-picker"); host.innerHTML = "";
      let list = Data.all("recipes").slice().sort((a, b) => a.name_en.localeCompare(b.name_en));
      if (state.q) list = list.filter((r) => (r.name_en + " " + (r.name_zh || "")).toLowerCase().includes(state.q));
      const grid = h("div", { class: "pill-list" });
      list.slice(0, 200).forEach((r) => {
        const on = state.selected.has(r.id);
        const pill = h("button", { type: "button", class: "badge" + (on ? " badge--cat" : ""), style: "cursor:pointer", onClick: () => { if (state.selected.has(r.id)) state.selected.delete(r.id); else state.selected.add(r.id); renderPicker(); render(); } }, r.name_en);
        grid.appendChild(pill);
      });
      host.appendChild(grid);
    }

    function render() {
      labelArea.innerHTML = "";
      const recs = [...state.selected].map((id) => Data.get("recipes", id)).filter(Boolean);
      if (!recs.length) { labelArea.appendChild(h("div", { class: "empty" }, t("chooseDishes"))); return; }
      const grid = h("div", { style: "display:flex;flex-wrap:wrap;gap:6mm" });
      recs.forEach((r) => grid.appendChild(labelEl(r)));
      labelArea.appendChild(grid);
    }

    function labelEl(r) {
      const nut = state.showNut ? Data.recipeNutrition(r) : null;
      const algs = state.showAlg ? Data.recipeAllergens(r) : [];
      const card = h("div", { style:
        `width:${state.w}cm;height:${state.hh}cm;box-sizing:border-box;border:1px solid #222;border-radius:3mm;` +
        `padding:3mm;display:flex;flex-direction:column;overflow:hidden;background:#fff;page-break-inside:avoid;` });
      card.appendChild(h("div", { style: "font-weight:700;font-size:min(4mm,15px);line-height:1.15" }, r.name_en));
      if (r.name_zh) card.appendChild(h("div", { class: "zh", style: "font-size:min(3.6mm,13px);color:#333;margin-top:.5mm" }, r.name_zh));
      const body = h("div", { style: "margin-top:auto;font-size:min(3mm,11px)" });
      if (nut) {
        body.appendChild(h("div", { style: "display:flex;flex-wrap:wrap;gap:1.5mm 3mm;margin-top:1.5mm" }, [
          ["kcal", nut.kcal], ["P", nut.protein + "g"], ["C", nut.carbs + "g"], ["F", nut.fat + "g"], ["salt", nut.salt + "g"],
        ].map(([k, v]) => h("span", {}, [h("b", {}, v), " ", h("span", { style: "color:#555" }, k)]))));
      } else if (state.showNut) {
        body.appendChild(h("div", { style: "color:#999" }, "— nutrition n/a"));
      }
      if (algs.length) body.appendChild(h("div", { style: "margin-top:1.5mm;color:#b5341f;font-weight:600" }, "⚠ " + algs.map((a) => Data.allergenName(a)).join(", ")));
      card.appendChild(body);
      return card;
    }

    renderPicker(); render();
  },
};
