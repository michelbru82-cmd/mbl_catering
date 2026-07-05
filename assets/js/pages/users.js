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

      async function draw() {
        host.innerHTML = "";
        host.appendChild(h("div", { class: "muted small" }, t("signin_loading")));
        const sb = Data.supaClient();
        let rows = [];
        try {
          const { data, error } = await sb.from("profiles").select("*").order("created_at", { ascending: true });
          if (error) throw error;
          rows = data || [];
        } catch (e) {
          host.innerHTML = "";
          host.appendChild(h("div", { class: "banner banner--allergen" }, [h("span", {}, "⚠"), h("div", {}, t("usersLoadFail") + " " + (e.message || ""))]));
          return;
        }
        host.innerHTML = "";
        const tbl = h("table", { class: "data" });
        tbl.appendChild(h("thead", {}, h("tr", {}, [
          h("th", {}, t("emailAddr")), h("th", {}, t("role")), h("th", {}, t("sectionsLabel")), h("th", {}, t("active")), h("th", {}, ""),
        ])));
        const tb = h("tbody", {});
        rows.forEach((u) => {
          const isMe = Auth.profile && Auth.profile.id === u.id;
          const secText = Array.isArray(u.sections) ? (u.sections.length + " / " + SECTION_KEYS.length) : t("allSections");
          tb.appendChild(h("tr", { class: "clickable", onClick: () => userModal(u, draw) }, [
            h("td", {}, [h("b", {}, u.email || u.id), isMe ? h("span", { class: "badge", style: "margin-left:6px" }, t("you")) : null]),
            h("td", {}, [h("span", { class: "badge" }, u.role === "admin" ? t("roleAdmin") : t("roleUser")),
              u.pro && u.role !== "admin" ? h("span", { class: "badge badge--ok", style: "margin-left:4px" }, t("proBadge")) : null]),
            h("td", { class: "small" }, u.role === "admin" ? t("allSections") : secText),
            h("td", {}, u.active === false ? h("span", { class: "badge badge--off" }, t("inactive")) : h("span", { class: "badge badge--ok" }, t("active"))),
            h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); userModal(u, draw); } }, "✏️")),
          ]));
        });
        tbl.appendChild(tb);
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
    const body = h("div", {}, [
      h("p", { class: "small muted" }, t("inviteIntro")),
      h("div", { class: "field" }, [h("label", {}, t("emailAddr")), email]),
      companySection(co),
      h("div", { class: "field" }, [h("label", {}, t("sectionsLabel")), selectAllBtns(picker), picker]),
    ]);
    U.modal("✉️ " + t("inviteUser"), body, {
      saveText: t("sendInvite"),
      async onSave() {
        const e = (email.value || "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { U.toast(t("badEmail"), true); return false; }
        const sb = Data.supaClient();
        try {
          const res = await sb.functions.invoke("admin-invite", {
            body: Object.assign({ email: e, sections: picker._get(), redirectTo: location.origin + location.pathname }, co._get()),
          });
          let resp = res.data;
          if (res.error && res.error.context && typeof res.error.context.json === "function") {
            try { resp = await res.error.context.json(); } catch (x) {}
          }
          if (!resp || resp.ok !== true) {
            const map = { forbidden: t("errForbidden"), already_exists: t("errAlreadyExists"), bad_email: t("badEmail"), not_signed_in: t("errNotSignedIn") };
            throw new Error((resp && map[resp.error]) || t("inviteFailed"));
          }
          U.toast(t("inviteSent"));
          if (onDone) onDone();
        } catch (err) { U.toast(err.message || t("inviteFailed"), true); return false; }
      },
    });
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
      resendBtn ? h("div", { class: "field", style: "display:flex;gap:8px;align-items:center" }, [resendBtn, h("span", { class: "small muted" }, t("resendHint"))]) : null,
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
