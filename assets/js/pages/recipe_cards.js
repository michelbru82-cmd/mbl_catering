/* Recipe cards — print-ready kitchen sheet for a recipe: ingredients (scalable by
   batch), method, yield/time, allergens, nutrition, cost → suggested price → margin.
   Mainly for Shop / Restaurant places. */
PAGES.recipeCards = {
  icon: "🧾", title: () => I18N.t("recipeCards"),
  render(view, params) {
    const t = I18N.t.bind(I18N), h = U.h;
    const CUR = window.MBL_CONFIG.CURRENCY || "NT$";
    const recipes = Data.all("recipes").slice().sort((a, b) => a.name_en.localeCompare(b.name_en));
    if (!recipes.length) { view.appendChild(h("div", { class: "empty" }, t("nothingHere"))); return; }

    const state = { id: params[0] || recipes[0].id, batch: null };
    const cur = () => Data.get("recipes", state.id) || recipes[0];

    const dl = h("datalist", { id: "rc-recipes" }, recipes.map((r) => h("option", { value: r.name_en })));
    const pick = h("input", { class: "input search", list: "rc-recipes", placeholder: t("search") + " " + t("recipes"),
      onChange: (e) => { const r = recipes.find((x) => x.name_en.toLowerCase() === e.target.value.trim().toLowerCase()); if (r) { state.id = r.id; state.batch = null; e.target.value = ""; draw(); } } });
    const batchI = h("input", { class: "input num", type: "number", min: "1", step: "1", style: "max-width:90px",
      oninput: (e) => { state.batch = e.target.value === "" ? null : Number(e.target.value); draw(); } });

    view.appendChild(dl);
    view.appendChild(h("div", { class: "toolbar no-print" }, [
      h("span", { class: "small muted" }, t("recipes") + ":"), pick,
      h("span", { class: "small muted" }, t("batchQty")), batchI,
      h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => window.print() }, "🖨 " + t("print")),
    ]));
    const area = h("div", { class: "print-area" }); view.appendChild(area);

    function draw() {
      const r = cur();
      const base = r.yield_portions || 1;
      const batch = state.batch || base;
      batchI.value = batch;
      const scale = batch / base;
      area.innerHTML = "";
      area.appendChild(card(r, base, batch, scale));
    }

    function card(r, base, batch, scale) {
      const place = Data.activePlace() || {};
      const cost = Data.recipeCost(r);
      const fcp = (place.food_cost_pct || 30) / 100;
      const suggested = cost != null && fcp > 0 ? Math.round(cost / fcp * 100) / 100 : null;
      const price = r.sale_price;
      const marginPct = (price != null && cost != null && price > 0) ? Math.round((price - cost) / price * 100) : null;
      const algs = Data.recipeAllergens(r);
      const nut = Data.recipeNutrition(r);

      const meta = [];
      meta.push(t("yieldPortions") + ": " + batch + (scale !== 1 ? " (×" + (Math.round(scale * 100) / 100) + ")" : ""));
      if (r.prep_min != null) meta.push(t("prepMin") + ": " + r.prep_min + "′");
      if (r.cook_min != null) meta.push(t("cookMin") + ": " + r.cook_min + "′");

      const sheet = h("div", { class: "card", style: "padding:24px;max-width:820px" });
      sheet.appendChild(h("div", { class: "section-head", style: "margin:0 0 6px" }, [
        h("div", {}, [h("h2", { style: "margin:0" }, r.name_en), r.name_zh ? h("div", { class: "muted zh" }, r.name_zh) : null]),
        h("div", { class: "spacer" }),
        place.name ? h("span", { class: "badge badge--cat" }, place.name) : null,
        r.category ? h("span", { class: "badge" }, r.category) : null,
      ]));
      sheet.appendChild(h("div", { class: "muted small", style: "margin-bottom:12px" }, meta.join("  ·  ")));

      // ingredients (scaled)
      const tbl = h("table", { class: "data" });
      tbl.appendChild(h("thead", {}, h("tr", {}, [h("th", {}, t("ingredientsInRecipe")), h("th", { class: "num" }, t("qtyForBatch"))])));
      const tb = h("tbody", {});
      (r.items || []).forEach((it) => {
        const g = it.grams == null ? null : Math.round(it.grams * scale * 10) / 10;
        tb.appendChild(h("tr", {}, [
          h("td", {}, [h("span", {}, it.name_en), it.name_zh ? h("span", { class: "bilingual-zh zh" }, " · " + it.name_zh) : null]),
          h("td", { class: "num" }, g == null ? "—" : (g >= 1000 ? (Math.round(g / 100) / 10) + " kg" : g + " g")),
        ]));
      });
      tbl.appendChild(tb);
      sheet.appendChild(h("div", { class: "table-wrap" }, tbl));

      // method
      if (r.method) sheet.appendChild(h("div", { style: "margin-top:14px" }, [
        h("h3", { style: "font-size:14px;margin-bottom:6px" }, t("method")),
        h("div", { style: "white-space:pre-wrap;line-height:1.55" }, r.method),
      ]));

      // allergens + nutrition
      sheet.appendChild(h("div", { style: "margin-top:14px" }, [
        h("span", { class: "small muted" }, t("allergensLabel") + ": "),
        algs.length ? h("b", { style: "color:var(--allergen)" }, algs.map((a) => Data.allergenName(a)).join(", ")) : h("span", { class: "muted" }, t("noAllergens")),
      ]));
      if (nut) sheet.appendChild(h("div", { class: "macros", style: "margin-top:10px" }, [
        m(t("kcal"), nut.kcal), m(t("protein"), nut.protein + " g"), m(t("fat"), nut.fat + " g"), m(t("carbs"), nut.carbs + " g"), m(t("sugar"), nut.sugar + " g"),
      ]));

      // cost / price / margin
      sheet.appendChild(h("div", { class: "macros", style: "margin-top:12px" }, [
        m(t("costPortion"), cost != null ? CUR + cost : "—"),
        m(t("suggestedPrice"), suggested != null ? CUR + suggested : "—"),
        m(t("salePrice"), price != null ? CUR + price : "—"),
        m(t("margin"), marginPct != null ? marginPct + "%" : "—"),
      ]));
      return sheet;
    }
    function m(label, val) { return h("div", { class: "macro" }, [h("b", {}, val), h("span", {}, label)]); }

    draw();
  },
};
