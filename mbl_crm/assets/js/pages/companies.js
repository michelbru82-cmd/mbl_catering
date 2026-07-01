/* Companies — list, detail (contacts + deals), AI enrichment popup */
PAGES.companies = {
  icon: "🏢", title: () => I18N.t("companies"),
  render(view, params) {
    if (params && params[0]) return companyDetail(view, params[0]);
    return companyList(view);
  },
};

function companyList(view) {
  const t = I18N.t.bind(I18N), h = U.h;
  let q = "";
  const search = h("input", { class: "input search", placeholder: t("search"), oninput: U.debounce((e) => { q = e.target.value.toLowerCase(); draw(); }) });
  view.appendChild(h("div", { class: "toolbar" }, [
    search, h("span", { class: "muted small", id: "co-count" }),
    h("div", { style: "flex:1" }),
    h("button", { class: "btn btn--primary", onClick: () => companyForm(null) }, "＋ " + t("add")),
  ]));
  const host = h("div", {}); view.appendChild(host);

  function draw() {
    let list = Data.all("companies").slice();
    if (q) list = list.filter((c) => (c.name + " " + (c.industry || "") + " " + (c.country || "")).toLowerCase().includes(q));
    list.sort((a, b) => a.name.localeCompare(b.name));
    document.getElementById("co-count").textContent = list.length + " / " + Data.all("companies").length;
    host.innerHTML = "";
    if (!list.length) { host.appendChild(CRM.empty()); return; }
    const tbl = h("table", { class: "data" });
    tbl.appendChild(h("thead", {}, h("tr", {}, [
      h("th", {}, t("companyName")), h("th", {}, t("industry")), h("th", {}, t("size")),
      h("th", {}, t("country")), h("th", { class: "num" }, t("linkedContacts")), h("th", { class: "num" }, t("openDeals")), h("th", {}, ""),
    ])));
    const tb = h("tbody", {});
    list.forEach((c) => {
      const nContacts = Data.contactsOfCompany(c.id).length;
      const nDeals = Data.dealsOfCompany(c.id).filter((d) => d.stage !== "won" && d.stage !== "lost").length;
      tb.appendChild(h("tr", { class: "clickable", onClick: () => Router.go("#/companies/" + c.id) }, [
        h("td", {}, h("b", {}, c.name)),
        h("td", { class: "small" }, c.industry || "—"),
        h("td", { class: "small" }, c.size || "—"),
        h("td", { class: "small" }, c.country || "—"),
        h("td", { class: "num" }, String(nContacts)),
        h("td", { class: "num" }, String(nDeals)),
        h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); companyForm(c); } }, "✏️")),
      ]));
    });
    tbl.appendChild(tb);
    host.appendChild(h("div", { class: "table-wrap" }, tbl));
  }
  draw();
}

function companyDetail(view, id) {
  const t = I18N.t.bind(I18N), h = U.h;
  const c = Data.get("companies", id);
  if (!c) { view.appendChild(CRM.empty("Company not found")); return; }

  Router.setActions([
    h("button", { class: "btn btn--sm", onClick: () => Router.go("#/companies") }, "← " + t("back")),
    h("button", { class: "btn btn--sm btn--accent", onClick: () => enrichModal(c) }, "✨ " + t("enrich")),
    h("button", { class: "btn btn--sm btn--primary", onClick: () => companyForm(c) }, "✏️ " + t("edit")),
  ]);

  const grid = h("div", { class: "detail-grid" });
  const kv = (label, val) => val ? [h("dt", {}, label), h("dd", {}, val)] : [];
  const left = h("div", { class: "detail-card" }, [
    h("div", { class: "detail-head" }, [
      h("span", { class: "avatar avatar--lg", style: "background:var(--brand-accent)" }, (c.name || "?")[0]),
      h("div", { class: "who" }, [h("b", {}, c.name), h("div", { class: "muted small" }, [c.industry, c.size].filter(Boolean).join(" · "))]),
    ]),
    h("dl", { class: "kv" }, [
      ...kv(t("industry"), c.industry),
      ...kv(t("size"), c.size),
      ...kv(t("companyWebsite"), c.website ? CRM.link("url", c.website) : null),
      ...kv(t("companyPhone"), c.phone ? CRM.link("tel", c.phone) : null),
      ...kv(t("companyAddress"), c.address),
      ...kv(t("country"), c.country),
      ...kv(t("linkedin"), c.linkedin ? CRM.link("url", c.linkedin) : null),
    ]),
    c.description ? h("p", { style: "margin-top:12px" }, c.description) : null,
    h("div", { class: "banner banner--info", style: "margin-top:14px" }, [h("span", {}, "✨"), h("div", { class: "small" }, t("enrichHint"))]),
  ]);
  grid.appendChild(left);

  const right = h("div", {});
  // contacts here
  const contacts = Data.contactsOfCompany(id);
  const cc = h("div", { class: "detail-card", style: "margin-bottom:16px" }, [
    h("div", { class: "section-head" }, [h("h2", {}, t("linkedContacts") + " (" + contacts.length + ")"), h("div", { class: "spacer" }),
      h("button", { class: "btn btn--sm", onClick: () => contactForm({ company_id: id, status: "lead", rating: "medium", tags: [], owner: "Michel" }) }, "＋")]),
  ]);
  if (!contacts.length) cc.appendChild(h("p", { class: "muted small" }, t("nothingHere")));
  contacts.forEach((ct) => cc.appendChild(h("div", { class: "cell-name", style: "padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer", onClick: () => Router.go("#/contacts/" + ct.id) }, [
    CRM.avatar(ct, "avatar--sm"),
    h("div", { style: "flex:1;min-width:0" }, [h("b", {}, Data.contactName(ct)), h("div", { class: "muted small" }, ct.job_title || "")]),
    CRM.status(ct.status),
  ])));
  right.appendChild(cc);

  // deals
  const deals = Data.dealsOfCompany(id);
  if (deals.length) {
    const dc = h("div", { class: "detail-card" }, [h("div", { class: "section-head" }, [h("h2", {}, t("deals"))])]);
    deals.forEach((d) => dc.appendChild(h("div", { class: "cell-name", style: "padding:8px 0;border-bottom:1px solid var(--border)" }, [
      h("div", { style: "flex:1" }, [h("b", {}, d.title), h("div", { class: "muted small" }, t("stg_" + d.stage))]),
      h("span", {}, CRM.money(d.value)),
    ])));
    right.appendChild(dc);
  }
  grid.appendChild(right);
  view.appendChild(grid);
}

/* ---- AI enrichment popup ---- */
function enrichModal(c) {
  const t = I18N.t.bind(I18N), h = U.h;
  const body = h("div", {}, [
    h("div", { style: "display:flex;align-items:center;gap:10px;padding:20px 0" }, [
      h("span", { class: "spinner" }), h("span", { class: "muted" }, t("enriching")),
    ]),
  ]);
  U.modal("✨ " + c.name + " — " + t("aiCompanyInfo"), body, { hideCancel: false, cancelText: t("close") });

  AI.enrichCompany(c.name, c.website).then((info) => {
    body.innerHTML = "";
    if (info._mock) body.appendChild(h("div", { class: "banner", style: "margin-bottom:14px" }, [h("span", {}, "ℹ️"), h("div", { class: "small" }, info.description)]));
    const kv = (label, val) => val ? [h("dt", {}, label), h("dd", {}, val)] : [];
    body.appendChild(h("dl", { class: "kv" }, [
      ...kv(t("industry"), info.industry),
      ...kv(t("size"), info.size),
      ...kv(t("headquarters"), info.headquarters),
      ...kv(t("founded"), info.founded),
      ...kv(t("revenue"), info.revenue),
      ...kv(t("companyWebsite"), info.website ? CRM.link("url", info.website) : null),
    ]));
    if (info.description && !info._mock) body.appendChild(h("p", { style: "margin-top:12px" }, info.description));
    if (info.key_people && info.key_people.length) {
      body.appendChild(h("h3", { style: "margin-top:16px;font-size:14px" }, t("keyPeople")));
      body.appendChild(h("ul", {}, info.key_people.map((p) => h("li", {}, typeof p === "string" ? p : [p.name, p.title].filter(Boolean).join(" — ")))));
    }
    if (info.recent_news && info.recent_news.length) {
      body.appendChild(h("h3", { style: "margin-top:16px;font-size:14px" }, t("recentNews")));
      body.appendChild(h("ul", {}, info.recent_news.map((n) => h("li", {}, typeof n === "string" ? n : h("a", { href: n.url || "#", target: "_blank", rel: "noopener" }, n.title || n.url)))));
    }
    // offer to save useful fields onto the company
    const patch = {};
    ["industry", "size", "website", "description"].forEach((k) => { if (info[k] && !c[k]) patch[k] = info[k]; });
    if (Object.keys(patch).length) {
      body.appendChild(h("button", { class: "btn btn--primary btn--sm", style: "margin-top:16px", onClick: async () => {
        await Data.update("companies", c.id, patch); U.toast(t("saved"));
        document.querySelector(".modal-backdrop").click(); Router.rerender();
      } }, "⤓ " + t("save") + " → " + t("company")));
    }
  }).catch((e) => {
    body.innerHTML = "";
    body.appendChild(h("div", { class: "banner banner--allergen" }, [h("span", {}, "⚠️"), h("div", {}, String(e && e.message || e))]));
  });
}

/* ---- add / edit company ---- */
function companyForm(c) {
  const t = I18N.t.bind(I18N), h = U.h;
  const isNew = !c;
  c = c || {};
  const F = {};
  const inp = (name, attrs) => (F[name] = h("input", Object.assign({ class: "input", value: c[name] || "" }, attrs || {})));
  const field = (label, el) => h("div", { class: "field" }, [h("label", {}, label), el]);
  const form = h("div", {}, [
    field(t("companyName"), inp("name")),
    h("div", { class: "row" }, [field(t("industry"), inp("industry")), field(t("size"), inp("size"))]),
    h("div", { class: "row" }, [field(t("companyWebsite"), inp("website")), field(t("companyPhone"), inp("phone"))]),
    field(t("companyAddress"), inp("address")),
    h("div", { class: "row" }, [field(t("country"), inp("country")), field(t("linkedin"), inp("linkedin"))]),
    field(t("description"), (F.description = h("textarea", { class: "input", rows: 3 }, c.description || ""))),
    isNew ? null : h("button", { class: "btn btn--danger btn--sm", style: "margin-top:12px", onClick: async () => {
      if (await U.confirmDelete()) { await Data.remove("companies", c.id); U.toast(t("deleted")); document.querySelector(".modal-backdrop").click(); Router.go("#/companies"); }
    } }, "🗑 " + t("delete")),
  ]);
  U.modal(isNew ? t("add") + " · " + t("company") : c.name, form, {
    saveText: t("save"),
    async onSave() {
      const payload = {}; Object.keys(F).forEach((k) => { payload[k] = (F[k].value || "").trim() || null; });
      if (!payload.name) { U.toast(t("companyName") + "?", true); return false; }
      if (isNew) { const co = await Data.create("companies", payload); U.toast(t("saved")); Router.go("#/companies/" + co.id); }
      else { await Data.update("companies", c.id, payload); U.toast(t("saved")); Router.rerender(); }
    },
  });
}
