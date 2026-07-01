/* People — diners (kids / employees / guests), in/out dates, up to 3 allergens */
PAGES.people = {
  icon: "👥", title: () => I18N.t("people"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    let q = "", kind = "", activeOnly = false;

    const search = h("input", { class: "input search", placeholder: t("search"), oninput: U.debounce((e) => { q = e.target.value.toLowerCase(); draw(); }) });
    const kindSel = h("select", { class: "input", onChange: (e) => { kind = e.target.value; draw(); } },
      [h("option", { value: "" }, t("kind") + ": " + t("all")), ...["kid", "employee", "guest"].map((k) => h("option", { value: k }, t(k)))]);
    const actChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [
      h("input", { type: "checkbox", onChange: (e) => { activeOnly = e.target.checked; draw(); } }), t("active"),
    ]);
    view.appendChild(h("div", { class: "toolbar" }, [
      search, kindSel, actChk, h("span", { class: "muted small", id: "pp-count" }),
      h("div", { style: "flex:1" }),
      h("button", { class: "btn btn--primary", onClick: () => personForm(null) }, "＋ " + t("add")),
    ]));
    const host = h("div", {}); view.appendChild(host);

    function isActive(p) { return (!p.date_in || p.date_in <= U.TODAY) && (!p.date_out || p.date_out >= U.TODAY); }

    function draw() {
      let list = Data.all("people").slice();
      if (kind) list = list.filter((p) => p.kind === kind);
      if (activeOnly) list = list.filter(isActive);
      if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
      list.sort((a, b) => a.name.localeCompare(b.name));
      document.getElementById("pp-count").textContent = list.length + " / " + Data.activePeople().length + " " + t("active");
      host.innerHTML = "";
      const tbl = h("table", { class: "data" });
      tbl.appendChild(h("thead", {}, h("tr", {}, [
        h("th", {}, t("name")), h("th", {}, t("kind")),
        h("th", {}, t("dateIn")), h("th", {}, t("dateOut")), h("th", {}, t("allergensLabel")), h("th", {}, ""),
      ])));
      const tb = h("tbody", {});
      list.forEach((p) => {
        tb.appendChild(h("tr", { class: "clickable", onClick: () => personForm(p) }, [
          h("td", {}, [h("b", {}, p.name), " ", isActive(p) ? h("span", { class: "badge badge--ok" }, t("active")) : h("span", { class: "badge badge--off" }, t("inactive"))]),
          h("td", {}, h("span", { class: "badge" }, t(p.kind || "kid"))),
          h("td", { class: "small" }, p.date_in || "—"),
          h("td", { class: "small" }, p.date_out || "—"),
          h("td", {}, h("div", { class: "pill-list" }, (p.allergen_ids || []).map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a))))),
          h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); personForm(p); } }, "✏️")),
        ]));
      });
      tbl.appendChild(tb);
      host.appendChild(h("div", { class: "table-wrap" }, tbl));
    }
    draw();
  },
};

function personForm(p) {
  const t = I18N.t.bind(I18N), h = U.h;
  const isNew = !p;
  p = p || { name: "", kind: "kid", date_in: "", date_out: "", allergen_ids: [] };
  const name = h("input", { class: "input", value: p.name });
  const kindSel = h("select", { class: "input" }, ["kid", "employee", "guest"].map((k) => h("option", { value: k, selected: k === p.kind }, t(k))));
  const dIn = h("input", { class: "input", type: "date", value: p.date_in || "" });
  const dOut = h("input", { class: "input", type: "date", value: p.date_out || "" });
  const picker = allergenPicker(p.allergen_ids, 3);
  const form = h("div", {}, [
    h("div", { class: "field" }, [h("label", {}, t("name")), name]),
    h("div", { class: "row" }, [
      h("div", { class: "field" }, [h("label", {}, t("kind")), kindSel]),
      h("div", { class: "field" }, [h("label", {}, t("dateIn")), dIn]),
      h("div", { class: "field" }, [h("label", {}, t("dateOut")), dOut]),
    ]),
    h("div", { class: "field" }, [h("label", {}, t("allergensLabel") + " (max 3)"), picker]),
    isNew ? null : h("button", { class: "btn btn--danger btn--sm", onClick: async () => { if (await U.confirmDelete()) { await Data.remove("people", p.id); U.toast(t("deleted")); document.querySelector(".modal-backdrop").click(); Router.rerender(); } } }, "🗑 " + t("delete")),
  ]);
  U.modal(isNew ? t("add") + " · " + t("people") : p.name, form, {
    async onSave() {
      const payload = { name: name.value.trim(), kind: kindSel.value, date_in: dIn.value || null, date_out: dOut.value || null, allergen_ids: picker._get().slice(0, 3) };
      if (!payload.name) { U.toast(t("name") + "?", true); return false; }
      if (isNew) await Data.create("people", payload); else await Data.update("people", p.id, payload);
      U.toast(t("saved")); Router.rerender();
    },
  });
}
