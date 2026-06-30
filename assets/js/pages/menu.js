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
      h("button", { class: "btn btn--primary", onClick: () => addDay(month) }, "＋ " + t("date")),
    ]));

    const monthDays = days.filter((d) => d.date.startsWith(month));
    if (!monthDays.length) { view.appendChild(h("div", { class: "empty" }, [h("div", { class: "big" }, "🍽️"), h("div", {}, t("noMenu"))])); return; }

    const tbl = h("table", { class: "data" });
    tbl.appendChild(h("thead", {}, h("tr", {}, [
      h("th", {}, t("date")),
      ...SLOTS.map(([, label]) => h("th", {}, label)),
      h("th", {}, t("allergensLabel")),
      h("th", {}, ""),
    ])));
    const tb = h("tbody", {});
    monthDays.forEach((d) => {
      const algs = Data.dayAllergens(d);
      tb.appendChild(h("tr", { class: "clickable", onClick: () => editDay(d.id) }, [
        h("td", {}, [h("b", {}, U.fmtDate(d.date)), h("br"), h("span", { class: "small muted" }, U.weekdayName(d.date))]),
        ...SLOTS.map(([k]) => {
          const s = d.slots[k];
          return h("td", {}, s ? (s.recipe_id ? h("span", {}, [s.name_en, " ", h("span", { class: "small", title: "linked recipe" }, "🔗")]) : s.name_en) : h("span", { class: "muted" }, "—"));
        }),
        h("td", {}, algs.length ? h("span", { class: "small" }, algs.slice(0, 3).map((a) => Data.allergenName(a)).join(", ") + (algs.length > 3 ? "…" : "")) : h("span", { class: "muted" }, "—")),
        h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); editDay(d.id); } }, "✏️")),
      ]));
    });
    tbl.appendChild(tb);
    view.appendChild(h("div", { class: "table-wrap" }, tbl));

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
