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
      const f = {};
      const mk = (k, opts) => (f[k] = h("input", Object.assign({ class: "input", value: p[k] == null ? "" : p[k] }, opts || {})));
      const nameEn = mk("name");
      const nameZh = h("input", { class: "input zh", value: p.name_zh || "" }); f.name_zh = nameZh;
      const covers = mk("covers", { class: "input num", type: "number", min: "0", step: "1" });
      const useByDays = h("input", { class: "input num", type: "number", min: "0", step: "1", value: p.use_by_days == null ? 2 : p.use_by_days }); f.use_by_days = useByDays;
      const fld = (label, node) => h("div", { class: "field" }, [h("label", {}, label), node]);
      const form = h("div", {}, [
        h("div", { class: "row" }, [
          fld(t("name"), nameEn), fld(t("name_zh"), nameZh),
          h("div", { class: "field", style: "flex:0 0 110px" }, [h("label", {}, t("covers")), covers]),
          h("div", { class: "field", style: "flex:0 0 150px" }, [h("label", {}, t("useByDays")), useByDays]),
        ]),
        h("div", { class: "small muted", style: "margin:8px 0 2px;font-weight:600" }, t("companyInfo")),
        h("div", { class: "row" }, [
          fld(t("representative"), mk("representative")),
          fld(t("taxNumber"), mk("tax_number")),
        ]),
        h("div", { class: "row" }, [
          fld(t("email"), mk("email", { type: "email" })),
          fld(t("phone"), mk("phone")),
        ]),
        fld(t("companyAddress"), mk("address")),
        fld(t("deliverySite"), mk("delivery_site")),
        isNew ? null : h("button", { class: "btn btn--danger btn--sm", onClick: async () => {
          if (Data.places().length <= 1) { U.toast(t("cannotDeleteLast"), true); return; }
          if (await U.confirmDelete(t("deletePlaceWarn"))) { await deletePlace(p); document.querySelector(".modal-backdrop").click(); }
        } }, "🗑 " + t("delete")),
      ]);
      U.modal(isNew ? t("addPlace") : p.name, form, {
        wide: true,
        async onSave() {
          const payload = {
            name: f.name.value.trim(), name_zh: f.name_zh.value.trim(), covers: f.covers.value === "" ? 0 : Number(f.covers.value),
            use_by_days: f.use_by_days.value === "" ? 2 : Number(f.use_by_days.value),
            representative: f.representative.value.trim(), tax_number: f.tax_number.value.trim(), email: f.email.value.trim(),
            phone: f.phone.value.trim(), address: f.address.value.trim(), delivery_site: f.delivery_site.value.trim(),
          };
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
