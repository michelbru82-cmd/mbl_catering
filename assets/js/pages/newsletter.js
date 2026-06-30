/* Newsletter — subscriber list + daily newsletter (menu, ingredients, allergens) + Send */
PAGES.newsletter = {
  icon: "✉️", title: () => I18N.t("newsletter"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    const days = Data.all("menu_days").slice().sort((a, b) => a.date.localeCompare(b.date));
    const firstUpcoming = (days.find((d) => d.date >= U.TODAY) || days[0] || {}).date;
    let date = firstUpcoming;

    view.appendChild(h("div", { class: "banner banner--info" }, [h("span", {}, "✉️"), h("div", { class: "small" }, t("newsletterIntro"))]));

    // ---- send controls ----
    const dateSel = days.length ? h("select", { class: "input", onChange: (e) => { date = e.target.value; renderPreview(); } },
      days.map((d) => h("option", { value: d.date, selected: d.date === date }, U.fmtDate(d.date, true)))) : null;
    const sendBtn = h("button", { class: "btn btn--accent", onClick: send }, "📤 " + t("sendNewsletter"));
    view.appendChild(h("div", { class: "toolbar" }, [
      dateSel ? h("label", { class: "small muted" }, t("date") + ":") : null, dateSel,
      h("div", { style: "flex:1" }), sendBtn,
    ]));

    // ---- two columns: subscribers + preview ----
    const cols = h("div", { style: "display:grid;grid-template-columns:340px 1fr;gap:18px;align-items:start" });
    const subsCol = h("div", {});
    const prevCol = h("div", {});
    cols.appendChild(subsCol); cols.appendChild(prevCol);
    view.appendChild(cols);

    // subscribers
    function renderSubs() {
      subsCol.innerHTML = "";
      const subs = Data.all("subscribers").slice().sort((a, b) => a.email.localeCompare(b.email));
      const active = subs.filter((s) => s.active).length;
      subsCol.appendChild(h("div", { class: "section-head" }, [
        h("h2", { style: "font-size:15px" }, t("subscribers")), h("span", { class: "badge badge--ok" }, active + " " + t("active")),
        h("div", { class: "spacer" }), h("button", { class: "btn btn--sm btn--primary", onClick: addSub }, "＋"),
      ]));
      const box = h("div", { class: "card", style: "padding:0" });
      subs.forEach((s) => {
        box.appendChild(h("div", { style: "display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--border)" }, [
          h("input", { type: "checkbox", checked: s.active, title: t("active"), onChange: async (e) => { await Data.update("subscribers", s.id, { active: e.target.checked }); renderSubs(); } }),
          h("div", { style: "flex:1;min-width:0" }, [h("div", { style: "font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis" }, s.email), s.name ? h("div", { class: "small muted" }, s.name) : null]),
          h("button", { class: "btn btn--sm btn--danger", onClick: async () => { if (await U.confirmDelete()) { await Data.remove("subscribers", s.id); renderSubs(); } } }, "✕"),
        ]));
      });
      if (!subs.length) box.appendChild(h("div", { class: "empty small" }, t("nothingHere")));
      subsCol.appendChild(box);
    }
    function addSub() {
      const email = h("input", { class: "input", type: "email", placeholder: "name@example.com" });
      const name = h("input", { class: "input", placeholder: t("name") });
      U.modal(t("subscribe"), h("div", {}, [h("div", { class: "field" }, [h("label", {}, t("subscriberEmail")), email]), h("div", { class: "field" }, [h("label", {}, t("name")), name])]), {
        async onSave() {
          const e = email.value.trim(); if (!e || !/.+@.+\..+/.test(e)) { U.toast("Valid email?", true); return false; }
          await Data.create("subscribers", { email: e, name: name.value.trim(), active: true, created_at: U.TODAY });
          U.toast(t("saved")); renderSubs();
        },
      });
    }

    // preview
    function renderPreview() {
      prevCol.innerHTML = "";
      prevCol.appendChild(h("div", { class: "section-head" }, [h("h2", { style: "font-size:15px" }, t("previewNewsletter")), h("div", { class: "spacer" }), h("span", { class: "small muted" }, date ? U.fmtDate(date, true) : "")]));
      const data = buildNewsletter(date);
      const frame = h("div", { class: "card", style: "max-width:640px" });
      frame.innerHTML = data.html;
      prevCol.appendChild(frame);
    }

    async function send() {
      const recipients = Data.all("subscribers").filter((s) => s.active).map((s) => ({ email: s.email, name: s.name }));
      if (!recipients.length) { U.toast("No active subscribers", true); return; }
      const data = buildNewsletter(date);
      sendBtn.disabled = true; sendBtn.textContent = "…";
      try {
        const res = await Data.sendNewsletter({ menu_date: date, subject: data.subject, html: data.html, text: data.text, recipients, from: window.MBL_CONFIG.NEWSLETTER_FROM });
        if (res && res.local) U.toast(t("queued") + " — " + recipients.length + " " + t("sentTo") + " (local demo, wire SMTP to send for real)");
        else U.toast(t("queued") + " — " + (res && res.count != null ? res.count : recipients.length) + " " + t("sentTo"));
      } catch (e) { U.toast("Send failed: " + (e.message || e), true); }
      finally { sendBtn.disabled = false; sendBtn.textContent = "📤 " + t("sendNewsletter"); }
    }

    renderSubs(); if (date) renderPreview(); else prevCol.appendChild(h("div", { class: "empty" }, t("noMenu")));
  },
};

/* Build the daily newsletter content (inline-styled HTML email) */
function buildNewsletter(date) {
  const cfg = window.MBL_CONFIG;
  const menu = Data.menuForDate(date);
  const SLOTS = [["meat", "Meat 肉類"], ["veg1", "Vegetable 1 蔬菜"], ["veg2", "Vegetable 2 蔬菜"], ["carb", "Carb 澱粉"], ["dairy", "Dairy 乳製品"], ["fruit", "Fruit / Cake 水果"], ["side", "Side 前菜"]];
  const brand = cfg.ORG_NAME + " · " + (cfg.ORG_NAME_ZH || "");
  const subject = `${cfg.ORG_NAME} — Menu ${date}`;
  if (!menu) return { subject, html: `<p>No menu set for ${date}.</p>`, text: `No menu for ${date}` };

  const ingSet = new Set(), algSet = new Set();
  let rowsHtml = "";
  SLOTS.forEach(([k, label]) => {
    const s = menu.slots[k]; if (!s) return;
    const r = s.recipe_id && Data.get("recipes", s.recipe_id);
    const zh = r && r.name_zh ? r.name_zh : "";
    if (r) { (r.items || []).forEach((it) => ingSet.add(it.name_en)); Data.recipeAllergens(r).forEach((a) => algSet.add(a)); }
    rowsHtml += `<tr><td style="padding:6px 10px;background:#f3f1ea;font-weight:600;white-space:nowrap">${label}</td><td style="padding:6px 10px">${esc(s.name_en)}${zh ? ` <span style="color:#666">· ${esc(zh)}</span>` : ""}</td></tr>`;
  });
  const algNames = [...algSet].map((a) => Data.allergenName(a));
  const ings = [...ingSet].sort();

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;color:#23211c;max-width:600px">
      <div style="background:#2f7d4f;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0">
        <div style="font-size:18px;font-weight:700">${esc(brand)}</div>
        <div style="opacity:.9;font-size:13px">Daily Menu · 每日菜單 — ${esc(date)}</div>
      </div>
      <div style="border:1px solid #e4e1d9;border-top:none;border-radius:0 0 10px 10px;padding:16px 18px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rowsHtml}</table>
        ${algNames.length ? `<div style="margin-top:14px;padding:10px 12px;background:#fae6e1;color:#b5341f;border-radius:8px;font-size:13px"><b>⚠ Allergens / 過敏原:</b> ${esc(algNames.join(", "))}</div>` : ""}
        <div style="margin-top:14px;font-size:13px;color:#555">
          <b>Ingredients / 食材:</b><br>${ings.length ? esc(ings.join(", ")) : "—"}
        </div>
        <div style="margin-top:16px;font-size:11px;color:#999">Sent by ${esc(cfg.ORG_NAME)} · reply to ${esc(cfg.NEWSLETTER_REPLY_TO || "")}</div>
      </div>
    </div>`;
  const text = `${cfg.ORG_NAME} — Menu ${date}\n` + SLOTS.map(([k, l]) => { const s = menu.slots[k]; return s ? `${l}: ${s.name_en}` : null; }).filter(Boolean).join("\n") +
    (algNames.length ? `\n\nAllergens: ${algNames.join(", ")}` : "") + (ings.length ? `\n\nIngredients: ${ings.join(", ")}` : "");
  function esc(s) { return U.esc(s); }
  return { subject, html, text };
}
