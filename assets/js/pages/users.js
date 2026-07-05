/* Users — admin-only. Invite users by email and choose which app sections
   each may use. Every user has their OWN isolated data (Supabase RLS by
   owner_id); section access is feature-gating on top of that. */
(function () {
  // Sections an admin can grant. Keys match PAGES / nav keys.
  const SECTION_KEYS = ["dashboard", "menu", "recipes", "ingredients", "production", "people",
    "printMenu", "labels", "allergenMatrix", "newsletter", "recipeCards", "priceList", "places", "allergens"];

  const sectionLabel = (key) => { const p = PAGES[key]; return (p && p.title) ? p.title() : (I18N.t(key) || key); };

  PAGES.users = {
    icon: "🔑", title: () => I18N.t("usersTitle"),
    render(view) {
      const t = I18N.t.bind(I18N), h = U.h;
      if (window.Auth && !Auth.isAdmin()) { view.appendChild(h("div", { class: "empty" }, t("notAdmin"))); return; }

      view.appendChild(h("p", { class: "small muted" }, t("usersIntro")));

      if (Data.source !== "supabase") {
        view.appendChild(h("div", { class: "banner banner--info" }, [h("span", {}, "☁️"), h("div", {}, t("usersNeedCloud"))]));
        return;
      }

      view.appendChild(h("div", { class: "toolbar" }, [
        h("div", { style: "flex:1" }),
        h("button", { class: "btn btn--primary", onClick: () => inviteModal(draw) }, "✉️ " + t("inviteUser")),
      ]));
      const host = h("div", {}); view.appendChild(host);

      let allRows = [], lastLogin = {}, sortBy = "email", sortDir = 1;
      const companyOf = (u) => u.company_official || u.company_trading || "";
      const secCount = (u) => u.role === "admin" ? 1e9 : (Array.isArray(u.sections) ? u.sections.length : SECTION_KEYS.length);

      async function draw() {
        host.innerHTML = "";
        host.appendChild(h("div", { class: "muted small" }, t("signin_loading")));
        const sb = Data.supaClient();
        try {
          const { data, error } = await sb.from("profiles").select("*").order("created_at", { ascending: true });
          if (error) throw error;
          allRows = data || [];
        } catch (e) {
          host.innerHTML = "";
          host.appendChild(h("div", { class: "banner banner--allergen" }, [h("span", {}, "⚠"), h("div", {}, t("usersLoadFail") + " " + (e.message || ""))]));
          return;
        }
        // last sign-in per user (from the activity log's login events)
        lastLogin = {};
        try {
          const { data } = await sb.from("activity_log").select("actor_id,occurred_at").eq("action", "login").order("occurred_at", { ascending: false }).limit(3000);
          (data || []).forEach((r) => { if (r.actor_id && !lastLogin[r.actor_id]) lastLogin[r.actor_id] = r.occurred_at; });
        } catch (e) { /* log may not exist yet */ }
        renderTable();
      }

      function renderTable() {
        host.innerHTML = "";
        const cols = [
          { key: "email", label: t("emailAddr"), sort: (u) => (u.email || u.id).toLowerCase(),
            cell: (u, me) => h("td", {}, [h("b", {}, u.email || u.id), me ? h("span", { class: "badge", style: "margin-left:6px" }, t("you")) : null, u.account_id ? h("span", { class: "badge", style: "margin-left:6px", title: t("linkedEmails") }, "👥") : null]) },
          { key: "company", label: t("companyName"), sort: (u) => companyOf(u).toLowerCase(),
            cell: (u) => h("td", { class: "small" }, companyOf(u) || h("span", { class: "muted" }, "—")) },
          { key: "role", label: t("role"), sort: (u) => (u.role === "admin" ? 0 : 1),
            cell: (u) => h("td", {}, [h("span", { class: "badge" }, u.role === "admin" ? t("roleAdmin") : t("roleUser")), u.pro && u.role !== "admin" ? h("span", { class: "badge badge--ok", style: "margin-left:4px" }, t("proBadge")) : null]) },
          { key: "sections", label: t("sectionsLabel"), sort: (u) => secCount(u),
            cell: (u) => h("td", { class: "small" }, u.role === "admin" ? t("allSections") : (Array.isArray(u.sections) ? u.sections.length + " / " + SECTION_KEYS.length : t("allSections"))) },
          { key: "lastlogin", label: t("lastLogin"), sort: (u) => lastLogin[u.id] || "",
            cell: (u) => h("td", { class: "small" }, lastLogin[u.id] ? fmtTime(lastLogin[u.id]) : h("span", { class: "muted" }, t("never"))) },
          { key: "active", label: t("active"), sort: (u) => (u.active === false ? 0 : 1),
            cell: (u) => h("td", {}, u.active === false ? h("span", { class: "badge badge--off" }, t("inactive")) : h("span", { class: "badge badge--ok" }, t("active"))) },
        ];
        const col = cols.find((c) => c.key === sortBy) || cols[0];
        const sorted = allRows.slice().sort((a, b) => { const va = col.sort(a), vb = col.sort(b); return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir; });
        const arrow = (k) => sortBy === k ? (sortDir === 1 ? " ▲" : " ▼") : "";
        const onHead = (k) => () => { if (sortBy === k) sortDir = -sortDir; else { sortBy = k; sortDir = 1; } renderTable(); };
        const tbl = h("table", { class: "data" });
        tbl.appendChild(h("thead", {}, h("tr", {}, [
          ...cols.map((c) => h("th", { style: "cursor:pointer;user-select:none", onClick: onHead(c.key) }, c.label + arrow(c.key))),
          h("th", {}, ""),
        ])));
        const tb = h("tbody", {});
        sorted.forEach((u) => {
          const isMe = Auth.profile && Auth.profile.id === u.id;
          tb.appendChild(h("tr", { class: "clickable", onClick: () => userModal(u, draw) }, [
            ...cols.map((c) => c.cell(u, isMe)),
            h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); userModal(u, draw); } }, "✏️")),
          ]));
        });
        tbl.appendChild(tb);
        host.appendChild(h("div", { class: "small muted", style: "margin-bottom:6px" }, allRows.length + " · " + t("sortHint")));
        host.appendChild(h("div", { class: "table-wrap" }, tbl));
      }
      draw();
    },
  };

  // Section chip grid. `selected` = array of keys, or null for "all".
  function sectionPicker(selected) {
    const h = U.h;
    const set = new Set(Array.isArray(selected) ? selected : SECTION_KEYS);
    const wrap = h("div", { class: "pill-list", style: "gap:6px" });
    SECTION_KEYS.forEach((key) => {
      const pill = h("button", { type: "button", class: "badge" + (set.has(key) ? " badge--allergen" : ""), style: "cursor:pointer", onClick: () => {
        if (set.has(key)) set.delete(key); else set.add(key);
        pill.className = "badge" + (set.has(key) ? " badge--allergen" : "");
      } }, sectionLabel(key));
      wrap.appendChild(pill);
    });
    wrap._get = () => SECTION_KEYS.filter((k) => set.has(k));
    return wrap;
  }

  function selectAllBtns(picker) {
    const t = I18N.t.bind(I18N), h = U.h;
    const setAll = (on) => picker.querySelectorAll("button.badge").forEach((pill, i) => {
      const isOn = pill.className.indexOf("badge--allergen") !== -1;
      if (isOn !== on) pill.click();
    });
    return h("div", { style: "display:flex;gap:8px;margin-bottom:8px" }, [
      h("button", { class: "btn btn--sm", type: "button", onClick: () => setAll(true) }, t("selectAll")),
      h("button", { class: "btn btn--sm", type: "button", onClick: () => setAll(false) }, t("clearSel")),
    ]);
  }

  // Company legal-identity inputs (official name / trading name / representative
  // / tax number). Stored on the user's profile; shown to them read-only.
  const COMPANY_KEYS = ["company_official", "company_trading", "company_rep", "company_tax"];
  function companyFields(u) {
    const h = U.h;
    const f = {};
    COMPANY_KEYS.forEach((k) => (f[k] = h("input", { class: "input", value: u && u[k] != null ? u[k] : "" })));
    f._get = () => { const o = {}; COMPANY_KEYS.forEach((k) => (o[k] = f[k].value.trim())); return o; };
    return f;
  }
  function companySection(co) {
    const t = I18N.t.bind(I18N), h = U.h;
    const fld = (label, node) => h("div", { class: "field" }, [h("label", {}, label), node]);
    return h("div", {}, [
      h("div", { class: "small muted", style: "margin:6px 0 2px;font-weight:600" }, "🏢 " + t("companyInfo")),
      h("div", { class: "row" }, [fld(t("companyOfficial"), co.company_official), fld(t("companyTrading"), co.company_trading)]),
      h("div", { class: "row" }, [fld(t("companyRep"), co.company_rep), fld(t("taxNumber"), co.company_tax)]),
    ]);
  }

  function inviteModal(onDone) {
    const t = I18N.t.bind(I18N), h = U.h;
    const email = h("input", { class: "input", type: "email", placeholder: "user@email.com" });
    const picker = sectionPicker(null);
    const co = companyFields({});
    // Workspace choice: a brand-new private workspace, or share an existing user's.
    const userSel = h("select", { class: "input" }, [h("option", { value: "" }, t("signin_loading"))]);
    const shareField = h("div", { class: "field", style: "display:none" }, [h("label", {}, t("wsShareWith")), userSel, h("div", { class: "small muted", style: "margin-top:4px" }, t("wsShareHint"))]);
    const sectionsField = h("div", { class: "field" }, [h("label", {}, t("sectionsLabel")), selectAllBtns(picker), picker]);
    const companyEl = companySection(co);
    const modeSel = h("select", { class: "input", onChange: () => applyMode() }, [
      h("option", { value: "separate", selected: true }, t("wsSeparate")),
      h("option", { value: "share" }, t("wsShare")),
    ]);
    function applyMode() {
      const share = modeSel.value === "share";
      shareField.style.display = share ? "" : "none";
      sectionsField.style.display = share ? "none" : "";
      companyEl.style.display = share ? "none" : "";
    }
    // populate the "share with" dropdown from existing users
    (async () => {
      try {
        const sb = Data.supaClient();
        const { data } = await sb.from("profiles").select("id,email").order("email", { ascending: true });
        userSel.innerHTML = "";
        (data || []).forEach((u) => userSel.appendChild(h("option", { value: u.id }, u.email || u.id)));
        if (!(data || []).length) userSel.appendChild(h("option", { value: "" }, "—"));
      } catch (e) { userSel.innerHTML = ""; userSel.appendChild(h("option", { value: "" }, "—")); }
    })();
    const body = h("div", {}, [
      h("p", { class: "small muted" }, t("inviteIntro")),
      h("div", { class: "field" }, [h("label", {}, t("emailAddr")), email]),
      h("div", { class: "field" }, [h("label", {}, "👥 " + t("wsAccess")), modeSel]),
      shareField,
      companyEl,
      sectionsField,
    ]);
    U.modal("✉️ " + t("inviteUser"), body, {
      saveText: t("sendInvite"),
      async onSave() {
        const e = (email.value || "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { U.toast(t("badEmail"), true); return false; }
        try {
          if (modeSel.value === "share") {
            const primary = userSel.value;
            if (!primary) { U.toast(t("wsShareWith") + "?", true); return false; }
            await invokeInvite({ action: "add_member", primary_id: primary, email: e, redirectTo: location.origin + location.pathname });
          } else {
            await invokeInvite(Object.assign({ email: e, sections: picker._get(), redirectTo: location.origin + location.pathname }, co._get()));
          }
          U.toast(t("inviteSent"));
          if (onDone) onDone();
        } catch (err) { U.toast(err.message || t("inviteFailed"), true); return false; }
      },
    });
  }

  const fmtTime = (iso) => { try { const d = new Date(iso); return d.toLocaleString(I18N.lang === "zh" ? "zh-TW" : "en-GB", { year: "2-digit", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; } };
  const actionLabel = (a) => { const t = I18N.t.bind(I18N); return ({ create: t("actCreate"), update: t("actUpdate"), delete: t("actDelete"), login: t("actLogin"), generate_menu: t("actGenerate") })[a] || a; };

  async function invokeInvite(body) {
    const t = I18N.t.bind(I18N);
    const sb = Data.supaClient();
    const res = await sb.functions.invoke("admin-invite", { body });
    let resp = res.data;
    if (res.error && res.error.context && typeof res.error.context.json === "function") { try { resp = await res.error.context.json(); } catch (x) {} }
    if (!resp || resp.ok !== true) {
      const map = { forbidden: t("errForbidden"), already_exists: t("errAlreadyExists"), bad_email: t("badEmail"), not_found: t("errNotFound"), cannot_delete_self: t("cannotDeleteSelf"), already_active: t("errAlreadyActive") };
      throw new Error((resp && map[resp.error]) || t("inviteFailed"));
    }
    return resp;
  }

  // Remove a login (data is kept — the Edge Function reassigns it to the admin).
  async function deleteUser(u, onDone) {
    const t = I18N.t.bind(I18N);
    try { await invokeInvite({ action: "delete", user_id: u.id }); U.toast(t("accessRemoved")); if (onDone) onDone(); }
    catch (err) { U.toast(err.message || t("deleteFailed"), true); }
  }

  // Shared access: list the emails that sign in to this same workspace, plus an
  // "add email" control (each added email shares the primary account's data).
  function sharedAccessSection(u, onReload) {
    const t = I18N.t.bind(I18N), h = U.h;
    const account = u.account_id || u.id;
    const listBox = h("div", {});
    async function drawList() {
      listBox.innerHTML = ""; listBox.appendChild(h("div", { class: "muted small" }, t("signin_loading")));
      const sb = Data.supaClient();
      let members = [];
      try { const { data } = await sb.from("profiles").select("id,email,active,account_id").or(`id.eq.${account},account_id.eq.${account}`); members = data || []; } catch (e) {}
      members.sort((a, b) => (a.id === account ? -1 : 1) - (b.id === account ? -1 : 1));
      listBox.innerHTML = "";
      members.forEach((m) => {
        const isPrimary = m.id === account;
        listBox.appendChild(h("div", { style: "display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)" }, [
          h("span", {}, m.email || m.id),
          isPrimary ? h("span", { class: "badge", style: "margin-left:2px" }, t("primaryAccount")) : null,
          m.active === false ? h("span", { class: "badge badge--off" }, t("inactive")) : null,
          h("div", { style: "flex:1" }),
          (isPrimary || (Auth.profile && Auth.profile.id === m.id)) ? null : h("button", { class: "btn btn--sm btn--danger", type: "button", onClick: async () => {
            if (!(await U.confirmDelete(t("removeAccessWarn").replace("{e}", m.email || m.id)))) return;
            await deleteUser(m, () => { drawList(); if (onReload) onReload(); });
          } }, "🗑"),
        ]));
      });
    }
    drawList();
    const addEmail = h("input", { class: "input", type: "email", placeholder: "colleague@email.com" });
    const addBtn = h("button", { class: "btn btn--sm btn--primary", type: "button", onClick: async () => {
      const e = (addEmail.value || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { U.toast(t("badEmail"), true); return; }
      addBtn.disabled = true; addBtn.textContent = t("signin_loading");
      try { await invokeInvite({ action: "add_member", primary_id: account, email: e, redirectTo: location.origin + location.pathname }); U.toast(t("inviteSent")); addEmail.value = ""; drawList(); if (onReload) onReload(); }
      catch (err) { U.toast(err.message || t("inviteFailed"), true); }
      addBtn.disabled = false; addBtn.textContent = "＋ " + t("addEmail");
    } }, "＋ " + t("addEmail"));
    return h("div", { class: "field" }, [
      h("label", {}, "👥 " + t("linkedEmails")),
      h("div", { class: "small muted", style: "margin-bottom:6px" }, t("linkedEmailsHint")),
      listBox,
      h("div", { style: "display:flex;gap:8px;margin-top:8px" }, [addEmail, addBtn]),
    ]);
  }

  // Activity history for one user (last 3 months): time · email · action · item.
  async function historyModal(u) {
    const t = I18N.t.bind(I18N), h = U.h;
    const sb = Data.supaClient();
    if (Data.pruneActivity) Data.pruneActivity();
    const box = h("div", {}, h("div", { class: "muted small" }, t("signin_loading")));
    U.modal("🕑 " + t("history") + " — " + (u.email || u.id), box, { wide: true, buttons: [{ label: t("close"), value: true }] });
    const since = new Date(Date.now() - 92 * 86400000).toISOString();
    let rows = [];
    try { const { data } = await sb.from("activity_log").select("*").eq("actor_id", u.id).gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(500); rows = data || []; } catch (e) {}
    box.innerHTML = "";
    box.appendChild(h("div", { class: "small muted", style: "margin-bottom:8px" }, t("historyHint")));
    if (!rows.length) { box.appendChild(h("p", { class: "muted" }, t("noHistory"))); return; }
    box.appendChild(h("div", { class: "table-wrap" }, h("table", { class: "data" }, [
      h("thead", {}, h("tr", {}, [h("th", {}, t("when")), h("th", {}, t("emailAddr")), h("th", {}, t("actionCol")), h("th", {}, t("itemCol"))])),
      h("tbody", {}, rows.map((r) => h("tr", {}, [
        h("td", { class: "small" }, fmtTime(r.occurred_at)),
        h("td", { class: "small" }, r.actor_email || "—"),
        h("td", {}, h("span", { class: "badge" }, actionLabel(r.action))),
        h("td", { class: "small" }, [r.entity ? h("span", { class: "muted" }, r.entity + " ") : null, r.label || ""]),
      ]))),
    ])));
  }

  function userModal(u, onDone) {
    const t = I18N.t.bind(I18N), h = U.h;
    const isMe = Auth.profile && Auth.profile.id === u.id;
    const roleSel = h("select", { class: "input" }, [["user", t("roleUser")], ["admin", t("roleAdmin")]]
      .map(([v, l]) => h("option", { value: v, selected: (u.role || "user") === v }, l)));
    const activeChk = h("input", { type: "checkbox" }); activeChk.checked = u.active !== false;
    const proChk = h("input", { type: "checkbox" }); proChk.checked = u.pro === true;
    const picker = sectionPicker(Array.isArray(u.sections) ? u.sections : null);
    const co = companyFields(u);
    // Resend invite — for users who haven't accepted yet (not for yourself).
    const resendBtn = isMe ? null : h("button", { class: "btn btn--sm", type: "button", onClick: async () => {
      resendBtn.disabled = true; resendBtn.textContent = t("signin_loading");
      const sb = Data.supaClient();
      try {
        const res = await sb.functions.invoke("admin-invite", {
          body: { resend: true, user_id: u.id, sections: Array.isArray(u.sections) ? u.sections : null, redirectTo: location.origin + location.pathname },
        });
        let resp = res.data;
        if (res.error && res.error.context && typeof res.error.context.json === "function") {
          try { resp = await res.error.context.json(); } catch (x) {}
        }
        if (!resp || resp.ok !== true) {
          const map = { forbidden: t("errForbidden"), already_active: t("errAlreadyActive"), not_found: t("errNotFound") };
          throw new Error((resp && map[resp.error]) || t("inviteFailed"));
        }
        U.toast(t("inviteResent"));
        const back = document.querySelector(".modal-backdrop"); if (back) back.click();
        if (onDone) onDone();
      } catch (err) {
        U.toast(err.message || t("inviteFailed"), true);
        resendBtn.disabled = false; resendBtn.textContent = "✉️ " + t("resendInvite");
      }
    } }, "✉️ " + t("resendInvite"));

    const body = h("div", {}, [
      h("div", { class: "field" }, [h("label", {}, t("emailAddr")), h("div", {}, u.email || u.id)]),
      h("div", { class: "row" }, [
        h("div", { class: "field" }, [h("label", {}, t("role")), roleSel]),
        h("div", { class: "field" }, [h("label", { style: "display:flex;gap:8px;align-items:center;margin-top:26px" }, [activeChk, t("active")])]),
      ]),
      h("div", { class: "field" }, [
        h("label", { style: "display:flex;gap:8px;align-items:center" }, [proChk, t("proAccess")]),
        h("div", { class: "small muted", style: "margin-top:4px" }, t("proHint")),
      ]),
      companySection(co),
      h("div", { class: "field" }, [h("label", {}, t("sectionsLabel")), selectAllBtns(picker), picker,
        h("div", { class: "small muted", style: "margin-top:6px" }, t("adminSeesAll"))]),
      sharedAccessSection(u, onDone),
      resendBtn ? h("div", { class: "field", style: "display:flex;gap:8px;align-items:center" }, [resendBtn, h("span", { class: "small muted" }, t("resendHint"))]) : null,
      h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;border-top:1px solid var(--border);padding-top:12px" }, [
        h("button", { class: "btn btn--sm", type: "button", onClick: () => historyModal(u) }, "🕑 " + t("viewHistory")),
        isMe ? null : h("button", { class: "btn btn--sm btn--danger", type: "button", onClick: async () => {
          if (!(await U.confirmDelete(t("removeAccessWarn").replace("{e}", u.email || u.id)))) return;
          await deleteUser(u, () => { const back = document.querySelector(".modal-backdrop"); if (back) back.click(); if (onDone) onDone(); });
        } }, "🗑 " + t("removeAccess")),
      ]),
    ]);
    U.modal(u.email || t("usersTitle"), body, {
      saveText: t("save"),
      async onSave() {
        const sb = Data.supaClient();
        const role = roleSel.value;
        const patch = Object.assign({ role: role, active: activeChk.checked, pro: proChk.checked, sections: role === "admin" ? null : picker._get() }, co._get());
        try {
          const { error } = await sb.from("profiles").update(patch).eq("id", u.id);
          if (error) throw error;
          U.toast(t("saved"));
          if (isMe) { await Auth.reloadProfile(); if (window.MBLApp) MBLApp.buildNav(); }
          if (onDone) onDone();
        } catch (err) { U.toast(err.message || String(err), true); return false; }
      },
    });
  }
})();
