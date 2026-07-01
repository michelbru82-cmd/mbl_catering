/* Deals — Kanban pipeline (drag between stages) + deal form */
const DEAL_STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"];

PAGES.deals = {
  icon: "💼", title: () => I18N.t("deals"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;

    const won = Data.wonRecently(30);
    view.appendChild(h("div", { class: "stat-row" }, [
      h("div", { class: "card card--stat" }, [h("span", { class: "stat__num" }, CRM.money(Data.pipelineValue())), h("span", { class: "stat__label" }, t("totalPipeline"))]),
      h("div", { class: "card card--stat" }, [h("span", { class: "stat__num" }, String(Data.openDeals().length)), h("span", { class: "stat__label" }, t("openDealsCount"))]),
      h("div", { class: "card card--stat" }, [h("span", { class: "stat__num" }, CRM.money(won.reduce((s, d) => s + (Number(d.value) || 0), 0))), h("span", { class: "stat__label" }, t("wonThisMonth"))]),
    ]));

    view.appendChild(h("div", { class: "toolbar" }, [
      h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => dealForm(null) }, "＋ " + t("newDeal")),
    ]));

    const board = h("div", { class: "kanban" });
    view.appendChild(board);

    function drawBoard() {
      board.innerHTML = "";
      DEAL_STAGES.forEach((stage) => {
        const deals = Data.all("deals").filter((d) => d.stage === stage);
        const sum = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);
        const col = h("div", { class: "kan-col", dataset: { stage } }, [
          h("div", { class: "kan-col__head" }, [h("span", {}, t("stg_" + stage)), h("span", { class: "sum" }, deals.length + " · " + CRM.money(sum))]),
        ]);
        deals.forEach((d) => {
          const co = Data.companyOf ? Data.get("companies", d.company_id) : null;
          const ct = Data.get("contacts", d.contact_id);
          const card = h("div", { class: "kan-card", draggable: "true", dataset: { id: d.id }, onClick: () => dealForm(d) }, [
            h("div", { class: "kan-card__title" }, d.title),
            h("div", { class: "kan-card__meta" }, [h("span", {}, (co && co.name) || (ct && Data.contactName(ct)) || ""), h("span", {}, CRM.money(d.value))]),
            d.close_date ? h("div", { class: "kan-card__meta" }, [h("span", { class: "muted small" }, t("closeDate") + ": " + U.fmtDate(d.close_date)), h("span", { class: "muted small" }, (d.probability != null ? d.probability + "%" : ""))]) : null,
          ]);
          card.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", d.id); card.classList.add("dragging"); });
          card.addEventListener("dragend", () => card.classList.remove("dragging"));
          col.appendChild(card);
        });
        col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drop-hover"); });
        col.addEventListener("dragleave", () => col.classList.remove("drop-hover"));
        col.addEventListener("drop", async (e) => {
          e.preventDefault(); col.classList.remove("drop-hover");
          const id = e.dataTransfer.getData("text/plain");
          const deal = Data.get("deals", id);
          if (deal && deal.stage !== stage) {
            const patch = { stage };
            if (stage === "won") patch.probability = 100;
            if (stage === "lost") patch.probability = 0;
            if ((stage === "won" || stage === "lost") && !deal.close_date) patch.close_date = U.TODAY;
            await Data.update("deals", id, patch);
            drawBoard();
          }
        });
        board.appendChild(col);
      });
    }
    drawBoard();
  },
};

function dealForm(d) {
  const t = I18N.t.bind(I18N), h = U.h;
  const isNew = !d;
  d = d || { stage: "new", probability: 20 };
  const F = {};
  const inp = (name, attrs) => (F[name] = h("input", Object.assign({ class: "input", value: d[name] != null ? d[name] : "" }, attrs || {})));
  const field = (label, el) => h("div", { class: "field" }, [h("label", {}, label), el]);

  const compOpts = [{ v: "", l: "— " + t("none") + " —" }, ...Data.all("companies").sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ v: c.id, l: c.name }))];
  const compSel = (F.company_id = h("select", { class: "input" }, compOpts.map((o) => h("option", { value: o.v, selected: o.v === (d.company_id || "") }, o.l))));
  const ctOpts = [{ v: "", l: "— " + t("none") + " —" }, ...Data.all("contacts").map((c) => ({ v: c.id, l: Data.contactName(c) }))];
  const ctSel = (F.contact_id = h("select", { class: "input" }, ctOpts.map((o) => h("option", { value: o.v, selected: o.v === (d.contact_id || "") }, o.l))));
  const stageSel = (F.stage = h("select", { class: "input" }, DEAL_STAGES.map((s) => h("option", { value: s, selected: s === d.stage }, t("stg_" + s)))));

  const form = h("div", {}, [
    field(t("dealTitle"), inp("title")),
    h("div", { class: "row" }, [field(t("value"), inp("value", { type: "number", min: "0" })), field(t("probability") + " %", inp("probability", { type: "number", min: "0", max: "100" }))]),
    h("div", { class: "row" }, [field(t("stage"), stageSel), field(t("closeDate"), inp("close_date", { type: "date" }))]),
    h("div", { class: "row" }, [field(t("company"), compSel), field(t("contact"), ctSel)]),
    field(t("owner"), inp("owner")),
    field(t("notes"), (F.notes = h("textarea", { class: "input", rows: 2 }, d.notes || ""))),
    isNew ? null : h("button", { class: "btn btn--danger btn--sm", style: "margin-top:12px", onClick: async () => {
      if (await U.confirmDelete()) { await Data.remove("deals", d.id); U.toast(t("deleted")); document.querySelector(".modal-backdrop").click(); Router.rerender(); }
    } }, "🗑 " + t("delete")),
  ]);

  U.modal(isNew ? t("newDeal") : d.title, form, {
    saveText: t("save"),
    async onSave() {
      const payload = {
        title: F.title.value.trim(), value: F.value.value ? Number(F.value.value) : null,
        probability: F.probability.value ? Number(F.probability.value) : null,
        stage: F.stage.value, close_date: F.close_date.value || null,
        company_id: F.company_id.value || null, contact_id: F.contact_id.value || null,
        owner: F.owner.value.trim() || null, notes: F.notes.value.trim() || null,
      };
      if (!payload.title) { U.toast(t("dealTitle") + "?", true); return false; }
      if (isNew) await Data.create("deals", payload); else await Data.update("deals", d.id, payload);
      U.toast(t("saved")); Router.rerender();
    },
  });
}
