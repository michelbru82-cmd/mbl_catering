/* Menu / price list — printable product list grouped by category, with prices.
   Front-of-house sheet for Shop / Restaurant places (EN + 中文). */
PAGES.priceList = {
  icon: "📋", title: () => I18N.t("priceList"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    const CUR = window.MBL_CONFIG.CURRENCY || "NT$";
    const cfg = window.MBL_CONFIG;
    const place = Data.activePlace() || {};

    let onlyPriced = true;
    const chk = h("label", { class: "small no-print", style: "display:flex;gap:6px;align-items:center" }, [
      h("input", { type: "checkbox", checked: onlyPriced, onChange: (e) => { onlyPriced = e.target.checked; draw(); } }), t("onlyPriced"),
    ]);
    view.appendChild(h("div", { class: "toolbar no-print" }, [
      chk, h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => window.print() }, "🖨 " + t("print")),
    ]));
    const area = h("div", { class: "print-area" }); view.appendChild(area);

    function draw() {
      area.innerHTML = "";
      let list = Data.all("recipes").slice();
      if (onlyPriced) list = list.filter((r) => r.sale_price != null);
      if (!list.length) { area.appendChild(h("div", { class: "empty" }, t("nothingHere"))); return; }

      // group by category
      const groups = {};
      list.forEach((r) => { const c = r.category || t("other"); (groups[c] = groups[c] || []).push(r); });
      const cats = Object.keys(groups).sort();

      const sheet = h("div", { style: "background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:26px;max-width:820px" });
      sheet.appendChild(h("div", { style: "text-align:center;margin-bottom:16px" }, [
        h("div", { style: "font-size:24px;font-weight:800;color:var(--brand-primary-dark)" }, (place.name || cfg.ORG_NAME) + (place.name_zh ? " · " + place.name_zh : "")),
        h("div", { class: "muted" }, t("priceList")),
      ]));
      cats.forEach((c) => {
        sheet.appendChild(h("div", { style: "font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:var(--brand-primary-dark);border-bottom:2px solid var(--border);padding:10px 0 4px;margin-top:12px" }, c));
        groups[c].sort((a, b) => a.name_en.localeCompare(b.name_en)).forEach((r) => {
          sheet.appendChild(h("div", { style: "display:flex;align-items:baseline;gap:10px;padding:6px 0;border-bottom:1px dotted var(--border)" }, [
            h("div", { style: "flex:1" }, [h("b", {}, r.name_en), r.name_zh ? h("span", { class: "zh muted", style: "margin-left:8px" }, r.name_zh) : null]),
            h("div", { style: "font-weight:700;white-space:nowrap" }, r.sale_price != null ? CUR + r.sale_price : "—"),
          ]));
        });
      });
      area.appendChild(sheet);
    }
    draw();
  },
};
