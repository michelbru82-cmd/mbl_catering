/* Monthly Menu — 7 slots/day (meat, veg1, veg2, carb, dairy, fruit/cake, side) */
PAGES.menu = {
  icon: "📅", title: () => I18N.t("menu"),
  render(view, params) {
    const t = I18N.t.bind(I18N), h = U.h;
    const SLOTS = [["meat", t("meat")], ["veg1", t("veg1")], ["veg2", t("veg2")], ["carb", t("carb")], ["dairy", t("dairy")], ["fruit", t("fruit")], ["side", "Side dish"]];

    const days = Data.all("menu_days").slice().sort((a, b) => a.date.localeCompare(b.date));
    const months = [...new Set(days.map((d) => d.date.slice(0, 7)))].sort();
    let month = params[0] || (months.includes(U.TODAY.slice(0, 7)) ? U.TODAY.slice(0, 7) : (months[0] || U.TODAY.slice(0, 7)));

    // toolbar
    const monthSel = h("select", { class: "input", onChange: (e) => Router.go("#/menu/" + e.target.value) },
      months.map((m) => h("option", { value: m, selected: m === month }, m)));
    if (!months.includes(month)) monthSel.appendChild(h("option", { value: month, selected: true }, month));
    view.appendChild(h("div", { class: "toolbar" }, [
      h("label", { class: "small muted" }, t("month") + ":"), monthSel,
      h("div", { style: "flex:1" }),
      h("a", { class: "btn", href: "#/printMenu" }, "🖨 " + t("printMenu")),
      h("button", { class: "btn btn--accent", onClick: () => MenuBuilder.open(month) }, "⚙️ " + t("config")),
      h("button", { class: "btn btn--primary", onClick: () => addDay(month) }, "＋ " + t("date")),
    ]));

    const monthDays = days.filter((d) => d.date.startsWith(month));
    if (!monthDays.length) { view.appendChild(h("div", { class: "empty" }, [h("div", { class: "big" }, "🍽️"), h("div", {}, t("noMenu"))])); return; }

    // recipe lookup by name (fallback when a slot has no recipe_id link)
    const _normName = (s) => (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
    const _recipeByName = {};
    Data.all("recipes").forEach((r) => { if (r.name_en) _recipeByName[_normName(r.name_en)] = r; });
    function slotRecipe(s) {
      if (!s) return null;
      return (s.recipe_id && Data.get("recipes", s.recipe_id)) || (s.name_en && _recipeByName[_normName(s.name_en)]) || null;
    }
    // total calories for a day's menu (sum of each slot's per-portion recipe kcal)
    // returns { kcal, filled, total } so we can flag partial data
    function dayKcal(d) {
      let total = 0, filled = 0, slotsWithDish = 0;
      SLOTS.forEach(([k]) => {
        const s = d.slots && d.slots[k];
        if (!s || !s.name_en) return;
        slotsWithDish++;
        const r = slotRecipe(s);
        const n = r && Data.recipeNutrition(r);
        if (n && n.kcal != null) { total += n.kcal; filled++; }
      });
      if (!filled) return null;
      return { kcal: Math.round(total), filled, slots: slotsWithDish };
    }

    // Day-card grid: every one of the 7 slots is always visible (no horizontal scroll)
    const grid = h("div", { style: "display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(290px,1fr))" });
    monthDays.forEach((d) => {
      const algs = Data.dayAllergens(d);
      const kc = dayKcal(d);
      const rows = SLOTS.map(([k, label]) => {
        const s = d.slots[k];
        return h("div", { style: "display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:13px" }, [
          h("span", { class: "badge badge--cat", style: "flex:0 0 84px;justify-content:flex-start;text-align:left;align-self:flex-start" }, label),
          h("div", { style: "flex:1;min-width:0" }, s
            ? [h("span", {}, s.name_en), s.recipe_id ? h("span", { class: "small", title: "linked recipe" }, " 🔗") : null]
            : h("span", { class: "muted" }, "—")),
        ]);
      });
      const card = h("div", { class: "card card--link", style: "cursor:pointer", onClick: () => editDay(d.id) }, [
        h("div", { class: "section-head", style: "margin:0 0 8px" }, [
          h("div", {}, [h("b", {}, U.fmtDate(d.date)), h("span", { class: "small muted" }, " · " + U.weekdayName(d.date))]),
          h("div", { class: "spacer" }),
          kc ? h("span", { class: "badge", title: kc.filled < kc.slots ? t("partialKcalHint") : t("totalKcalHint"), style: "font-weight:700" },
            "🔥 " + (kc.filled < kc.slots ? "~" : "") + kc.kcal + " " + t("kcalShort")) : null,
          h("button", { class: "btn btn--sm btn--ghost", onClick: (e) => { e.stopPropagation(); editDay(d.id); } }, "✏️"),
        ]),
        ...rows,
        h("div", { style: "margin-top:9px;min-height:20px" }, algs.length
          ? h("div", { class: "pill-list" }, algs.map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a))))
          : h("span", { class: "small muted" }, t("noAllergens"))),
      ]);
      grid.appendChild(card);
    });
    view.appendChild(grid);

    // recipe datalist (shared)
    function recipeDatalist(id) {
      return h("datalist", { id }, Data.all("recipes").map((r) => h("option", { value: r.name_en })));
    }
    function slotInput(value) {
      return h("input", { class: "input", list: "recipe-names", value: value || "", placeholder: "—" });
    }

    function dayForm(d) {
      const wrap = h("div", {}, recipeDatalist("recipe-names"));
      const inputs = {};
      SLOTS.forEach(([k, label]) => {
        const inp = slotInput(d.slots[k] ? d.slots[k].name_en : "");
        inputs[k] = inp;
        wrap.appendChild(h("div", { class: "field" }, [h("label", {}, label), inp]));
      });
      const notes = h("textarea", { class: "input", rows: 2 }, d.notes || "");
      wrap.appendChild(h("div", { class: "field" }, [h("label", {}, t("notes")), notes]));
      wrap._collect = () => {
        const slots = {};
        SLOTS.forEach(([k]) => {
          const v = inputs[k].value.trim();
          if (!v) { slots[k] = null; return; }
          const r = Data.all("recipes").find((x) => x.name_en.toLowerCase() === v.toLowerCase());
          slots[k] = { name_en: v, recipe_id: r ? r.id : null };
        });
        return { slots, notes: notes.value.trim() };
      };
      return wrap;
    }

    async function editDay(id) {
      const d = Data.get("menu_days", id);
      const form = dayForm(d);
      await U.modal(t("editDay") + " · " + U.fmtDate(d.date, true), form, {
        wide: true,
        async onSave() { await Data.update("menu_days", id, form._collect()); U.toast(t("saved")); Router.rerender(); },
      });
    }
    async function addDay(month) {
      const dateInput = h("input", { class: "input", type: "date", value: month + "-01" });
      const blank = { slots: {}, notes: "" };
      const form = dayForm(blank);
      const top = h("div", {}, [h("div", { class: "field" }, [h("label", {}, t("date")), dateInput]), form]);
      await U.modal(t("setMenu"), top, {
        wide: true,
        async onSave() {
          const date = dateInput.value; if (!date) { U.toast("Pick a date", true); return false; }
          if (Data.menuForDate(date)) { U.toast("Menu already exists for that date", true); return false; }
          const data = form._collect();
          await Data.create("menu_days", { id: "menu_" + date, date, site: "Liu-Gong Campus + Yongchun", slots: data.slots, notes: data.notes });
          U.toast(t("saved")); Router.go("#/menu/" + date.slice(0, 7)); Router.rerender();
        },
      });
    }
  },
};
