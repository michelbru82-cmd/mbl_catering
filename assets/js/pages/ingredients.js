/* Ingredients — master list with macro-nutrients (per 100g) + allergens */
PAGES.ingredients = {
  icon: "🥕", title: () => I18N.t("ingredients"),
  render(view, params) {
    const t = I18N.t.bind(I18N), h = U.h;
    if (params[0]) return ingredientDetail(view, params[0]);

    let q = "", supp = "", onlyAlg = false;
    const supps = [...new Set(Data.all("ingredients").map((i) => i.supplier).filter(Boolean))].sort();

    const search = h("input", { class: "input search", placeholder: t("search"), oninput: U.debounce((e) => { q = e.target.value.toLowerCase(); draw(); }) });
    const suppSel = h("select", { class: "input", onChange: (e) => { supp = e.target.value; draw(); } },
      [h("option", { value: "" }, t("supplier") + ": " + t("all")), ...supps.map((s) => h("option", { value: s }, s))]);
    const algChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [
      h("input", { type: "checkbox", onChange: (e) => { onlyAlg = e.target.checked; draw(); } }), t("allergensLabel"),
    ]);
    view.appendChild(h("div", { class: "toolbar" }, [
      search, suppSel, algChk, h("span", { class: "muted small", id: "ig-count" }),
      h("div", { style: "flex:1" }),
      Data.hiddenCount("ingredients") ? h("button", { class: "btn btn--sm", onClick: () => U.hiddenManager("ingredients") }, "🙈 " + t("hidden") + " (" + Data.hiddenCount("ingredients") + ")") : null,
      h("button", { class: "btn", title: "Replace recipes & ingredients with the MBL dataset (real grams)", onClick: importMblData }, "⤓ Load MBL data"),
      h("button", { class: "btn btn--primary", onClick: () => ingredientForm(null) }, "＋ " + t("add")),
    ]));

    const banner = h("div", { class: "banner", style: "margin-bottom:14px" }, [
      h("span", {}, "ℹ️"),
      h("div", { class: "small" }, "Macro-nutrients (per 100 g) were imported from the 'full ingredients list' sheet — energy, protein, fat, carbs, sugar, added sugar, sodium and calcium — and roll up into recipes, menus, production and labels automatically. Edit any ingredient to adjust."),
    ]);
    view.appendChild(banner);

    const selected = new Set();
    const bulkBar = h("div", { class: "toolbar", style: "display:none;gap:8px;align-items:center;background:var(--card,#0000000a);border-radius:8px;padding:6px 10px" });
    view.appendChild(bulkBar);
    const host = h("div", {}); view.appendChild(host);

    function updateBulk() {
      bulkBar.innerHTML = "";
      if (!selected.size) { bulkBar.style.display = "none"; return; }
      bulkBar.style.display = "";
      const admin = !window.Auth || !Auth.isAdmin || Auth.isAdmin();
      bulkBar.appendChild(h("b", {}, selected.size + " " + t("selectedLbl")));
      bulkBar.appendChild(h("button", { class: "btn btn--sm btn--danger", onClick: () => U.bulkDelete("ingredients", [...selected], () => { selected.clear(); draw(); }) }, (admin ? "🗑 " + t("delete") : "🙈 " + t("hideFromView"))));
      bulkBar.appendChild(h("button", { class: "btn btn--sm", onClick: () => { selected.clear(); draw(); } }, t("clearSelBtn")));
    }

    function draw() {
      let list = Data.all("ingredients").slice();
      if (supp) list = list.filter((i) => i.supplier === supp);
      if (onlyAlg) list = list.filter((i) => (i.allergen_ids || []).length);
      if (q) list = list.filter((i) => (i.name_en + " " + (i.name_zh || "") + " " + (i.supplier || "")).toLowerCase().includes(q));
      list.sort((a, b) => a.name_en.localeCompare(b.name_en));
      document.getElementById("ig-count").textContent = list.length + " " + t("ingredientCount");
      host.innerHTML = "";
      const allChk = h("input", { type: "checkbox", title: t("selectAll"), onChange: (e) => { const on = e.target.checked; list.forEach((i) => (on ? selected.add(i.id) : selected.delete(i.id))); draw(); } });
      allChk.checked = list.length > 0 && list.every((i) => selected.has(i.id));
      const tbl = h("table", { class: "data" });
      tbl.appendChild(h("thead", {}, h("tr", {}, [
        h("th", { style: "width:1%" }, allChk),
        h("th", {}, t("name")), h("th", {}, t("supplier")),
        h("th", { class: "num" }, "kcal"), h("th", { class: "num" }, "P"), h("th", { class: "num" }, "C"), h("th", { class: "num" }, "F"),
        h("th", {}, t("allergensLabel")), h("th", {}, ""),
      ])));
      const tb = h("tbody", {});
      list.forEach((i) => {
        const rowChk = h("input", { type: "checkbox", onClick: (e) => e.stopPropagation(), onChange: (e) => { if (e.target.checked) selected.add(i.id); else selected.delete(i.id); allChk.checked = list.length > 0 && list.every((x) => selected.has(x.id)); updateBulk(); } });
        rowChk.checked = selected.has(i.id);
        tb.appendChild(h("tr", { class: "clickable", onClick: () => Router.go("#/ingredients/" + i.id) }, [
          h("td", { onClick: (e) => e.stopPropagation() }, rowChk),
          h("td", {}, [h("b", {}, i.name_en), i.name_zh ? h("div", { class: "bilingual-zh zh" }, i.name_zh) : null]),
          h("td", { class: "small muted" }, i.supplier || "—"),
          h("td", { class: "num" }, i.kcal == null ? "—" : i.kcal),
          h("td", { class: "num" }, i.protein == null ? "—" : i.protein),
          h("td", { class: "num" }, i.carbs == null ? "—" : i.carbs),
          h("td", { class: "num" }, i.fat == null ? "—" : i.fat),
          h("td", {}, h("div", { class: "pill-list" }, (i.allergen_ids || []).slice(0, 3).map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a))))),
          h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); ingredientForm(i); } }, "✏️")),
        ]));
      });
      tbl.appendChild(tb);
      host.appendChild(h("div", { class: "table-wrap" }, tbl));
      updateBulk();
    }
    draw();
  },
};

function ingredientDetail(view, id) {
  const t = I18N.t.bind(I18N), h = U.h;
  const i = Data.get("ingredients", id);
  if (!i) { view.appendChild(h("div", { class: "empty" }, "Not found")); return; }
  Router.setActions([
    h("button", { class: "btn", onClick: () => Router.go("#/ingredients") }, "← " + t("ingredients")),
    h("button", { class: "btn", onClick: () => ingredientForm(i) }, "✏️ " + t("edit")),
  ]);
  view.appendChild(h("div", { class: "section-head" }, [
    h("div", {}, [h("h2", {}, i.name_en), i.name_zh ? h("div", { class: "muted zh" }, i.name_zh) : null]),
    h("div", { class: "spacer" }),
    i.category ? h("span", { class: "badge badge--cat" }, i.category) : null,
    i.origin ? h("span", { class: "badge" }, "🌍 " + i.origin) : null,
    i.supplier ? h("span", { class: "badge" }, "🚚 " + i.supplier) : null,
  ]));
  const G = " g";
  const M = [["kcal", t("kcal"), ""], ["protein", t("protein"), G], ["fat", t("fat"), G], ["carbs", t("carbs"), G],
    ["sugar", t("sugar"), G], ["added_sugar", t("addedSugar"), G], ["fiber", t("fiber"), G],
    ["sodium", t("sodium"), G], ["calcium", t("calcium"), " mg"]];
  view.appendChild(h("div", { class: "card", style: "margin-bottom:16px" }, [
    h("div", { class: "small muted", style: "margin-bottom:8px" }, t("per100")),
    h("div", { class: "macros" }, M.map(([k, label, unit]) => h("div", { class: "macro" }, [h("b", {}, i[k] == null ? "—" : i[k] + unit), h("span", {}, label)]))),
  ]));
  const algs = i.allergen_ids || [];
  view.appendChild(h("div", {}, [
    h("span", { class: "small muted" }, t("allergensLabel") + ": "),
    algs.length ? h("span", { class: "pill-list", style: "display:inline-flex" }, algs.map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a)))) : h("span", { class: "muted" }, t("noAllergens")),
  ]));
}

/* Import the bundled MBL dataset (real grams) — replaces recipes + ingredients */
async function importMblData() {
  const t = I18N.t.bind(I18N);
  const ok = await U.confirmDelete("Replace ALL recipes and ingredients with the MBL dataset (real gram weights + imported macros: energy, protein, fat, carbs, sugar, added sugar, sodium, calcium)? Your menus, people and subscribers are kept. Any manual recipe/ingredient edits in this browser will be overwritten.");
  if (!ok) return;
  try {
    const r = await Data.importMbl();
    U.toast(`Imported ${r.recipes} recipes · ${r.ingredients} ingredients`);
    Router.rerender();
  } catch (e) { U.toast(String(e.message || e), true); }
}

/* allergen multi-select pill widget (reused by people page too) */
function allergenPicker(selectedIds, max) {
  const h = U.h;
  const sel = new Set(selectedIds || []);
  const wrap = h("div", { class: "pill-list" });
  Data.all("allergens").sort((a, b) => (a.code || 0) - (b.code || 0)).forEach((a) => {
    const on = sel.has(a.id);
    const pill = h("button", { type: "button", class: "badge" + (on ? " badge--allergen" : ""), style: "cursor:pointer", onClick: () => {
      if (sel.has(a.id)) sel.delete(a.id);
      else { if (max && sel.size >= max) { U.toast("Max " + max, true); return; } sel.add(a.id); }
      pill.className = "badge" + (sel.has(a.id) ? " badge--allergen" : ""); pill.style.cursor = "pointer";
    } }, I18N.pick(a, "name"));
    wrap.appendChild(pill);
  });
  wrap._get = () => [...sel];
  return wrap;
}

function ingredientForm(i) {
  const t = I18N.t.bind(I18N), h = U.h;
  const isNew = !i;
  i = i || { name_en: "", name_zh: "", supplier: "", allergen_ids: [] };
  const f = {};
  const mk = (k, type) => (f[k] = h("input", { class: "input" + (type === "number" ? " num" : ""), type: type || "text", step: "any", value: i[k] == null ? "" : i[k] }));
  const picker = allergenPicker(i.allergen_ids);
  const form = h("div", {}, [
    h("div", { class: "row" }, [
      h("div", { class: "field" }, [h("label", {}, t("name_en")), mk("name_en")]),
      h("div", { class: "field" }, [h("label", {}, t("name_zh")), mk("name_zh")]),
    ]),
    h("div", { class: "row" }, [
      h("div", { class: "field" }, [h("label", {}, t("supplier")), mk("supplier")]),
      h("div", { class: "field", style: "flex:0 0 130px" }, [h("label", {}, t("origin")), mk("origin")]),
      h("div", { class: "field", style: "flex:0 0 150px" }, [h("label", {}, (window.MBL_CONFIG.CURRENCY || "NT$") + " / kg"), mk("price_per_kg", "number")]),
    ]),
    h("div", { class: "small muted", style: "margin:6px 0" }, t("per100")),
    h("div", { class: "row" }, [
      fld(t("kcal"), mk("kcal", "number")), fld(t("protein"), mk("protein", "number")),
      fld(t("fat"), mk("fat", "number")), fld(t("carbs"), mk("carbs", "number")),
    ]),
    h("div", { class: "row" }, [
      fld(t("sugar"), mk("sugar", "number")), fld(t("addedSugar"), mk("added_sugar", "number")), fld(t("fiber"), mk("fiber", "number")),
    ]),
    h("div", { class: "row" }, [
      fld(t("sodium") + " (g)", mk("sodium", "number")), fld(t("calcium") + " (mg)", mk("calcium", "number")),
    ]),
    h("div", { class: "field" }, [h("label", {}, t("allergensLabel")), picker]),
    isNew ? null : (function () {
      const hide = Data.willHide("ingredients", i);
      return h("button", { class: "btn btn--danger btn--sm", onClick: async () => {
        if (await U.confirmDelete(hide ? t("hideConfirm") : undefined)) {
          await Data.removeOrHide("ingredients", i); U.toast(hide ? t("hiddenToast") : t("deleted"));
          document.querySelector(".modal-backdrop").click(); Router.go("#/ingredients"); Router.rerender();
        }
      } }, (hide ? "🙈 " + t("hideFromView") : "🗑 " + t("delete")));
    })(),
  ]);
  function fld(label, input) { return h("div", { class: "field" }, [h("label", {}, label), input]); }

  U.modal(isNew ? t("add") + " · " + t("ingredients") : i.name_en, form, {
    async onSave() {
      const num = (k) => f[k].value === "" ? null : Number(f[k].value);
      const payload = {
        name_en: f.name_en.value.trim(), name_zh: f.name_zh.value.trim(), supplier: f.supplier.value.trim(),
        origin: f.origin.value.trim() || null,
        kcal: num("kcal"), protein: num("protein"), carbs: num("carbs"), fat: num("fat"),
        sugar: num("sugar"), added_sugar: num("added_sugar"), fiber: num("fiber"),
        sodium: num("sodium"), calcium: num("calcium"),
        price_per_kg: num("price_per_kg"), allergen_ids: picker._get(),
      };
      // keep legacy salt in sync with sodium (≈2.5× by mass) so older views still populate
      payload.salt = payload.sodium != null ? Math.round(payload.sodium * 2.5 * 100) / 100 : null;
      if (!payload.name_en) { U.toast(t("name_en") + "?", true); return false; }
      if (isNew) await Data.create("ingredients", payload); else await Data.update("ingredients", i.id, payload);
      U.toast(t("saved")); Router.rerender();
    },
  });
}
