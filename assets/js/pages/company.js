/* My company infos — every user sees the company legal identity their admin
   set for them (read-only), and can rename their own catering place(s). */
PAGES.company = {
  icon: "🏢", title: () => I18N.t("myCompany"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    const prof = (window.Auth && Auth.profile) || {};

    // ---- company legal identity (admin-managed, shown read-only) ----
    const ROWS = [
      ["companyOfficial", prof.company_official],
      ["companyTrading", prof.company_trading],
      ["companyRep", prof.company_rep],
      ["taxNumber", prof.company_tax],
    ];
    const hasAny = ROWS.some(([, v]) => v);
    const infoTable = h("table", { class: "data" }, h("tbody", {}, ROWS.map(([key, val]) =>
      h("tr", {}, [
        h("td", { style: "width:220px;font-weight:600" }, t(key)),
        h("td", {}, val ? String(val) : h("span", { class: "muted" }, "—")),
      ]))));
    view.appendChild(h("div", { class: "section-head" }, [h("h2", {}, "🏢 " + t("myCompany"))]));
    view.appendChild(h("div", { class: "card", style: "margin-bottom:16px" }, [
      h("div", { class: "small muted", style: "margin-bottom:8px" }, hasAny ? t("companyInfoIntro") : t("companyInfoEmpty")),
      h("div", { class: "table-wrap" }, infoTable),
    ]));

    // ---- rename my place(s) ----
    view.appendChild(h("div", { class: "section-head", style: "margin-top:8px" }, [h("h3", { style: "font-size:15px" }, t("myPlaces"))]));
    view.appendChild(h("div", { class: "small muted", style: "margin-bottom:10px" }, t("renamePlaceIntro")));
    const host = h("div", {}); view.appendChild(host);

    function draw() {
      host.innerHTML = "";
      Data.places().forEach((p) => {
        const nameEn = h("input", { class: "input", value: p.name || "" });
        const nameZh = h("input", { class: "input zh", value: p.name_zh || "" });
        const row = h("div", { class: "card", style: "margin-bottom:10px" }, [
          h("div", { class: "row" }, [
            h("div", { class: "field" }, [h("label", {}, t("name")), nameEn]),
            h("div", { class: "field" }, [h("label", {}, t("name_zh")), nameZh]),
            h("div", { style: "align-self:flex-end;padding-bottom:2px" },
              h("button", { class: "btn btn--primary", onClick: async () => {
                const nm = nameEn.value.trim();
                if (!nm) { U.toast(t("name") + "?", true); return; }
                await Data.update("places", p.id, { name: nm, name_zh: nameZh.value.trim() });
                U.toast(t("saved"));
                if (window.MBLApp) MBLApp.buildNav();
                Router.rerender();
              } }, "💾 " + t("save"))),
          ]),
        ]);
        host.appendChild(row);
      });
    }
    draw();
  },
};
