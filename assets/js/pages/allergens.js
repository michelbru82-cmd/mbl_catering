/* Allergens — admin: manage the allergen master list (EU 14 + Mango/Taiwan) */
PAGES.allergens = {
  icon: "⚠️", title: () => I18N.t("allergens"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    view.appendChild(h("div", { class: "toolbar" }, [
      h("span", { class: "muted small" }, t("eu14")),
      h("div", { style: "flex:1" }),
      Data.hiddenCount("allergens") ? h("button", { class: "btn btn--sm", onClick: () => U.hiddenManager("allergens") }, "🙈 " + t("hidden") + " (" + Data.hiddenCount("allergens") + ")") : null,
      h("button", { class: "btn btn--primary", onClick: () => form(null) }, "＋ " + t("addAllergen")),
    ]));

    // usage counts
    const usage = {};
    Data.all("ingredients").forEach((i) => (i.allergen_ids || []).forEach((a) => (usage[a] = (usage[a] || 0) + 1)));
    const usePeople = {};
    Data.all("people").forEach((p) => (p.allergen_ids || []).forEach((a) => (usePeople[a] = (usePeople[a] || 0) + 1)));

    const list = Data.all("allergens").slice().sort((a, b) => (a.code || 99) - (b.code || 99));
    const tbl = h("table", { class: "data" });
    tbl.appendChild(h("thead", {}, h("tr", {}, [
      h("th", { class: "num" }, t("allergenCode")), h("th", {}, t("allergenName")), h("th", {}, "中文"),
      h("th", { class: "num" }, t("ingredients")), h("th", { class: "num" }, t("people")), h("th", {}, ""),
    ])));
    const tb = h("tbody", {});
    list.forEach((a) => {
      tb.appendChild(h("tr", { class: "clickable", onClick: () => form(a) }, [
        h("td", { class: "num" }, a.code || "—"),
        h("td", {}, h("b", {}, a.name_en)),
        h("td", { class: "zh" }, a.name_zh || "—"),
        h("td", { class: "num" }, usage[a.id] || 0),
        h("td", { class: "num" }, usePeople[a.id] || 0),
        h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); form(a); } }, "✏️")),
      ]));
    });
    tbl.appendChild(tb);
    view.appendChild(h("div", { class: "table-wrap" }, tbl));

    function form(a) {
      const isNew = !a;
      a = a || { name_en: "", name_zh: "", code: (Math.max(0, ...Data.all("allergens").map((x) => x.code || 0)) + 1) };
      const en = h("input", { class: "input", value: a.name_en });
      const zh = h("input", { class: "input zh", value: a.name_zh || "" });
      const code = h("input", { class: "input num", type: "number", value: a.code || "" });
      const body = h("div", {}, [
        h("div", { class: "row" }, [
          h("div", { class: "field", style: "flex:0 0 90px" }, [h("label", {}, t("allergenCode")), code]),
          h("div", { class: "field" }, [h("label", {}, t("name_en")), en]),
          h("div", { class: "field" }, [h("label", {}, t("name_zh")), zh]),
        ]),
        isNew ? null : (function () {
          const hide = Data.willHide("allergens", a);
          return h("button", { class: "btn btn--danger btn--sm", onClick: async () => {
            if (await U.confirmDelete(hide ? t("hideConfirm") : "Delete this allergen? It will be removed from ingredients & people too.")) {
              if (hide) { await Data.hideItem("allergens", a.id); }
              else {
                // cascade remove from ingredients & people
                for (const i of Data.all("ingredients").filter((x) => (x.allergen_ids || []).includes(a.id)))
                  await Data.update("ingredients", i.id, { allergen_ids: i.allergen_ids.filter((x) => x !== a.id) });
                for (const p of Data.all("people").filter((x) => (x.allergen_ids || []).includes(a.id)))
                  await Data.update("people", p.id, { allergen_ids: p.allergen_ids.filter((x) => x !== a.id) });
                await Data.remove("allergens", a.id);
              }
              U.toast(hide ? t("hiddenToast") : t("deleted")); document.querySelector(".modal-backdrop").click(); Router.rerender();
            }
          } }, hide ? "🙈 " + t("hideFromView") : "🗑 " + t("delete"));
        })(),
      ]);
      U.modal(isNew ? t("addAllergen") : a.name_en, body, {
        async onSave() {
          const payload = { name_en: en.value.trim(), name_zh: zh.value.trim(), code: code.value === "" ? null : Number(code.value) };
          if (!payload.name_en) { U.toast(t("name_en") + "?", true); return false; }
          if (isNew) await Data.create("allergens", Object.assign({ id: "alg_" + (payload.code || Date.now()) }, payload));
          else await Data.update("allergens", a.id, payload);
          U.toast(t("saved")); Router.rerender();
        },
      });
    }
  },
};
