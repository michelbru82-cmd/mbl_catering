/* People — diners (students / employees / teachers / guests), in/out dates, up to 3 allergens.
   Features: filter/search, CSV & Google-Sheet import, multi-select bulk edit. */
const PERSON_KINDS = ["student", "employee", "teacher", "guest"];

PAGES.people = {
  icon: "👥", title: () => I18N.t("people"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    let q = "", kind = "", activeOnly = false;
    const selected = new Set();          // person ids ticked for bulk actions
    let list = [];                       // the currently drawn (filtered) list

    const search = h("input", { class: "input search", placeholder: t("search"), oninput: U.debounce((e) => { q = e.target.value.toLowerCase(); draw(); }) });
    const kindSel = h("select", { class: "input", onChange: (e) => { kind = e.target.value; draw(); } },
      [h("option", { value: "" }, t("kind") + ": " + t("all")), ...PERSON_KINDS.map((k) => h("option", { value: k }, t(k)))]);
    const actChk = h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, [
      h("input", { type: "checkbox", onChange: (e) => { activeOnly = e.target.checked; draw(); } }), t("active"),
    ]);
    view.appendChild(h("div", { class: "toolbar" }, [
      search, kindSel, actChk, h("span", { class: "muted small", id: "pp-count" }),
      h("div", { style: "flex:1" }),
      h("button", { class: "btn", onClick: () => importPeopleModal() }, "⤒ " + t("importLabel")),
      h("button", { class: "btn btn--primary", onClick: () => personForm(null) }, "＋ " + t("add")),
    ]));

    // bulk-action bar (shown only when rows are selected)
    const bulkBar = h("div", { class: "toolbar", style: "display:none;gap:8px;align-items:center;background:var(--card,#0000000a);border-radius:8px;padding:6px 10px" });
    view.appendChild(bulkBar);
    const host = h("div", {}); view.appendChild(host);

    function isActive(p) { return (!p.date_in || p.date_in <= U.TODAY) && (!p.date_out || p.date_out >= U.TODAY); }

    function updateBulkBar() {
      if (!selected.size) { bulkBar.style.display = "none"; bulkBar.innerHTML = ""; return; }
      bulkBar.style.display = "";
      bulkBar.innerHTML = "";
      bulkBar.appendChild(h("b", {}, selected.size + " " + t("selectedLbl")));
      bulkBar.appendChild(h("button", { class: "btn btn--sm btn--primary", onClick: openBulkEdit }, "✎ " + t("bulkEdit")));
      bulkBar.appendChild(h("button", { class: "btn btn--sm btn--danger", onClick: bulkDelete }, "🗑 " + t("delete")));
      bulkBar.appendChild(h("button", { class: "btn btn--sm", onClick: () => { selected.clear(); draw(); } }, t("clearSelBtn")));
    }

    async function openBulkEdit() {
      const ids = [...selected];
      const changed = await bulkEditPeople(ids);
      if (changed) { selected.clear(); Router.rerender(); }
    }
    async function bulkDelete() {
      const ids = [...selected];
      if (!(await U.confirmDelete(t("bulkDeleteWarn").replace("{n}", ids.length)))) return;
      let n = 0;
      for (const id of ids) { try { await Data.remove("people", id); n++; } catch (e) { U.toast(e.message || String(e), true); if (!n) return; break; } }
      U.toast(t("deleted")); selected.clear(); Router.rerender();
    }

    function draw() {
      list = Data.all("people").slice();
      if (kind) list = list.filter((p) => p.kind === kind);
      if (activeOnly) list = list.filter(isActive);
      if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
      list.sort((a, b) => a.name.localeCompare(b.name));
      document.getElementById("pp-count").textContent = list.length + " / " + Data.activePeople().length + " " + t("active");
      host.innerHTML = "";

      const allChk = h("input", { type: "checkbox", title: t("selectAll"), onChange: (e) => {
        const on = e.target.checked;
        list.forEach((p) => (on ? selected.add(p.id) : selected.delete(p.id)));
        draw();
      } });
      allChk.checked = list.length > 0 && list.every((p) => selected.has(p.id));

      const tbl = h("table", { class: "data" });
      tbl.appendChild(h("thead", {}, h("tr", {}, [
        h("th", { style: "width:1%" }, allChk),
        h("th", {}, t("name")), h("th", {}, t("kind")),
        h("th", {}, t("dateIn")), h("th", {}, t("dateOut")), h("th", {}, t("allergensLabel")), h("th", {}, ""),
      ])));
      const tb = h("tbody", {});
      list.forEach((p) => {
        const rowChk = h("input", { type: "checkbox", onClick: (e) => e.stopPropagation(), onChange: (e) => {
          if (e.target.checked) selected.add(p.id); else selected.delete(p.id);
          allChk.checked = list.length > 0 && list.every((x) => selected.has(x.id));
          updateBulkBar();
        } });
        rowChk.checked = selected.has(p.id);
        tb.appendChild(h("tr", { class: "clickable", onClick: () => personForm(p) }, [
          h("td", { onClick: (e) => e.stopPropagation() }, rowChk),
          h("td", {}, [h("b", {}, p.name), " ", isActive(p) ? h("span", { class: "badge badge--ok" }, t("active")) : h("span", { class: "badge badge--off" }, t("inactive"))]),
          h("td", {}, h("span", { class: "badge" }, t(p.kind || "student"))),
          h("td", { class: "small" }, p.date_in || "—"),
          h("td", { class: "small" }, p.date_out || "—"),
          h("td", {}, h("div", { class: "pill-list" }, (p.allergen_ids || []).map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a))))),
          h("td", {}, h("button", { class: "btn btn--sm", onClick: (e) => { e.stopPropagation(); personForm(p); } }, "✏️")),
        ]));
      });
      tbl.appendChild(tb);
      host.appendChild(h("div", { class: "table-wrap" }, tbl));
      updateBulkBar();
    }
    draw();
  },
};

function personForm(p) {
  const t = I18N.t.bind(I18N), h = U.h;
  const isNew = !p;
  p = p || { name: "", kind: "student", date_in: "", date_out: "", allergen_ids: [] };
  const name = h("input", { class: "input", value: p.name });
  const kindSel = h("select", { class: "input" }, PERSON_KINDS.map((k) => h("option", { value: k, selected: k === p.kind }, t(k))));
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

/* ---------- Bulk edit — apply only the ticked fields to every selected person ---------- */
function bulkEditPeople(ids) {
  const t = I18N.t.bind(I18N), h = U.h;
  const useType = h("input", { type: "checkbox" });
  const typeSel = h("select", { class: "input", onChange: () => (useType.checked = true) }, PERSON_KINDS.map((k) => h("option", { value: k }, t(k))));
  const useIn = h("input", { type: "checkbox" });
  const dIn = h("input", { class: "input", type: "date", onInput: () => (useIn.checked = true) });
  const useOut = h("input", { type: "checkbox" });
  const dOut = h("input", { class: "input", type: "date", onInput: () => (useOut.checked = true) });
  const useAlg = h("input", { type: "checkbox" });
  const picker = allergenPicker([], 3);
  picker.addEventListener("click", () => (useAlg.checked = true));

  const field = (chk, label, ctrl) => h("div", { class: "field" }, [
    h("label", { style: "display:flex;gap:8px;align-items:center" }, [chk, label]), ctrl,
  ]);
  const body = h("div", {}, [
    h("p", { class: "small muted" }, ids.length + " " + t("selectedLbl") + " · " + t("bulkEditIntro")),
    field(useType, t("kind"), typeSel),
    h("div", { class: "row" }, [field(useIn, t("dateIn"), dIn), field(useOut, t("dateOut"), dOut)]),
    field(useAlg, t("allergensLabel") + " (max 3)", picker),
  ]);
  return U.modal(t("bulkEdit"), body, {
    saveText: t("applyLbl"),
    async onSave() {
      const patch = {};
      if (useType.checked) patch.kind = typeSel.value;
      if (useIn.checked) patch.date_in = dIn.value || null;
      if (useOut.checked) patch.date_out = dOut.value || null;
      if (useAlg.checked) patch.allergen_ids = picker._get().slice(0, 3);
      if (!Object.keys(patch).length) { U.toast(t("nothingToChange"), true); return false; }
      let n = 0;
      for (const id of ids) { try { await Data.update("people", id, patch); n++; } catch (e) { U.toast(e.message || String(e), true); return false; } }
      U.toast(n + " " + t("updatedLbl"));
    },
  });
}

/* ---------- CSV / Google-Sheet import ---------- */
function importPeopleModal() {
  const t = I18N.t.bind(I18N), h = U.h;
  let records = [];

  const ta = h("textarea", { class: "input", rows: "6", spellcheck: "false",
    placeholder: "name,type,start,end,allergens\nAlex Chen,student,2025-08-25,,Peanut;Milk",
    style: "width:100%;font-family:monospace;font-size:12px" });
  const file = h("input", { type: "file", accept: ".csv,text/csv,text/plain" });
  const sheet = h("input", { class: "input", style: "flex:1", placeholder: "https://docs.google.com/spreadsheets/d/…" });
  const countEl = h("span", { class: "small muted" });
  const previewHost = h("div", {});

  function refresh() { records = peopleFromCSV(ta.value); renderPreview(); }
  function renderPreview() {
    previewHost.innerHTML = "";
    countEl.textContent = records.length + " " + t("rowsReady");
    if (!records.length) return;
    const tbl = h("table", { class: "data" });
    tbl.appendChild(h("thead", {}, h("tr", {}, [
      h("th", {}, t("name")), h("th", {}, t("kind")), h("th", {}, t("dateIn")), h("th", {}, t("dateOut")), h("th", {}, t("allergensLabel")),
    ])));
    const tb = h("tbody", {});
    records.slice(0, 100).forEach((r) => tb.appendChild(h("tr", {}, [
      h("td", {}, h("b", {}, r.name)),
      h("td", {}, h("span", { class: "badge" }, t(r.kind))),
      h("td", { class: "small" }, r.date_in || "—"),
      h("td", { class: "small" }, r.date_out || "—"),
      h("td", {}, h("div", { class: "pill-list" }, r.allergen_ids.map((a) => h("span", { class: "badge badge--allergen" }, Data.allergenName(a))))),
    ])));
    tbl.appendChild(tb);
    previewHost.appendChild(h("div", { class: "table-wrap" }, tbl));
    if (records.length > 100) previewHost.appendChild(h("div", { class: "small muted", style: "padding-top:4px" }, "… +" + (records.length - 100)));
  }

  ta.addEventListener("input", U.debounce(refresh, 250));
  file.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { ta.value = rd.result; refresh(); };
    rd.readAsText(f);
  });
  const loadBtn = h("button", { class: "btn btn--sm", onClick: async () => {
    const url = sheetCsvUrl(sheet.value.trim());
    if (!url) { U.toast(t("sheetError"), true); return; }
    loadBtn.disabled = true; loadBtn.textContent = t("loadingSheet");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      ta.value = await res.text(); refresh();
    } catch (err) { U.toast(t("sheetError"), true); }
    loadBtn.disabled = false; loadBtn.textContent = t("loadSheet");
  } }, t("loadSheet"));

  const body = h("div", {}, [
    h("p", { class: "small muted" }, t("importIntro")),
    h("div", { class: "field" }, [h("label", {}, t("csvFile")), file]),
    h("div", { class: "field" }, [h("label", {}, t("googleSheetUrl")), h("div", { style: "display:flex;gap:8px" }, [sheet, loadBtn])]),
    h("div", { class: "small muted", style: "margin:-4px 0 8px" }, t("sheetHint")),
    h("div", { class: "field" }, [h("label", {}, t("pasteData")), ta]),
    h("div", { class: "field" }, [h("label", {}, [t("previewLbl"), " · ", countEl]), previewHost]),
  ]);

  return U.modal("⤒ " + t("importPeople"), body, {
    wide: true, saveText: t("importBtn"),
    async onSave() {
      if (!records.length) { U.toast(t("nothingToImport"), true); return false; }
      let n = 0;
      for (const r of records) {
        try { await Data.create("people", { name: r.name, kind: r.kind, date_in: r.date_in, date_out: r.date_out, allergen_ids: r.allergen_ids }); n++; }
        catch (e) { U.toast(e.message || String(e), true); if (!n) return false; break; }
      }
      U.toast(n + " " + t("importedPeople")); Router.rerender();
    },
  });
}

/* ---------- CSV helpers ---------- */
// RFC-4180-ish parser: handles quoted fields, doubled quotes, commas & newlines in quotes.
function parseCSV(text) {
  const rows = []; let row = [], field = "", inQ = false;
  text = (text || "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => (c || "").trim() !== ""));
}

// Turn CSV text into people records. Recognises a header row (any column order) or
// falls back to positional columns: name, type, start, end, allergens.
function peopleFromCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const headerRe = /(name|type|kind|allerg|date|start|end|姓名|名稱|類型|過敏|開始|結束)/i;
  const hasHeader = rows[0].some((c) => headerRe.test(c || ""));
  let idx, body;
  if (hasHeader) { idx = mapPeopleHeader(rows[0]); body = rows.slice(1); }
  else { idx = { name: 0, kind: 1, date_in: 2, date_out: 3, allergens: 4 }; body = rows; }
  const at = (r, i) => (i >= 0 && r[i] != null ? r[i] : "");
  return body.map((r) => ({
    name: at(r, idx.name).trim(),
    kind: normPersonKind(at(r, idx.kind)),
    date_in: toISODate(at(r, idx.date_in)),
    date_out: toISODate(at(r, idx.date_out)),
    allergen_ids: matchAllergenTokens(at(r, idx.allergens)),
  })).filter((x) => x.name);
}

function mapPeopleHeader(cells) {
  const idx = { name: -1, kind: -1, date_in: -1, date_out: -1, allergens: -1 };
  cells.forEach((c, i) => {
    const n = (c || "").trim().toLowerCase();
    if (idx.allergens < 0 && /(allerg|過敏)/.test(n)) idx.allergens = i;
    else if (idx.date_in < 0 && /(start|date.?in|début|debut|開始|入)/.test(n)) idx.date_in = i;
    else if (idx.date_out < 0 && /(end|date.?out|fin|結束|離|停)/.test(n)) idx.date_out = i;
    else if (idx.kind < 0 && /(type|kind|類型|categor|catégor)/.test(n)) idx.kind = i;
    else if (idx.name < 0 && /(name|姓名|名稱|nom)/.test(n)) idx.name = i;
  });
  if (idx.name < 0) idx.name = 0; // always need a name column
  return idx;
}

function normPersonKind(v) {
  const n = (v || "").trim().toLowerCase();
  if (/(employ|staff|員工|salari)/.test(n)) return "employee";
  if (/(teacher|prof|老師|教師|enseign)/.test(n)) return "teacher";
  if (/(guest|visit|訪客|invit)/.test(n)) return "guest";
  return "student"; // student / kid / child / pupil / élève / 學生 / 孩童 and default
}

function toISODate(v) {
  const s = (v || "").trim(); if (!s) return null;
  const pad = (n) => String(n).padStart(2, "0");
  let m;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`; // DD/MM/YYYY
  return s; // best effort — leave anything else untouched
}

function matchAllergenTokens(v) {
  const s = (v || "").trim(); if (!s) return [];
  const algs = Data.all("allergens");
  const out = [];
  s.split(/[;,/|]+/).map((x) => x.trim()).filter(Boolean).forEach((tok) => {
    const tn = tok.toLowerCase();
    const a = algs.find((a) =>
      String(a.code) === tok ||
      (a.name_en && a.name_en.toLowerCase() === tn) ||
      (a.name_zh && a.name_zh === tok) ||
      (a.name_en && a.name_en.toLowerCase().includes(tn)));
    if (a && !out.includes(a.id)) out.push(a.id);
  });
  return out.slice(0, 3);
}

// Build a CSV-export URL from a Google Sheets share/edit link.
function sheetCsvUrl(url) {
  if (!url) return null;
  const m = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const g = url.match(/[#&?]gid=(\d+)/);
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${g ? g[1] : "0"}`;
}
