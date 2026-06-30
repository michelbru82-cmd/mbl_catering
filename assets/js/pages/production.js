/* Kitchen Production — today + next-day dish-by-dish quantities & allergen info */
PAGES.production = {
  icon: "👨‍🍳", title: () => I18N.t("production"),
  render(view, params) {
    const t = I18N.t.bind(I18N), h = U.h;
    const days = Data.all("menu_days").map((d) => d.date).sort();
    if (!days.length) { view.appendChild(h("div", { class: "empty" }, [h("div", { class: "big" }, "👨‍🍳"), h("div", {}, t("noProduction"))])); return; }
    const firstUpcoming = days.find((d) => d >= U.TODAY) || days[0];
    let date = params[0] || firstUpcoming;

    const dateSel = h("select", { class: "input", onChange: (e) => Router.go("#/production/" + e.target.value) },
      days.map((d) => h("option", { value: d, selected: d === date }, U.fmtDate(d, true))));
    view.appendChild(h("div", { class: "toolbar" }, [
      h("label", { class: "small muted" }, t("date") + ":"), dateSel,
      h("div", { style: "flex:1" }),
      h("button", { class: "btn", onClick: () => window.print() }, "🖨 " + t("print")),
    ]));

    block(view, date, t("todayProduction"), "today");
    const next = U.isoAddDays(date, 1);
    const nextHas = days.includes(next) ? next : (days.find((d) => d > date) || null);
    if (nextHas) block(view, nextHas, t("nextDayProduction"), "next");

    function block(parent, d, label, kind) {
      const menu = Data.menuForDate(d);
      const sites = Data.all("sites");
      const totalCovers = sites.reduce((n, s) => n + (s.covers || 0), 0) || Data.activePeople(d).length;

      parent.appendChild(h("div", { class: "section-head", style: "margin-top:22px" }, [
        h("h2", {}, label + " · " + U.fmtDate(d, true)),
        h("div", { class: "spacer" }),
        h("span", { class: "badge" }, "👥 " + totalCovers + " " + t("covers")),
        ...sites.map((s) => h("span", { class: "badge" }, Data.siteName(s.id) + ": " + (s.covers || 0))),
      ]));

      if (!menu) { parent.appendChild(h("div", { class: "empty" }, t("noMenu"))); return; }

      const SLOTS = [["meat", t("meat")], ["veg1", t("veg1")], ["veg2", t("veg2")], ["carb", t("carb")], ["dairy", t("dairy")], ["fruit", t("fruit")], ["side", "Side"]];
      const tbl = h("table", { class: "data" });
      const head = [h("th", {}, t("dishesToPrepare")), h("th", {}, "")];
      sites.forEach((s) => head.push(h("th", { class: "num" }, Data.siteName(s.id))));
      head.push(h("th", { class: "num" }, t("qtyToPrepare")));
      head.push(h("th", {}, t("allergensLabel")));
      tbl.appendChild(h("thead", {}, h("tr", {}, head)));
      const tb = h("tbody", {});
      SLOTS.forEach(([k, slabel]) => {
        const slot = menu.slots[k]; if (!slot) return;
        const r = slot.recipe_id && Data.get("recipes", slot.recipe_id);
        const portion = r ? portionGrams(r) : null;
        const algs = r ? Data.recipeAllergens(r) : [];
        const cells = [
          h("td", {}, [h("span", { class: "badge badge--cat", style: "margin-right:6px" }, slabel), slot.name_en]),
          h("td", {}, r ? h("a", { class: "small", href: "#/recipes/" + r.id }, "🔗") : ""),
        ];
        sites.forEach((s) => cells.push(h("td", { class: "num" }, portion != null ? kg(portion * (s.covers || 0)) : "—")));
        cells.push(h("td", { class: "num" }, portion != null ? h("b", {}, kg(portion * totalCovers)) : h("span", { class: "muted small" }, portion == null && r ? "set grams" : (totalCovers + "×"))));
        cells.push(h("td", {}, h("div", { class: "pill-list" }, algs.map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a))))));
        tb.appendChild(h("tr", {}, cells));
      });
      tbl.appendChild(tb);
      parent.appendChild(h("div", { class: "table-wrap" }, tbl));

      // allergen alert + affected people
      const dayAlgs = Data.dayAllergens(menu);
      if (dayAlgs.length) {
        parent.appendChild(h("div", { class: "banner banner--allergen", style: "margin-top:12px" }, [
          h("span", {}, "⚠️"), h("div", {}, [h("b", {}, t("allergenAlert") + ": "), dayAlgs.map((a) => Data.allergenName(a)).join(", ")]),
        ]));
        const affected = Data.activePeople(d).filter((p) => (p.allergen_ids || []).some((a) => dayAlgs.includes(a)));
        if (affected.length) {
          parent.appendChild(h("div", { class: "card", style: "margin-top:8px" }, [
            h("div", { class: "small muted", style: "margin-bottom:6px" }, t("affectedPeople") + " (" + affected.length + ")"),
            h("div", { class: "pill-list" }, affected.map((p) => {
              const their = (p.allergen_ids || []).filter((a) => dayAlgs.includes(a)).map((a) => Data.allergenName(a)).join(", ");
              return h("span", { class: "badge" }, [h("b", {}, p.name), " — ", h("span", { class: "zh" }, their)]);
            })),
          ]));
        }
      }
    }

    function portionGrams(r) {
      const items = r.items || []; if (!items.length) return null;
      let sum = 0, any = false;
      items.forEach((it) => { if (it.grams != null) { sum += it.grams; any = true; } });
      return any ? sum : null;
    }
    function kg(g) { return g >= 1000 ? (Math.round(g / 100) / 10) + " kg" : Math.round(g) + " g"; }
  },
};
