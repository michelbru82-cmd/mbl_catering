/* Tasks & Follow-ups — grouped by urgency, quick complete */
PAGES.tasks = {
  icon: "✅", title: () => I18N.t("tasks"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;

    view.appendChild(h("div", { class: "toolbar" }, [
      h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => taskForm(null) }, "＋ " + t("newTask")),
    ]));

    const open = Data.all("tasks").filter((x) => !x.done);
    const done = Data.all("tasks").filter((x) => x.done).sort((a, b) => (b.due_date || "").localeCompare(a.due_date || "")).slice(0, 15);

    const overdue = open.filter((x) => x.due_date && x.due_date < U.TODAY).sort(byDue);
    const today = open.filter((x) => x.due_date === U.TODAY).sort(byDue);
    const upcoming = open.filter((x) => !x.due_date || x.due_date > U.TODAY).sort(byDue);

    function byDue(a, b) { return (a.due_date || "9999").localeCompare(b.due_date || "9999"); }

    function group(label, list, cls) {
      if (!list.length) return null;
      const card = h("div", { class: "detail-card", style: "margin-bottom:16px" }, [
        h("div", { class: "section-head" }, [h("h2", { class: cls || "" }, label + " (" + list.length + ")")]),
      ]);
      list.forEach((tk) => card.appendChild(taskRow(tk, () => Router.rerender())));
      return card;
    }

    const wrap = h("div", {});
    const g1 = group("⏰ " + t("overdue"), overdue, "due-over");
    const g2 = group("📅 " + t("dueToday"), today, "due-soon");
    const g3 = group("🔜 " + t("upcoming"), upcoming);
    const g4 = group("✔ " + t("done"), done);
    [g1, g2, g3, g4].forEach((g) => g && wrap.appendChild(g));
    if (!g1 && !g2 && !g3 && !g4) wrap.appendChild(CRM.empty(t("noFollowups")));
    view.appendChild(wrap);
  },
};

/* one task row (used here + on contact detail) */
function taskRow(tk, onChange) {
  const t = I18N.t.bind(I18N), h = U.h;
  const ct = Data.get("contacts", tk.contact_id);
  const icon = ({ call: "📞", email: "✉️", meeting: "🤝", followup: "🔔", todo: "📝" })[tk.kind] || "📝";
  const state = Data.followState(tk.due_date);
  const dueCls = !tk.done && state === "over" ? "due-over" : !tk.done && state === "today" ? "due-soon" : "muted";

  const chk = h("input", { type: "checkbox", checked: tk.done ? "checked" : null, onChange: async (e) => {
    await Data.update("tasks", tk.id, { done: e.target.checked });
    if (e.target.checked && ct) await Data.logActivity(ct.id, tk.kind === "call" ? "call" : tk.kind === "email" ? "email" : tk.kind === "meeting" ? "meeting" : "note", "✔ " + tk.title);
    U.toast(t("saved")); if (onChange) onChange();
  } });

  return h("div", { class: "cell-name", style: "padding:9px 0;border-bottom:1px solid var(--border);gap:12px" }, [
    chk,
    h("div", { style: "flex:1;min-width:0;cursor:pointer", onClick: () => taskForm(tk) }, [
      h("div", { style: tk.done ? "text-decoration:line-through;opacity:.6" : "" }, [h("span", {}, icon + " "), h("b", {}, tk.title)]),
      h("div", { class: "small" }, [
        ct ? h("a", { href: "#/contacts/" + ct.id, onClick: (e) => e.stopPropagation() }, Data.contactName(ct)) : h("span", { class: "muted" }, "—"),
        tk.due_date ? h("span", { class: dueCls }, " · " + U.fmtDate(tk.due_date)) : null,
      ]),
    ]),
    h("span", { class: "badge" }, t("tk_" + (tk.kind || "todo"))),
  ]);
}

function taskForm(tk) {
  const t = I18N.t.bind(I18N), h = U.h;
  const isNew = !tk || !tk.id;
  tk = tk || { kind: "followup", done: false };
  const F = {};
  const inp = (name, attrs) => (F[name] = h("input", Object.assign({ class: "input", value: tk[name] != null ? tk[name] : "" }, attrs || {})));
  const field = (label, el) => h("div", { class: "field" }, [h("label", {}, label), el]);

  const kindSel = (F.kind = h("select", { class: "input" }, ["followup", "call", "email", "meeting", "todo"].map((k) => h("option", { value: k, selected: k === tk.kind }, t("tk_" + k)))));
  const ctOpts = [{ v: "", l: "— " + t("none") + " —" }, ...Data.all("contacts").map((c) => ({ v: c.id, l: Data.contactName(c) }))];
  const ctSel = (F.contact_id = h("select", { class: "input" }, ctOpts.map((o) => h("option", { value: o.v, selected: o.v === (tk.contact_id || "") }, o.l))));
  const dealOpts = [{ v: "", l: "— " + t("none") + " —" }, ...Data.all("deals").map((d) => ({ v: d.id, l: d.title }))];
  const dealSel = (F.deal_id = h("select", { class: "input" }, dealOpts.map((o) => h("option", { value: o.v, selected: o.v === (tk.deal_id || "") }, o.l))));

  const form = h("div", {}, [
    field(t("taskTitle"), inp("title")),
    h("div", { class: "row" }, [field(t("actions"), kindSel), field(t("dueDate"), inp("due_date", { type: "date" }))]),
    field(t("relatedTo") + " · " + t("contact"), ctSel),
    field(t("relatedTo") + " · " + t("deal"), dealSel),
    isNew ? null : h("button", { class: "btn btn--danger btn--sm", style: "margin-top:12px", onClick: async () => {
      if (await U.confirmDelete()) { await Data.remove("tasks", tk.id); U.toast(t("deleted")); document.querySelector(".modal-backdrop").click(); Router.rerender(); }
    } }, "🗑 " + t("delete")),
  ]);

  U.modal(isNew ? t("newTask") : tk.title, form, {
    saveText: t("save"),
    async onSave() {
      const payload = {
        title: F.title.value.trim(), kind: F.kind.value, due_date: F.due_date.value || null,
        contact_id: F.contact_id.value || null, deal_id: F.deal_id.value || null,
        done: !!tk.done,
      };
      if (!payload.title) { U.toast(t("taskTitle") + "?", true); return false; }
      if (isNew) await Data.create("tasks", payload); else await Data.update("tasks", tk.id, payload);
      U.toast(t("saved")); Router.rerender();
    },
  });
}
