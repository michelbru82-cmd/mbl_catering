/* Print Menu — ready-to-print weekly menu (this week + next), EN + 繁體中文 */
PAGES.printMenu = {
  icon: "🖨️", title: () => I18N.t("printMenu"),
  render(view, params) {
    const t = I18N.t.bind(I18N), h = U.h;
    const days = Data.all("menu_days").slice().sort((a, b) => a.date.localeCompare(b.date));
    if (!days.length) { view.appendChild(h("div", { class: "empty" }, t("noMenu"))); return; }

    // Monday-based week key
    function monday(iso) { const [y, m, d] = iso.split("-").map(Number); const dt = new Date(Date.UTC(y, m - 1, d)); const wd = (dt.getUTCDay() + 6) % 7; dt.setUTCDate(dt.getUTCDate() - wd); return dt.toISOString().slice(0, 10); }
    const weeks = [...new Set(days.map((d) => monday(d.date)))].sort();
    const firstUpcoming = days.find((d) => d.date >= U.TODAY) || days[0];
    let wk = params[0] || monday(firstUpcoming.date);
    if (!weeks.includes(wk)) wk = weeks[0];
    const wkIndex = weeks.indexOf(wk);
    const showWeeks = [weeks[wkIndex], weeks[wkIndex + 1]].filter(Boolean);

    const wkSel = h("select", { class: "input", onChange: (e) => Router.go("#/printMenu/" + e.target.value) },
      weeks.map((w) => h("option", { value: w, selected: w === wk }, t("week") + " " + U.fmtDate(w))));
    view.appendChild(h("div", { class: "toolbar no-print" }, [
      h("label", { class: "small muted" }, t("week") + ":"), wkSel,
      h("div", { style: "flex:1" }),
      h("span", { class: "small muted" }, "Showing 2 weeks · EN + 中文"),
      h("button", { class: "btn btn--primary", onClick: () => window.print() }, "🖨 " + t("print")),
    ]));

    const SLOTS = [["meat", t("meat"), "肉類"], ["veg1", t("veg1"), "蔬菜一"], ["veg2", t("veg2"), "蔬菜二"], ["carb", t("carb"), "澱粉"], ["dairy", t("dairy"), "乳製品"], ["fruit", t("fruit"), "水果/甜點"], ["side", "Side", "前菜"]];
    const cfg = window.MBL_CONFIG;

    const area = h("div", { class: "print-area" });
    showWeeks.forEach((w, wi) => {
      const wdays = days.filter((d) => monday(d.date) === w);
      const sheet = h("div", { style: "background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:22px;margin-bottom:20px;" + (wi ? "page-break-before:always;" : "") });
      sheet.appendChild(h("div", { style: "text-align:center;margin-bottom:14px" }, [
        h("div", { style: "font-size:22px;font-weight:700;color:var(--brand-primary-dark)" }, (cfg.ORG_NAME) + " · " + (cfg.ORG_NAME_ZH || "")),
        h("div", { class: "muted" }, t("weekMenu") + " · 每週菜單 — " + U.fmtDate(wdays[0].date) + " → " + U.fmtDate(wdays[wdays.length - 1].date)),
      ]));
      const tbl = h("table", { style: "width:100%;border-collapse:collapse;font-size:12.5px" });
      const head = [h("th", { style: thS() }, "")];
      wdays.forEach((d) => head.push(h("th", { style: thS() }, [U.weekdayName(d.date), h("br"), h("span", { style: "font-weight:400" }, U.fmtDate(d.date))])));
      tbl.appendChild(h("thead", {}, h("tr", {}, head)));
      const tb = h("tbody", {});
      SLOTS.forEach(([k, lab, labZh]) => {
        const cells = [h("td", { style: tdLabel() }, [h("div", {}, lab), h("div", { class: "zh", style: "font-size:11px;color:var(--text-soft)" }, labZh)])];
        wdays.forEach((d) => {
          const slot = d.slots[k];
          let zh = "";
          if (slot) { const r = slot.recipe_id && Data.get("recipes", slot.recipe_id); zh = r && r.name_zh ? r.name_zh : ""; }
          cells.push(h("td", { style: tdS() }, slot ? [h("div", {}, slot.name_en), zh ? h("div", { class: "zh", style: "color:var(--text-soft)" }, zh) : null] : "—"));
        });
        tb.appendChild(h("tr", {}, cells));
      });
      // allergens row
      const algCells = [h("td", { style: tdLabel() }, [h("div", {}, t("allergensLabel")), h("div", { class: "zh", style: "font-size:11px;color:var(--text-soft)" }, "過敏原")])];
      wdays.forEach((d) => { const a = Data.dayAllergens(d).map((x) => Data.allergenName(x)); algCells.push(h("td", { style: tdS() + "color:var(--allergen);font-size:11px" }, a.length ? a.join(", ") : "—")); });
      tb.appendChild(h("tr", {}, algCells));
      tbl.appendChild(tb);
      sheet.appendChild(tbl);
      area.appendChild(sheet);
    });
    view.appendChild(area);

    function thS() { return "border:1px solid var(--border);padding:7px 9px;background:var(--brand-primary-soft);color:var(--brand-primary-dark);text-align:center;font-size:12px"; }
    function tdS() { return "border:1px solid var(--border);padding:7px 9px;vertical-align:top;text-align:center"; }
    function tdLabel() { return tdS() + "background:var(--surface-2);font-weight:600;text-align:left;white-space:nowrap"; }
  },
};
