/* Recipes — list, detail (ingredients + grams + computed nutrition + allergens), edit */
PAGES.recipes = {
  icon: "🍽️", title: () => I18N.t("recipes"),
  render(view, params) {
    const t = I18N.t.bind(I18N), h = U.h;
    if (params[0]) return recipeDetail(view, params[0]);

    let q = "", cat = "";
    const cats = [...new Set(Data.all("recipes").map((r) => r.category).filter(Boolean))].sort();

    const search = h("input", { class: "input search", placeholder: t("search"), oninput: U.debounce((e) => { q = e.target.value.toLowerCase(); draw(); }) });
    const catSel = h("select", { class: "input", onChange: (e) => { cat = e.target.value; draw(); } },
      [h("option", { value: "" }, t("category") + ": " + t("all")), ...cats.map((c) => h("option", { value: c }, c))]);
    view.appendChild(h("div", { class: "toolbar" }, [
      search, catSel, h("span", { class: "muted small", id: "rc-count" }),
      h("div", { style: "flex:1" }),
      h("button", { class: "btn", title: "Replace recipes & ingredients with the MBL dataset (real grams)", onClick: importMblData }, "⤓ Load MBL data"),
      h("button", { class: "btn btn--primary", onClick: () => edit(null) }, "＋ " + t("add")),
    ]));
    const host = h("div", {}); view.appendChild(host);

    function draw() {
      let list = Data.all("recipes").slice();
      if (cat) list = list.filter((r) => r.category === cat);
      if (q) list = list.filter((r) => (r.name_en + " " + (r.name_zh || "")).toLowerCase().includes(q));
      list.sort((a, b) => a.name_en.localeCompare(b.name_en));
      document.getElementById("rc-count").textContent = list.length + " " + t("recipeCount");
      host.innerHTML = "";
      if (!list.length) { host.appendChild(h("div", { class: "empty" }, t("nothingHere"))); return; }
      const tbl = h("table", { class: "data" });
      tbl.appendChild(h("thead", {}, h("tr", {}, [h("th", {}, t("name")), h("th", {}, t("category")), h("th", { class: "num" }, t("ingredientsInRecipe")), h("th", {}, t("allergensLabel")), h("th", {}, "")])));
      const tb = h("tbody", {});
      list.forEach((r) => {
        const algs = Data.recipeAllergens(r);
        tb.appendChild(h("tr", { class: "clickable", onClick: () => Router.go("#/recipes/" + r.id) }, [
          h("td", {}, [h("b", {}, r.name_en), r.name_zh ? h("div", { class: "bilingual-zh zh" }, r.name_zh) : null]),
          h("td", {}, r.category ? h("span", { class: "badge badge--cat" }, r.category) : ""),
          h("td", { class: "num" }, (r.items || []).length),
          h("td", {}, h("div", { class: "pill-list" }, algs.slice(0, 4).map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a))))),
          h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); edit(r); } }, "✏️")),
        ]));
      });
      tbl.appendChild(tb);
      host.appendChild(h("div", { class: "table-wrap" }, tbl));
    }
    draw();

    function edit(r) { recipeForm(r); }
  },
};

function recipeDetail(view, id) {
  const t = I18N.t.bind(I18N), h = U.h;
  const r = Data.get("recipes", id);
  if (!r) { view.appendChild(h("div", { class: "empty" }, "Not found")); return; }
  Router.setActions([
    h("button", { class: "btn", onClick: () => Router.go("#/recipes") }, "← " + t("recipes")),
    h("button", { class: "btn", onClick: () => recipeForm(r) }, "✏️ " + t("edit")),
  ]);
  view.appendChild(h("div", { class: "section-head" }, [
    h("div", {}, [h("h2", {}, r.name_en), r.name_zh ? h("div", { class: "muted zh" }, r.name_zh) : null]),
    h("div", { class: "spacer" }),
    r.category ? h("span", { class: "badge badge--cat" }, r.category) : null,
  ]));

  // nutrition
  const nut = Data.recipeNutrition(r);
  const nutBox = h("div", { class: "card", style: "margin-bottom:16px" }, [
    h("div", { class: "small muted", style: "margin-bottom:8px" }, t("perPortion") + " — " + t("computedFromIngredients")),
    h("div", { class: "macros" }, nut ? [
      macro(t("kcal"), nut.kcal), macro(t("protein"), nut.protein + " g"), macro(t("fat"), nut.fat + " g"),
      macro(t("carbs"), nut.carbs + " g"), macro(t("sugar"), nut.sugar + " g"), macro(t("addedSugar"), nut.added_sugar + " g"),
      macro(t("sodium"), nut.sodium + " g"), macro(t("calcium"), nut.calcium + " mg"),
    ] : [h("span", { class: "muted small" }, "— no ingredient macro data yet (add macros on the Ingredients page)")]),
  ]);
  view.appendChild(nutBox);

  // shop / restaurant: yield · times · cost → suggested price → margin · method
  const cost = Data.recipeCost(r);
  const place = Data.activePlace() || {};
  const fcp = (place.food_cost_pct || 30) / 100;
  const suggested = cost != null && fcp > 0 ? Math.round(cost / fcp * 100) / 100 : null;
  const price = r.sale_price;
  const marginPct = (price != null && cost != null && price > 0) ? Math.round((price - cost) / price * 100) : null;
  const CUR = window.MBL_CONFIG.CURRENCY || "NT$";
  const metaBits = [];
  if (r.yield_portions) metaBits.push(t("yieldPortions") + ": " + r.yield_portions);
  if (r.prep_min != null) metaBits.push(t("prepMin") + ": " + r.prep_min + "′");
  if (r.cook_min != null) metaBits.push(t("cookMin") + ": " + r.cook_min + "′");
  view.appendChild(h("div", { class: "card", style: "margin-bottom:16px" }, [
    metaBits.length ? h("div", { class: "small muted", style: "margin-bottom:8px" }, metaBits.join("  ·  ")) : null,
    h("div", { class: "macros" }, [
      macro(t("costPortion"), cost != null ? CUR + cost : "—"),
      macro(t("suggestedPrice"), suggested != null ? CUR + suggested : "—"),
      macro(t("salePrice"), price != null ? CUR + price : "—"),
      macro(t("margin"), marginPct != null ? marginPct + "%" : "—"),
    ]),
    r.method ? h("div", { style: "margin-top:12px" }, [h("div", { class: "small muted", style: "margin-bottom:4px;font-weight:600" }, t("method")), h("div", { style: "white-space:pre-wrap;font-size:14px;line-height:1.5" }, r.method)]) : null,
  ]));

  // allergens
  const algs = Data.recipeAllergens(r);
  view.appendChild(h("div", { style: "margin-bottom:16px" }, [
    h("span", { class: "small muted" }, t("allergensLabel") + ": "),
    algs.length ? h("span", { class: "pill-list", style: "display:inline-flex" }, algs.map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a)))) : h("span", { class: "muted" }, t("noAllergens")),
  ]));

  // ingredient list
  const tbl = h("table", { class: "data" });
  tbl.appendChild(h("thead", {}, h("tr", {}, [h("th", {}, t("ingredientsInRecipe")), h("th", { class: "num" }, t("grams")), h("th", {}, t("allergensLabel"))])));
  const tb = h("tbody", {});
  (r.items || []).forEach((it) => {
    const ing = it.ingredient_id && Data.get("ingredients", it.ingredient_id);
    const ialgs = ing ? (ing.allergen_ids || []) : [];
    tb.appendChild(h("tr", ing ? { class: "clickable", onClick: () => Router.go("#/ingredients/" + ing.id) } : {}, [
      h("td", {}, [h("span", {}, it.name_en), it.name_zh ? h("span", { class: "bilingual-zh zh" }, " · " + it.name_zh) : null, ing ? null : h("span", { class: "small muted" }, " (unlinked)")]),
      h("td", { class: "num" }, it.grams != null ? it.grams : "—"),
      h("td", {}, h("div", { class: "pill-list" }, ialgs.map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a))))),
    ]));
  });
  tbl.appendChild(tb);
  view.appendChild(h("div", { class: "table-wrap" }, tbl));

  function macro(label, val) { return h("div", { class: "macro" }, [h("b", {}, val), h("span", {}, label)]); }
}

/* shared recipe editor (used by list + detail) */
function recipeForm(r) {
  const t = I18N.t.bind(I18N), h = U.h;
  const isNew = !r;
  r = r || { name_en: "", name_zh: "", category: "", items: [] };
  const nameEn = h("input", { class: "input", value: r.name_en });
  const nameZh = h("input", { class: "input zh", value: r.name_zh || "" });
  const cats = [...new Set(Data.all("recipes").map((x) => x.category).filter(Boolean))].sort();
  const catInput = h("input", { class: "input", list: "rf-cats", value: r.category || "" });
  const catList = h("datalist", { id: "rf-cats" }, cats.map((c) => h("option", { value: c })));
  const ingList = h("datalist", { id: "rf-ings" }, Data.all("ingredients").map((i) => h("option", { value: i.name_en }, i.name_zh || "")));

  // Builder tags (auto-derived if not yet set; editable so the menu builder can use them)
  const tg = MenuGen.tags(r);
  const courseSel = h("select", { class: "input" }, MenuGen.COURSES.map((c) => h("option", { value: c, selected: c === tg.course }, c)));
  const proteinSel = h("select", { class: "input" }, ["chicken", "beef", "pork", "fish", "duck", "vegetarian", "vegan", "other"].map((p) => h("option", { value: p, selected: p === tg.protein }, p)));
  const cuisineSel = h("select", { class: "input" }, ["western", "asian"].map((c) => h("option", { value: c, selected: c === tg.cuisine }, t(c))));
  const carbChk = h("input", { type: "checkbox", checked: tg.contains_carb });

  // shop / restaurant fields
  const yieldI = h("input", { class: "input num", type: "number", min: "1", step: "1", value: r.yield_portions == null ? "" : r.yield_portions, placeholder: "1" });
  const prepI = h("input", { class: "input num", type: "number", min: "0", step: "1", value: r.prep_min == null ? "" : r.prep_min });
  const cookI = h("input", { class: "input num", type: "number", min: "0", step: "1", value: r.cook_min == null ? "" : r.cook_min });
  const priceI = h("input", { class: "input num", type: "number", min: "0", step: "any", value: r.sale_price == null ? "" : r.sale_price });
  const methodI = h("textarea", { class: "input", rows: 5, placeholder: t("methodHint") }, r.method || "");

  const rows = h("div", {});
  function addRow(it) {
    it = it || { name_en: "", grams: "" };
    const nm = h("input", { class: "input", list: "rf-ings", value: it.name_en, placeholder: t("name") });
    const gr = h("input", { class: "input num", type: "number", step: "1", min: "0", value: it.grams == null ? "" : it.grams, placeholder: "g", style: "max-width:90px" });
    const row = h("div", { class: "row", style: "align-items:flex-end;margin-bottom:8px" }, [
      h("div", { class: "field", style: "flex:3;margin:0" }, nm),
      h("div", { class: "field", style: "flex:0 0 100px;margin:0" }, gr),
      h("button", { class: "btn btn--sm btn--danger", onClick: () => rows.removeChild(row) }, "✕"),
    ]);
    row._collect = () => {
      const v = nm.value.trim(); if (!v) return null;
      const ing = Data.all("ingredients").find((x) => x.name_en.toLowerCase() === v.toLowerCase());
      return { name_en: v, name_zh: ing ? ing.name_zh : (it.name_zh || ""), ingredient_id: ing ? ing.id : null, grams: gr.value === "" ? null : Number(gr.value) };
    };
    rows.appendChild(row);
  }
  (r.items || []).forEach(addRow); if (!(r.items || []).length) addRow();

  const form = h("div", {}, [
    catList, ingList,
    h("div", { class: "row" }, [
      h("div", { class: "field" }, [h("label", {}, t("name_en")), nameEn]),
      h("div", { class: "field" }, [h("label", {}, t("name_zh")), nameZh]),
      h("div", { class: "field", style: "flex:0 0 180px" }, [h("label", {}, t("category")), catInput]),
    ]),
    h("div", { class: "row" }, [
      h("div", { class: "field" }, [h("label", {}, t("course")), courseSel]),
      h("div", { class: "field" }, [h("label", {}, t("proteinLabel")), proteinSel]),
      h("div", { class: "field" }, [h("label", {}, t("cuisineTag")), cuisineSel]),
      h("div", { class: "field", style: "justify-content:flex-end" }, [h("label", { style: "display:flex;gap:7px;align-items:center;cursor:pointer" }, [carbChk, t("containsCarb")])]),
    ]),
    h("label", { class: "small", style: "font-weight:600;color:var(--text-soft)" }, t("ingredientsInRecipe")),
    rows,
    h("button", { class: "btn btn--sm", onClick: () => addRow() }, "＋ " + t("addIngredientRow")),
    h("div", { class: "small", style: "font-weight:600;color:var(--text-soft);margin-top:12px" }, t("shopFields")),
    h("div", { class: "row" }, [
      h("div", { class: "field", style: "flex:0 0 120px" }, [h("label", {}, t("yieldPortions")), yieldI]),
      h("div", { class: "field", style: "flex:0 0 120px" }, [h("label", {}, t("prepMin")), prepI]),
      h("div", { class: "field", style: "flex:0 0 120px" }, [h("label", {}, t("cookMin")), cookI]),
      h("div", { class: "field", style: "flex:0 0 150px" }, [h("label", {}, (window.MBL_CONFIG.CURRENCY || "NT$") + " " + t("salePrice")), priceI]),
    ]),
    h("div", { class: "field" }, [h("label", {}, t("method")), methodI]),
  ]);

  U.modal(isNew ? t("add") + " · " + t("recipes") : t("edit"), form, {
    wide: true,
    async onSave() {
      const items = [...rows.children].map((x) => x._collect && x._collect()).filter(Boolean);
      const numOrNull = (el) => el.value === "" ? null : Number(el.value);
      const payload = { name_en: nameEn.value.trim(), name_zh: nameZh.value.trim(), category: catInput.value.trim(), items,
        course: courseSel.value, protein: proteinSel.value, cuisine: cuisineSel.value, contains_carb: carbChk.checked,
        yield_portions: numOrNull(yieldI), prep_min: numOrNull(prepI), cook_min: numOrNull(cookI), sale_price: numOrNull(priceI), method: methodI.value.trim() };
      if (!payload.name_en) { U.toast(t("name_en") + "?", true); return false; }
      // recompute allergen union
      const set = new Set();
      items.forEach((it) => { const ing = it.ingredient_id && Data.get("ingredients", it.ingredient_id); if (ing) (ing.allergen_ids || []).forEach((a) => set.add(a)); });
      payload.allergen_ids = [...set];
      if (isNew) await Data.create("recipes", payload);
      else await Data.update("recipes", r.id, payload);
      U.toast(t("saved")); Router.rerender();
    },
  });
}
