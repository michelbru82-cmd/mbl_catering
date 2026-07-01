/* Contacts — list, full detail view, add/edit form, activity logging */
PAGES.contacts = {
  icon: "👤", title: () => I18N.t("contacts"),
  render(view, params) {
    if (params && params[0]) return contactDetail(view, params[0]);
    return contactList(view);
  },
};

/* ---------------- list ---------------- */
function contactList(view) {
  const t = I18N.t.bind(I18N), h = U.h;
  let q = "", status = "", tag = "";

  const search = h("input", { class: "input search", placeholder: t("search"), oninput: U.debounce((e) => { q = e.target.value.toLowerCase(); draw(); }) });
  const statusSel = h("select", { class: "input", onChange: (e) => { status = e.target.value; draw(); } },
    [h("option", { value: "" }, t("status") + ": " + t("all")),
     ...["lead", "prospect", "customer", "partner", "lost"].map((s) => h("option", { value: s }, t("st_" + s)))]);

  const allTags = [...new Set(Data.all("contacts").flatMap((c) => c.tags || []))].sort();
  const tagSel = h("select", { class: "input", onChange: (e) => { tag = e.target.value; draw(); } },
    [h("option", { value: "" }, t("tags") + ": " + t("all")), ...allTags.map((tg) => h("option", { value: tg }, tg))]);

  view.appendChild(h("div", { class: "toolbar" }, [
    search, statusSel, tagSel, h("span", { class: "muted small", id: "ct-count" }),
    h("div", { style: "flex:1" }),
    h("button", { class: "btn btn--accent", onClick: () => Router.go("#/cardscan") }, "📇 " + t("cardscan")),
    h("button", { class: "btn btn--primary", onClick: () => contactForm(null) }, "＋ " + t("add")),
  ]));
  const host = h("div", {}); view.appendChild(host);

  function draw() {
    let list = Data.all("contacts").slice();
    if (status) list = list.filter((c) => c.status === status);
    if (tag) list = list.filter((c) => (c.tags || []).includes(tag));
    if (q) list = list.filter((c) => {
      const co = Data.companyOf(c);
      return (Data.contactName(c) + " " + (c.job_title || "") + " " + (co ? co.name : "") + " " +
        (c.email_work || "") + " " + (c.email_home || "") + " " + (c.where_met || "")).toLowerCase().includes(q);
    });
    list.sort((a, b) => Data.contactName(a).localeCompare(Data.contactName(b)));
    document.getElementById("ct-count").textContent = list.length + " / " + Data.all("contacts").length;
    host.innerHTML = "";
    if (!list.length) { host.appendChild(CRM.empty()); return; }

    const tbl = h("table", { class: "data" });
    tbl.appendChild(h("thead", {}, h("tr", {}, [
      h("th", {}, t("fullName")), h("th", {}, t("company")), h("th", {}, t("jobTitle")),
      h("th", {}, t("status")), h("th", {}, t("nextFollowUp")), h("th", {}, t("grpComms")), h("th", {}, ""),
    ])));
    const tb = h("tbody", {});
    list.forEach((c) => {
      const co = Data.companyOf(c);
      tb.appendChild(h("tr", { class: "clickable", onClick: () => Router.go("#/contacts/" + c.id) }, [
        h("td", {}, h("div", { class: "cell-name" }, [CRM.avatar(c, "avatar--sm"), h("b", {}, Data.contactName(c))])),
        h("td", {}, co ? co.name : "—"),
        h("td", { class: "small" }, c.job_title || "—"),
        h("td", {}, CRM.status(c.status)),
        h("td", {}, CRM.followupBadge(c.next_follow_up)),
        h("td", {}, CRM.channels(c)),
        h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); contactForm(c); } }, "✏️")),
      ]));
    });
    tbl.appendChild(tb);
    host.appendChild(h("div", { class: "table-wrap" }, tbl));
  }
  draw();
}

/* ---------------- detail ---------------- */
function contactDetail(view, id) {
  const t = I18N.t.bind(I18N), h = U.h;
  const c = Data.get("contacts", id);
  if (!c) { view.appendChild(CRM.empty("Contact not found")); return; }
  const co = Data.companyOf(c);

  Router.setActions([
    h("button", { class: "btn btn--sm", onClick: () => Router.go("#/contacts") }, "← " + t("back")),
    h("button", { class: "btn btn--sm btn--primary", onClick: () => contactForm(c) }, "✏️ " + t("edit")),
  ]);

  const grid = h("div", { class: "detail-grid" });

  /* left: identity + fields */
  const kv = (label, val) => val ? [h("dt", {}, label), h("dd", {}, val)] : [];
  const info = h("dl", { class: "kv" }, [
    ...kv(t("jobTitle"), c.job_title),
    ...kv(t("department"), c.department),
    ...kv(t("company"), co ? h("a", { href: "#/companies/" + co.id }, co.name) : null),
    ...kv(t("emailWork"), c.email_work ? CRM.link("email", c.email_work) : null),
    ...kv(t("emailHome"), c.email_home ? CRM.link("email", c.email_home) : null),
    ...kv(t("phoneMobile"), c.phone_mobile ? CRM.link("tel", c.phone_mobile) : null),
    ...kv(t("phoneWork"), c.phone_work ? CRM.link("tel", c.phone_work) : null),
    ...kv(t("website"), c.website ? CRM.link("url", c.website) : null),
    ...kv(t("addressWork"), c.address_work),
    ...kv(t("addressHome"), c.address_home),
    ...kv(t("city"), [c.city, c.country].filter(Boolean).join(", ")),
    ...kv(t("whereMet"), c.where_met),
    ...kv(t("source"), c.source),
    ...kv(t("owner"), c.owner),
    ...kv(t("language"), c.language),
    ...kv(t("lastContacted"), c.last_contacted ? U.fmtDate(c.last_contacted) : null),
    ...kv(t("nextFollowUp"), c.next_follow_up ? CRM.followupBadge(c.next_follow_up) : null),
    ...kv(t("createdAt"), c.created_at ? U.fmtDate(c.created_at) : null),
  ]);

  const left = h("div", { class: "detail-card" }, [
    h("div", { class: "detail-head" }, [
      CRM.avatar(c, "avatar--lg"),
      h("div", { class: "who" }, [
        h("b", {}, Data.contactName(c)),
        h("div", { class: "muted small" }, [co ? co.name : "", c.job_title ? " · " + c.job_title : ""].join("")),
        h("div", { style: "margin-top:6px;display:flex;gap:6px;flex-wrap:wrap" }, [CRM.status(c.status), ...(c.tags || []).map((tg) => h("span", { class: "tag" }, tg))]),
      ]),
    ]),
    (c.line || c.whatsapp || c.wechat || c.linkedin || c.telegram || c.facebook || c.instagram || c.x)
      ? h("div", { style: "margin-bottom:12px" }, CRM.channels(c)) : null,
    info,
    c.notes ? h("div", { style: "margin-top:12px" }, [h("div", { class: "kv" }, [h("dt", {}, t("notes")), h("dd", {}, c.notes)])]) : null,
  ]);
  grid.appendChild(left);

  /* right: activity + tasks + deals */
  const right = h("div", {});

  // action buttons
  right.appendChild(h("div", { class: "detail-card", style: "margin-bottom:16px" }, [
    h("div", { class: "section-head" }, [h("h2", {}, t("grpActivity")),
      h("div", { class: "spacer" }),
      h("button", { class: "btn btn--sm btn--primary", onClick: () => logActivityModal(c) }, "＋ " + t("logActivity")),
    ]),
    activityTimeline(c.id),
  ]));

  // related tasks
  const tasks = Data.tasksFor(c.id).sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
  const taskCard = h("div", { class: "detail-card", style: "margin-bottom:16px" }, [
    h("div", { class: "section-head" }, [h("h2", {}, t("tasks")),
      h("div", { class: "spacer" }),
      h("button", { class: "btn btn--sm", onClick: () => taskForm({ contact_id: c.id }) }, "＋ " + t("add")),
    ]),
  ]);
  if (!tasks.length) taskCard.appendChild(h("p", { class: "muted small" }, t("nothingHere")));
  tasks.forEach((tk) => taskCard.appendChild(taskRow(tk, () => Router.rerender())));
  right.appendChild(taskCard);

  // related deals
  const deals = Data.all("deals").filter((d) => d.contact_id === c.id);
  if (deals.length) {
    const dc = h("div", { class: "detail-card" }, [h("div", { class: "section-head" }, [h("h2", {}, t("deals"))])]);
    deals.forEach((d) => dc.appendChild(h("div", { class: "cell-name", style: "padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer", onClick: () => Router.go("#/deals") }, [
      h("div", { style: "flex:1" }, [h("b", {}, d.title), h("div", { class: "muted small" }, t("stg_" + d.stage))]),
      h("span", {}, CRM.money(d.value)),
    ])));
    right.appendChild(dc);
  }

  grid.appendChild(right);
  view.appendChild(grid);
}

function activityTimeline(contactId) {
  const h = U.h, t = I18N.t.bind(I18N);
  const acts = Data.activitiesFor(contactId);
  if (!acts.length) return h("p", { class: "muted small" }, t("nothingHere"));
  const ul = h("ul", { class: "timeline" });
  acts.forEach((a) => {
    ul.appendChild(h("li", {}, [
      h("span", { class: "tl-kind" }, iconForKind(a.kind) + " " + t("ac_" + (a.kind || "note"))),
      a.note ? h("div", { class: "small" }, a.note) : null,
      h("div", { class: "tl-when" }, U.fmtDate(a.at, true)),
    ]));
  });
  return ul;
}
function iconForKind(k) { return ({ note: "📝", call: "📞", email: "✉️", meeting: "🤝", created: "✨", card: "📇" })[k] || "•"; }

/* ---------------- log activity (+ optional follow-up) ---------------- */
function logActivityModal(c) {
  const t = I18N.t.bind(I18N), h = U.h;
  const kindSel = h("select", { class: "input" }, ["note", "call", "email", "meeting"].map((k) => h("option", { value: k }, t("ac_" + k))));
  const note = h("textarea", { class: "input", rows: 3, placeholder: t("activityNote") });
  const nextFu = h("input", { class: "input", type: "date", value: "" });
  U.modal(t("logActivity") + " · " + Data.contactName(c), h("div", {}, [
    h("div", { class: "field" }, [h("label", {}, t("actions")), kindSel]),
    h("div", { class: "field" }, [h("label", {}, t("activityNote")), note]),
    h("div", { class: "field" }, [h("label", {}, t("nextFollowUp") + " (" + t("optional") + ")"), nextFu]),
  ]), {
    saveText: t("save"),
    async onSave() {
      await Data.logActivity(c.id, kindSel.value, note.value.trim());
      const patch = { last_contacted: U.TODAY };
      // logging an interaction clears/advances the follow-up
      patch.next_follow_up = nextFu.value || null;
      await Data.update("contacts", c.id, patch);
      U.toast(t("saved")); Router.rerender();
    },
  });
}

/* ---------------- add / edit form ---------------- */
function contactForm(c) {
  const t = I18N.t.bind(I18N), h = U.h;
  const isNew = !c;
  c = c || { status: "lead", rating: "medium", tags: [], owner: "Michel", language: I18N.lang };

  const F = {}; // field name -> input element
  const inp = (name, attrs) => (F[name] = h("input", Object.assign({ class: "input", value: c[name] || "" }, attrs || {})));
  const sel = (name, opts, cur) => (F[name] = h("select", { class: "input" }, opts.map((o) => h("option", { value: o.v, selected: o.v === (cur || "") }, o.l))));

  const companyOpts = [{ v: "", l: "— " + t("none") + " —" }, ...Data.all("companies").sort((a, b) => a.name.localeCompare(b.name)).map((co) => ({ v: co.id, l: co.name }))];
  const compSel = sel("company_id", companyOpts, c.company_id);
  const newCompName = h("input", { class: "input", placeholder: t("companyName") + " (" + t("add") + ")" });

  const tagsInput = h("input", { class: "input", value: (c.tags || []).join(", "), placeholder: "VIP, Supplier, …" });

  const group = (label, rows) => h("div", {}, [h("h3", { style: "font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-soft);margin:16px 0 8px" }, label), ...rows]);
  const row = (arr) => h("div", { class: "row" }, arr);
  const field = (label, el) => h("div", { class: "field" }, [h("label", {}, label), el]);

  const form = h("div", {}, [
    group(t("grpIdentity"), [
      row([field(t("firstName"), inp("first_name")), field(t("lastName"), inp("last_name"))]),
      field(t("fullName") + " (" + t("optional") + ")", inp("full_name", { placeholder: "Auto from first + last" })),
      row([field(t("jobTitle"), inp("job_title")), field(t("department"), inp("department"))]),
      field(t("company"), compSel),
      field("＋ " + t("companyName"), newCompName),
      field(t("photo") + " URL (" + t("optional") + ")", inp("photo")),
    ]),
    group(t("grpComms"), [
      row([field(t("emailWork"), inp("email_work", { type: "email" })), field(t("emailHome"), inp("email_home", { type: "email" }))]),
      row([field(t("phoneMobile"), inp("phone_mobile")), field(t("phoneWork"), inp("phone_work"))]),
      row([field(t("line"), inp("line")), field(t("whatsapp"), inp("whatsapp")), field(t("wechat"), inp("wechat"))]),
      row([field(t("telegram"), inp("telegram")), field(t("website"), inp("website"))]),
    ]),
    group(t("grpSocial"), [
      row([field(t("linkedin"), inp("linkedin")), field(t("facebook"), inp("facebook"))]),
      row([field(t("instagram"), inp("instagram")), field(t("x"), inp("x"))]),
    ]),
    group(t("grpAddr"), [
      field(t("addressWork"), inp("address_work")),
      field(t("addressHome"), inp("address_home")),
      row([field(t("city"), inp("city")), field(t("country"), inp("country"))]),
    ]),
    group(t("grpRel"), [
      row([
        field(t("status"), sel("status", ["lead", "prospect", "customer", "partner", "lost"].map((s) => ({ v: s, l: t("st_" + s) })), c.status)),
        field(t("rating"), sel("rating", ["low", "medium", "high"].map((r) => ({ v: r, l: t("pr_" + r) })), c.rating)),
      ]),
      row([field(t("whereMet"), inp("where_met")), field(t("source"), inp("source"))]),
      row([field(t("owner"), inp("owner")), field(t("language"), inp("language"))]),
      field(t("tags"), tagsInput),
      row([field(t("lastContacted"), inp("last_contacted", { type: "date" })), field(t("nextFollowUp"), inp("next_follow_up", { type: "date" }))]),
      field(t("notes"), (F.notes = h("textarea", { class: "input", rows: 3 }, c.notes || ""))),
    ]),
    isNew ? null : h("button", { class: "btn btn--danger btn--sm", style: "margin-top:14px", onClick: async () => {
      if (await U.confirmDelete()) { await Data.remove("contacts", c.id); U.toast(t("deleted")); document.querySelector(".modal-backdrop").click(); Router.go("#/contacts"); }
    } }, "🗑 " + t("delete")),
  ]);

  U.modal(isNew ? t("newContact") : Data.contactName(c), form, {
    wide: true, saveText: t("save"),
    async onSave() {
      const payload = {};
      Object.keys(F).forEach((k) => { payload[k] = (F[k].value || "").trim() || null; });
      payload.tags = tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean);
      if (!payload.full_name) payload.full_name = [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim();
      if (!payload.full_name) { U.toast(t("fullName") + "?", true); return false; }
      // new company typed?
      if (newCompName.value.trim()) payload.company_id = await Data.ensureCompany(newCompName.value.trim());
      if (isNew) {
        const created = await Data.create("contacts", payload);
        await Data.logActivity(created.id, "created", "");
        U.toast(t("saved")); Router.go("#/contacts/" + created.id);
      } else {
        await Data.update("contacts", c.id, payload);
        U.toast(t("saved")); Router.rerender();
      }
    },
  });
}
