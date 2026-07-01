/* Places — manage catering places (School ABC, Corporate ZAC, …).
   The active place scopes every other page (menus, people, production, newsletter…). */
PAGES.places = {
  icon: "🏢", title: () => I18N.t("places"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;

    view.appendChild(h("div", { class: "banner banner--info", style: "margin-bottom:14px" }, [
      h("span", {}, "🏢"),
      h("div", { class: "small" }, t("placesIntro")),
    ]));
    view.appendChild(h("div", { class: "toolbar" }, [
      h("span", { class: "muted small" }, Data.places().length + " " + t("places")),
      h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => placeForm(null) }, "＋ " + t("addPlace")),
    ]));
    const host = h("div", {}); view.appendChild(host);

    function refresh() { if (window.MBLApp) window.MBLApp.buildNav(); draw(); }

    function draw() {
      host.innerHTML = "";
      const tbl = h("table", { class: "data" });
      tbl.appendChild(h("thead", {}, h("tr", {}, [
        h("th", {}, t("name")), h("th", { class: "num" }, t("covers")), h("th", { class: "num" }, t("menusCount")), h("th", {}, ""),
      ])));
      const tb = h("tbody", {});
      Data.places().forEach((p) => {
        const isActive = p.id === Data.activePlaceId();
        const nMenus = Data.allRaw("menu_days").filter((m) => m.place_id === p.id).length;
        tb.appendChild(h("tr", { class: isActive ? "" : "clickable", onClick: () => { if (!isActive) { Data.setActivePlace(p.id); refresh(); U.toast(p.name); } } }, [
          h("td", {}, [h("b", {}, p.name), p.name_zh ? h("div", { class: "bilingual-zh zh" }, p.name_zh) : null, isActive ? h("span", { class: "badge badge--ok", style: "margin-left:6px" }, t("active")) : null]),
          h("td", { class: "num" }, p.covers || 0),
          h("td", { class: "num" }, nMenus),
          h("td", {}, [
            isActive ? null : h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); Data.setActivePlace(p.id); refresh(); } }, "✓ " + t("setActive")),
            h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); placeForm(p); } }, "✏️"),
          ]),
        ]));
      });
      tbl.appendChild(tb);
      host.appendChild(h("div", { class: "table-wrap" }, tbl));
    }
    draw();

    function placeForm(p) {
      const isNew = !p;
      p = p || { name: "", name_zh: "", covers: 0 };
      const nameEn = h("input", { class: "input", value: p.name || "" });
      const nameZh = h("input", { class: "input zh", value: p.name_zh || "" });
      const covers = h("input", { class: "input num", type: "number", min: "0", step: "1", value: p.covers == null ? "" : p.covers });
      const form = h("div", {}, [
        h("div", { class: "row" }, [
          h("div", { class: "field" }, [h("label", {}, t("name")), nameEn]),
          h("div", { class: "field" }, [h("label", {}, t("name_zh")), nameZh]),
          h("div", { class: "field", style: "flex:0 0 120px" }, [h("label", {}, t("covers")), covers]),
        ]),
        isNew ? null : h("button", { class: "btn btn--danger btn--sm", onClick: async () => {
          if (Data.places().length <= 1) { U.toast(t("cannotDeleteLast"), true); return; }
          if (await U.confirmDelete(t("deletePlaceWarn"))) { await deletePlace(p); document.querySelector(".modal-backdrop").click(); }
        } }, "🗑 " + t("delete")),
      ]);
      U.modal(isNew ? t("addPlace") : p.name, form, {
        async onSave() {
          const payload = { name: nameEn.value.trim(), name_zh: nameZh.value.trim(), covers: covers.value === "" ? 0 : Number(covers.value) };
          if (!payload.name) { U.toast(t("name") + "?", true); return false; }
          if (isNew) {
            payload.id = "place_" + (payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "x") + "_" + Math.round(performance.now()).toString(36);
            await Data.create("places", payload);
          } else {
            await Data.update("places", p.id, payload);
          }
          U.toast(t("saved")); refresh();
        },
      });
    }

    async function deletePlace(p) {
      // remove the place and everything scoped to it
      for (const c of Data.PLACE_COLLS) {
        const rows = Data.allRaw(c).filter((x) => x.place_id === p.id);
        for (const r of rows) await Data.remove(c, r.id);
      }
      await Data.remove("places", p.id);
      if (Data.activePlaceId() === p.id) { const first = Data.places()[0]; if (first) Data.setActivePlace(first.id); }
      U.toast(t("deleted")); refresh();
    }
  },
};
