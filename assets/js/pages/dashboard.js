/* Dashboard — overview + quick links */
PAGES.dashboard = {
  icon: "🏠", title: () => I18N.t("dashboard"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    const today = U.TODAY;
    const tMenu = Data.menuForDate(today) || Data.menuForDate(U.isoAddDays(today, 1));
    const nextDate = tMenu ? U.isoAddDays(tMenu.date, 1) : null;

    const stats = [
      ["recipes", Data.all("recipes").length, "#/recipes", "🍽️"],
      ["ingredients", Data.all("ingredients").length, "#/ingredients", "🥕"],
      ["headcount", Data.activePeople().length, "#/people", "👥"],
      ["subscribers", Data.all("subscribers").filter((s) => s.active).length, "#/newsletter", "✉️"],
    ];

    view.appendChild(h("div", { class: "banner banner--info" }, [
      h("span", {}, "👋"),
      h("div", {}, [
        h("b", {}, (window.MBL_CONFIG.ORG_NAME) + " — " + t("dashboard")), h("br"),
        h("span", { class: "small" }, Data.source === "local" ? t("localMode") : "Connected to Supabase."),
      ]),
    ]));

    const cards = h("div", { class: "cards" });
    stats.forEach(([key, num, href, ico]) => {
      cards.appendChild(h("a", { class: "card card--stat card--link", href }, [
        h("div", {}, [h("span", { class: "stat__num" }, U.fmtNum(num)), " ", h("span", {}, ico)]),
        h("span", { class: "stat__label" }, t(key)),
      ]));
    });
    view.appendChild(cards);

    // today's menu summary
    view.appendChild(h("div", { class: "section-head", style: "margin-top:26px" }, [
      h("h2", {}, t("today") + " · " + U.fmtDate(tMenu ? tMenu.date : today, true)),
      h("div", { class: "spacer" }),
      h("a", { class: "btn", href: "#/production" }, "→ " + t("production")),
      h("a", { class: "btn", href: "#/menu" }, "→ " + t("menu")),
    ]));

    if (!tMenu) { view.appendChild(h("div", { class: "empty" }, t("noMenu"))); return; }

    const SLOTS = [["meat", t("meat")], ["veg1", t("veg1")], ["veg2", t("veg2")], ["carb", t("carb")], ["dairy", t("dairy")], ["fruit", t("fruit")], ["side", "Side"]];
    const grid = h("div", { class: "cards" });
    SLOTS.forEach(([k, label]) => {
      const slot = tMenu.slots[k];
      grid.appendChild(h("div", { class: "card" }, [
        h("div", { class: "badge badge--cat" }, label),
        h("div", { style: "margin-top:8px;font-weight:600" }, slot ? slot.name_en : "—"),
      ]));
    });
    view.appendChild(grid);

    // allergen alert
    const algs = Data.dayAllergens(tMenu);
    if (algs.length) {
      view.appendChild(h("div", { class: "banner banner--allergen", style: "margin-top:18px" }, [
        h("span", {}, "⚠️"),
        h("div", {}, [h("b", {}, t("allergenAlert") + ": "), algs.map((a) => Data.allergenName(a)).join(", ")]),
      ]));
    }
  },
};
