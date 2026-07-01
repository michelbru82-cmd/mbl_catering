/* Allergen matrix — printable grid of every product × the 15 allergens.
   Common restaurant / EU compliance sheet. Filterable by category. */
PAGES.allergenMatrix = {
  icon: "⚠️", title: () => I18N.t("allergenMatrix"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    const place = Data.activePlace() || {};
    const cfg = window.MBL_CONFIG;
    const allergens = Data.all("allergens").slice().sort((a, b) => (a.code || 0) - (b.code || 0));
    const recipes = Data.all("recipes").slice();
    if (!recipes.length) { view.appendChild(h("div", { class: "empty" }, t("nothingHere"))); return; }
    const cats = [...new Set(recipes.map((r) => r.category).filter(Boolean))].sort();

    let cat = "";
    const catSel = h("select", { class: "input", onChange: (e) => { cat = e.target.value; draw(); } },
      [h("option", { value: "" }, t("category") + ": " + t("all")), ...cats.map((c) => h("option", { value: c }, c))]);
    view.appendChild(h("div", { class: "toolbar no-print" }, [
      catSel, h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => window.print() }, "🖨 " + t("print")),
    ]));
    const area = h("div", { class: "print-area" }); view.appendChild(area);

    function draw() {
      area.innerHTML = "";
      let list = recipes.slice();
      if (cat) list = list.filter((r) => r.category === cat);
      list.sort((a, b) => a.name_en.localeCompare(b.name_en));

      const sheet = h("div", { style: "background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:22px" });
      sheet.appendChild(h("div", { style: "text-align:center;margin-bottom:12px" }, [
        h("div", { style: "font-size:20px;font-weight:800;color:var(--brand-primary-dark)" }, (place.name || cfg.ORG_NAME) + (place.name_zh ? " · " + place.name_zh : "")),
        h("div", { class: "muted" }, t("allergenMatrix") + (cat ? " — " + cat : "")),
      ]));

      const tbl = h("table", { class: "data", style: "font-size:12px" });
      const head = [h("th", { style: "text-align:left" }, t("name"))];
      allergens.forEach((a) => head.push(h("th", { class: "num", title: I18N.pick(a, "name") }, String(a.code == null ? I18N.pick(a, "name") : a.code))));
      tbl.appendChild(h("thead", {}, h("tr", {}, head)));
      const tb = h("tbody", {});
      list.forEach((r) => {
        const set = new Set(Data.recipeAllergens(r));
        const cells = [h("td", {}, [h("b", {}, r.name_en), r.name_zh ? h("span", { class: "zh muted", style: "margin-left:6px" }, r.name_zh) : null])];
        allergens.forEach((a) => cells.push(h("td", { class: "num", style: set.has(a.id) ? "color:var(--allergen);font-weight:800" : "color:#ccc" }, set.has(a.id) ? "●" : "·")));
        tb.appendChild(h("tr", {}, cells));
      });
      tbl.appendChild(tb);
      sheet.appendChild(h("div", { class: "table-wrap" }, tbl));
      // legend: code → allergen name
      sheet.appendChild(h("div", { class: "small muted", style: "margin-top:10px;line-height:1.6" }, allergens.map((a) => (a.code == null ? "" : a.code + " = ") + I18N.pick(a, "name")).join("   ·   ")));
      area.appendChild(sheet);
    }
    draw();
  },
};
