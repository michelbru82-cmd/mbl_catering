/* Settings — data source, account, AI status, data export */
PAGES.settings = {
  icon: "⚙️", title: () => I18N.t("settings"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    const connected = Data.source === "supabase";

    view.appendChild(h("div", { class: "banner banner--info" }, [h("span", {}, "☁️"), h("div", { class: "small" }, t("settingsIntro"))]));

    const grid = h("div", { class: "detail-grid" });

    // ---- Data source ----
    const dsCard = h("div", { class: "detail-card" }, [
      h("div", { class: "section-head" }, [h("h2", {}, "🗄️ " + t("dataSource"))]),
      h("p", { class: "small" }, connected ? t("cloudMode") : t("localMode")),
      h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-top:10px" }, [
        h("button", { class: "btn btn--primary btn--sm", onClick: () => MBLApp.connectDbModal() }, connected ? "☁️ " + t("dataSource") : "☁️ " + t("connectCloud")),
        h("button", { class: "btn btn--sm", onClick: () => { Data.exportJson(); U.toast(t("saved")); } }, "⤓ " + t("exportData")),
        (!connected) ? h("button", { class: "btn btn--sm", onClick: () => { if (confirm("Reset local demo data?")) { Data.resetLocal(); location.reload(); } } }, "↺ Reset demo data") : null,
      ]),
    ]);
    grid.appendChild(dsCard);

    // ---- Account / AI ----
    const acctCard = h("div", { class: "detail-card" });
    acctCard.appendChild(h("div", { class: "section-head" }, [h("h2", {}, "👤 " + t("account"))]));
    if (Auth.enabled && Auth.user) {
      acctCard.appendChild(h("dl", { class: "kv" }, [h("dt", {}, t("emailAddr")), h("dd", {}, Auth.user.email || "—")]));
      acctCard.appendChild(h("button", { class: "btn btn--sm btn--danger", style: "margin-top:10px", onClick: () => Auth.signOut() }, t("signOut")));
    } else {
      acctCard.appendChild(h("p", { class: "small muted" }, connected ? "—" : "Login is enabled once you connect Supabase."));
    }

    acctCard.appendChild(h("div", { class: "section-head", style: "margin-top:20px" }, [h("h2", {}, "✨ " + t("aiSettings"))]));
    acctCard.appendChild(h("div", { class: "banner " + (AI.connected ? "banner--info" : ""), style: "margin:0" }, [
      h("span", {}, AI.connected ? "✅" : "🧪"),
      h("div", { class: "small" }, AI.connected ? t("aiConnected") : t("aiLocal")),
    ]));
    grid.appendChild(acctCard);

    view.appendChild(grid);

    // language quick switch
    view.appendChild(h("div", { class: "detail-card", style: "margin-top:16px" }, [
      h("div", { class: "section-head" }, [h("h2", {}, "🌐 Language / 語言")]),
      h("div", { style: "display:flex;gap:8px" }, [
        h("button", { class: "btn btn--sm" + (I18N.lang === "en" ? " btn--primary" : ""), onClick: () => { I18N.set("en"); MBLApp.buildNav(); Router.rerender(); } }, "English"),
        h("button", { class: "btn btn--sm" + (I18N.lang === "zh" ? " btn--primary" : ""), onClick: () => { I18N.set("zh"); MBLApp.buildNav(); Router.rerender(); } }, "繁體中文"),
      ]),
    ]));
  },
};
