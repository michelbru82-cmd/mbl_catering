/* ============================================================
   Events — company-wide events + past-event thank-you mailings.
   Guests register themselves on the website (event_registrations).
   When an event's date passes, its list is frozen into
   events.attendees and the "Send Thank You" flow works off that.
   Routes:  #/events            -> list (upcoming + past)
            #/events/<id>       -> detail (schedule, speakers, guests, send)
   ============================================================ */
PAGES.events = {
  icon: "📅", title: () => I18N.t("events"),
  render(view, params) {
    if (params && params[0]) return renderEventDetail(view, params[0]);
    return renderEventList(view);
  },
};

/* ---------------- list ---------------- */
function renderEventList(view) {
  const t = I18N.t.bind(I18N), h = U.h;
  view.appendChild(h("div", { class: "banner banner--info" }, [h("span", {}, "📅"), h("div", { class: "small" }, t("eventsIntro"))]));
  view.appendChild(h("div", { class: "toolbar" }, [
    h("div", { style: "flex:1" }),
    h("button", { class: "btn btn--primary", onClick: () => eventForm(null) }, "＋ " + t("newEvent")),
  ]));

  const upcoming = Data.upcomingEvents(), past = Data.pastEvents();

  // Upcoming
  view.appendChild(h("div", { class: "section-head" }, [h("h2", { style: "font-size:15px" }, t("upcomingEvents"))]));
  if (!upcoming.length) {
    view.appendChild(h("div", { class: "empty", style: "padding:26px" }, [
      h("div", { class: "big" }, "🗓️"), h("div", { style: "font-weight:600;margin-top:6px" }, t("waitingNextEvent")),
    ]));
  } else {
    const grid = h("div", { class: "card-grid" });
    upcoming.forEach((ev) => grid.appendChild(eventCard(ev, false)));
    view.appendChild(grid);
  }

  // Past
  view.appendChild(h("div", { class: "section-head", style: "margin-top:22px" }, [h("h2", { style: "font-size:15px" }, t("pastEvents"))]));
  if (!past.length) {
    view.appendChild(h("div", { class: "empty small" }, t("nothingHere")));
  } else {
    const grid = h("div", { class: "card-grid" });
    past.forEach((ev) => grid.appendChild(eventCard(ev, true)));
    view.appendChild(grid);
  }
}

function eventCard(ev, isPast) {
  const t = I18N.t.bind(I18N), h = U.h;
  const count = Array.isArray(ev.attendees) ? ev.attendees.length : Data.registrationsForEvent(ev.id).length;
  return h("div", { class: "card", style: "display:flex;flex-direction:column;gap:8px" }, [
    h("div", { style: "display:flex;align-items:baseline;gap:8px" }, [
      h("div", { style: "font-weight:700;font-size:15px;flex:1" }, I18N.pick(ev, "title")),
      isPast ? h("span", { class: "badge" }, t("pastEvents")) : h("span", { class: "badge badge--ok" }, t("upcomingEvents")),
    ]),
    h("div", { class: "small muted" }, U.fmtDate(ev.date, true) + (ev.start_time ? " · " + ev.start_time : "") + (I18N.pick(ev, "location") ? " · " + I18N.pick(ev, "location") : "")),
    h("div", { class: "small" }, "👥 " + count + " " + (isPast ? t("guests") : t("registrations"))),
    h("div", { style: "display:flex;gap:8px;margin-top:4px" }, [
      h("a", { class: "btn btn--sm btn--primary", href: "#/events/" + ev.id }, isPast ? t("details") + " →" : t("openEvent")),
      h("button", { class: "btn btn--sm", onClick: () => eventForm(ev) }, "✎ " + t("edit")),
      h("button", { class: "btn btn--sm btn--danger", onClick: async () => { if (await U.confirmDelete()) { await Data.remove("events", ev.id); Router.rerender(); } } }, "✕"),
    ]),
  ]);
}

/* ---------------- detail ---------------- */
async function renderEventDetail(view, id) {
  const t = I18N.t.bind(I18N), h = U.h;
  let ev = Data.get("events", id);
  if (!ev) { view.appendChild(h("div", { class: "empty" }, t("nothingHere"))); return; }
  const isPast = Data.eventIsPast(ev);
  if (isPast) ev = (await Data.ensureArchived(ev)) || ev;

  view.appendChild(h("div", { class: "toolbar" }, [
    h("a", { class: "btn btn--sm", href: "#/events" }, t("back")),
    h("div", { style: "flex:1" }),
    h("button", { class: "btn btn--sm", onClick: () => eventForm(ev) }, "✎ " + t("edit")),
    isPast ? h("button", { class: "btn btn--accent", onClick: () => openThankYou(ev) }, "💌 " + t("sendThankYou")) : null,
  ]));

  // header
  view.appendChild(h("div", { class: "card" }, [
    h("h2", { style: "margin:0 0 4px;font-size:20px" }, I18N.pick(ev, "title")),
    h("div", { class: "small muted" }, U.fmtDate(ev.date, true) +
      (ev.start_time ? " · " + ev.start_time + (ev.end_time ? "–" + ev.end_time : "") : "") +
      (I18N.pick(ev, "location") ? " · 📍 " + I18N.pick(ev, "location") : "")),
    I18N.pick(ev, "description") ? h("p", { style: "margin:10px 0 0" }, I18N.pick(ev, "description")) : null,
  ]));

  const cols = h("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;margin-top:16px" });
  // schedule
  const sch = (ev.schedule || []);
  const schCard = h("div", { class: "card" }, [h("h3", { style: "margin:0 0 8px;font-size:15px" }, "🕒 " + t("schedule"))]);
  if (sch.length) sch.forEach((s) => schCard.appendChild(h("div", { style: "display:flex;gap:10px;padding:5px 0;border-bottom:1px solid var(--border)" }, [
    h("div", { style: "font-weight:600;min-width:54px;color:var(--brand-primary)" }, s.time || ""),
    h("div", {}, I18N.lang === "zh" ? (s.item_zh || s.item_en || "") : (s.item_en || s.item_zh || "")),
  ])));
  else schCard.appendChild(h("div", { class: "small muted" }, t("nothingHere")));
  cols.appendChild(schCard);
  // speakers
  const spk = (ev.speakers || []);
  const spkCard = h("div", { class: "card" }, [h("h3", { style: "margin:0 0 8px;font-size:15px" }, "🎤 " + t("speakers"))]);
  if (spk.length) spk.forEach((s) => spkCard.appendChild(h("div", { style: "padding:6px 0;border-bottom:1px solid var(--border)" }, [
    h("div", { style: "font-weight:600" }, s.name || ""),
    s.title ? h("div", { class: "small muted" }, s.title) : null,
    s.bio ? h("div", { class: "small" }, s.bio) : null,
  ])));
  else spkCard.appendChild(h("div", { class: "small muted" }, t("nothingHere")));
  cols.appendChild(spkCard);
  view.appendChild(cols);

  // guest list
  const guests = Data.eventAttendees(ev);
  view.appendChild(h("div", { class: "section-head", style: "margin-top:18px" }, [
    h("h2", { style: "font-size:15px" }, "👥 " + t("guestList")),
    h("span", { class: "badge" }, guests.length + " " + t("guests")),
    h("div", { class: "spacer" }),
    h("span", { class: "small muted" }, isPast ? t("archivedNote") : t("liveListNote")),
  ]));
  const wrap = h("div", { class: "card", style: "padding:0;overflow-x:auto" });
  const tbl = h("table", { class: "table", style: "width:100%;border-collapse:collapse;font-size:13px" });
  tbl.appendChild(h("thead", {}, h("tr", {}, [t("name"), t("email"), "Company", t("speakerTitle"), t("phone")]
    .map((x) => h("th", { style: "text-align:left;padding:8px 10px;border-bottom:1px solid var(--border);white-space:nowrap" }, x)))));
  const tb = h("tbody", {});
  guests.forEach((g) => tb.appendChild(h("tr", {}, [g.name, g.email, g.company, g.job_title, g.phone]
    .map((x) => h("td", { style: "padding:7px 10px;border-bottom:1px solid var(--border)" }, x || "—")))));
  if (!guests.length) tb.appendChild(h("tr", {}, h("td", { colspan: 5, class: "empty small", style: "padding:16px" }, t("nothingHere"))));
  tbl.appendChild(tb); wrap.appendChild(tbl); view.appendChild(wrap);

  // send history
  const sends = Data.all("event_sends").filter((s) => s.event_id === ev.id).sort((a, b) => (b.sent_at || "").localeCompare(a.sent_at || ""));
  if (sends.length) {
    view.appendChild(h("div", { class: "section-head", style: "margin-top:18px" }, [h("h2", { style: "font-size:15px" }, "📨 " + t("sendLog"))]));
    const box = h("div", { class: "card", style: "padding:0" });
    sends.forEach((s) => box.appendChild(h("div", { style: "display:flex;gap:10px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--border)" }, [
      h("span", { class: "badge " + (s.kind === "attended" ? "badge--ok" : "") }, s.kind === "attended" ? t("attendedGroup") : t("noShowGroup")),
      h("div", { style: "flex:1;min-width:0" }, [h("div", { style: "font-weight:600;font-size:13px" }, s.subject), h("div", { class: "small muted" }, (s.sent_at || "") + " · " + (s.count || 0) + " " + t("sentOk"))]),
    ])));
    view.appendChild(box);
  }
}

/* ---------------- create / edit form ---------------- */
function eventForm(ev) {
  const t = I18N.t.bind(I18N), h = U.h;
  const e = ev || {};
  const f = {
    title_en: h("input", { class: "input", value: e.title_en || "" }),
    title_zh: h("input", { class: "input", value: e.title_zh || "" }),
    date: h("input", { class: "input", type: "date", value: e.date || U.realToday() }),
    start_time: h("input", { class: "input", type: "time", value: e.start_time || "" }),
    end_time: h("input", { class: "input", type: "time", value: e.end_time || "" }),
    location: h("input", { class: "input", value: e.location || "" }),
    location_zh: h("input", { class: "input", value: e.location_zh || "" }),
    description: h("textarea", { class: "input", rows: 2 }, e.description || ""),
    description_zh: h("textarea", { class: "input", rows: 2 }, e.description_zh || ""),
    voucher_code: h("input", { class: "input", value: e.voucher_code || "" }),
    voucher_note: h("input", { class: "input", value: e.voucher_note || "" }),
  };
  const field = (labelKey, node) => h("div", { class: "field" }, [h("label", {}, t(labelKey)), node]);
  const two = (a, b) => h("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:10px" }, [a, b]);

  // repeatable row editors -> return { node, read() }
  const schedule = rowEditor(e.schedule || [], [["time", t("startTime"), "time"], ["item_en", t("schedule") + " (EN)"], ["item_zh", t("schedule") + " (中文)"]], t);
  const speakers = rowEditor(e.speakers || [], [["name", t("name")], ["title", t("speakerTitle")], ["bio", t("bio")]], t);
  const documents = rowEditor(e.documents || [], [["label", t("label")], ["url", t("url")]], t);
  const tools = rowEditor(e.tool_links || [], [["label", t("label")], ["url", t("url")]], t);

  const body = h("div", {}, [
    two(field("name_en", f.title_en), field("name_zh", f.title_zh)),
    h("div", { style: "display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px" }, [field("eventDate", f.date), field("startTime", f.start_time), field("endTime", f.end_time)]),
    two(field("location", f.location), field("location_zh", f.location_zh)),
    two(field("description", f.description), field("description_zh", f.description_zh)),
    h("h4", { style: "margin:14px 0 6px" }, "🕒 " + t("schedule")), schedule.node,
    h("h4", { style: "margin:14px 0 6px" }, "🎤 " + t("speakers")), speakers.node,
    h("h4", { style: "margin:14px 0 6px" }, "📎 " + t("documents")), documents.node,
    h("h4", { style: "margin:14px 0 6px" }, "🔗 " + t("toolLinks")), tools.node,
    two(field("voucher", f.voucher_code), field("voucherNote", f.voucher_note)),
  ]);

  U.modal(ev ? t("editEvent") : t("newEvent"), body, {
    wide: true,
    async onSave() {
      const title_en = f.title_en.value.trim();
      if (!title_en) { U.toast(t("name_en") + "?", true); return false; }
      if (!f.date.value) { U.toast(t("eventDate") + "?", true); return false; }
      const patch = {
        title_en, title_zh: f.title_zh.value.trim(), date: f.date.value,
        start_time: f.start_time.value, end_time: f.end_time.value,
        location: f.location.value.trim(), location_zh: f.location_zh.value.trim(),
        description: f.description.value.trim(), description_zh: f.description_zh.value.trim(),
        schedule: schedule.read(), speakers: speakers.read(),
        documents: documents.read(), tool_links: tools.read(),
        voucher_code: f.voucher_code.value.trim(), voucher_note: f.voucher_note.value.trim(),
      };
      if (ev) await Data.update("events", ev.id, patch);
      else await Data.create("events", Object.assign({ attendees: null, archived_at: null, created_at: U.realToday() }, patch));
      U.toast(t("saved")); Router.rerender();
    },
  });
}

// Generic repeatable-row editor. fields = [[key,label,(type)], ...]
function rowEditor(initial, fields, t) {
  const h = U.h;
  const list = h("div", {});
  const rows = [];
  function addRow(data) {
    const inputs = {};
    const cells = fields.map(([key, label, type]) => {
      const inp = h("input", { class: "input", placeholder: label, type: type || "text", value: (data && data[key]) || "" });
      inputs[key] = inp; return inp;
    });
    const rowObj = { inputs };
    const row = h("div", { style: "display:flex;gap:6px;margin-bottom:6px;align-items:center" }, [
      h("div", { style: "flex:1;display:grid;grid-template-columns:repeat(" + fields.length + ",1fr);gap:6px" }, cells),
      h("button", { class: "btn btn--sm btn--danger", onClick: () => { list.removeChild(row); const i = rows.indexOf(rowObj); if (i >= 0) rows.splice(i, 1); } }, "✕"),
    ]);
    rowObj.row = row; rows.push(rowObj); list.appendChild(row);
  }
  (initial || []).forEach(addRow);
  const wrap = h("div", {}, [list, h("button", { class: "btn btn--sm", onClick: () => addRow(null) }, t("addRow"))]);
  return {
    node: wrap,
    read() {
      return rows.map((r) => {
        const o = {}; fields.forEach(([key]) => (o[key] = r.inputs[key].value.trim()));
        return o;
      }).filter((o) => fields.some(([key]) => o[key]));
    },
  };
}

/* ---------------- thank-you mailing ---------------- */
function openThankYou(ev) {
  const t = I18N.t.bind(I18N), h = U.h;
  const attendees = Data.eventAttendees(ev); // array reference (archived snapshot)
  const state = { extras: "", note1: "", note2: "" };

  const container = h("div", {});
  U.modal("💌 " + t("sendThankYou") + " — " + I18N.pick(ev, "title"), container, { wide: true, cancelText: t("close") });

  function parseExtras(text) {
    return (text || "").split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).map((line) => {
      const m = line.match(/^(.*?)[<(]?\s*([^\s<>()]+@[^\s<>()]+)\s*[>)]?$/);
      if (m && m[2]) return { name: (m[1] || "").trim(), email: m[2].trim(), extra: true };
      return null;
    }).filter(Boolean);
  }

  function render() {
    container.innerHTML = "";
    const extras = parseExtras(state.extras);
    const attendedGroup = attendees.filter((a) => a.attended).map((a) => ({ name: a.name, email: a.email })).concat(extras.map((x) => ({ name: x.name, email: x.email })));
    const noShowGroup = attendees.filter((a) => !a.attended).map((a) => ({ name: a.name, email: a.email }));

    // 1) attendance selection
    container.appendChild(h("div", { class: "section-head" }, [
      h("h3", { style: "font-size:15px" }, "① " + t("whoAttended")),
      h("div", { class: "spacer" }),
      h("button", { class: "btn btn--sm", onClick: () => { attendees.forEach((a) => (a.attended = true)); persistAttendance(); render(); } }, t("markAll")),
      h("button", { class: "btn btn--sm", onClick: () => { attendees.forEach((a) => (a.attended = false)); persistAttendance(); render(); } }, t("markNone")),
    ]));
    const box = h("div", { class: "card", style: "padding:0;max-height:240px;overflow:auto" });
    attendees.forEach((a) => box.appendChild(h("label", { style: "display:flex;gap:10px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--border);cursor:pointer" }, [
      h("input", { type: "checkbox", checked: !!a.attended, onChange: (e) => { a.attended = e.target.checked; persistAttendance(); render(); } }),
      h("div", { style: "flex:1;min-width:0" }, [h("div", { style: "font-weight:600;font-size:13px" }, a.name || a.email), h("div", { class: "small muted" }, a.email + (a.company ? " · " + a.company : ""))]),
    ])));
    if (!attendees.length) box.appendChild(h("div", { class: "empty small", style: "padding:14px" }, t("nothingHere")));
    container.appendChild(box);

    const extraTa = h("textarea", { class: "input", rows: 2, placeholder: "name@example.com", onInput: U.debounce((e) => { state.extras = e.target.value; render(); }, 350) }, state.extras);
    container.appendChild(h("div", { class: "field", style: "margin-top:10px" }, [h("label", {}, t("extraEmails")), extraTa, h("div", { class: "small muted" }, t("extraEmailsHint"))]));

    // 2) the two emails
    container.appendChild(h("div", { class: "section-head", style: "margin-top:8px" }, [h("h3", { style: "font-size:15px" }, "② " + t("preview"))]));
    container.appendChild(emailPanel(ev, "attended", attendedGroup, state, () => afterSend()));
    container.appendChild(emailPanel(ev, "no_show", noShowGroup, state, () => afterSend()));
  }

  function persistAttendance() {
    if (Array.isArray(ev.attendees)) Data.update("events", ev.id, { attendees: ev.attendees });
  }
  function afterSend() { /* keep modal open; refresh detail underneath on close via rerender */ }

  render();
}

function emailPanel(ev, kind, recipients, state, onSent) {
  const t = I18N.t.bind(I18N), h = U.h;
  const noteKey = kind === "attended" ? "note1" : "note2";
  const built = buildEventEmail(ev, kind, { note: state[noteKey] });
  const subjInput = h("input", { class: "input", value: built.subject });
  const noteTa = h("textarea", { class: "input", rows: 2, placeholder: t("customNote"), onInput: (e) => { state[noteKey] = e.target.value; frame.innerHTML = buildEventEmail(ev, kind, { note: state[noteKey], subject: subjInput.value }).html; } }, state[noteKey] || "");

  const chips = h("div", { style: "display:flex;flex-wrap:wrap;gap:5px;margin:4px 0" },
    recipients.length ? recipients.map((r) => h("span", { class: "badge", title: r.email }, r.email)) : [h("span", { class: "small muted" }, t("noRecipients"))]);

  const frame = h("div", { class: "card", style: "max-width:640px;margin-top:8px" });
  frame.innerHTML = built.html;

  const sendBtn = h("button", { class: "btn btn--accent", disabled: !recipients.length, onClick: doSend },
    (kind === "attended" ? "📤 " + t("sendToAttended") : "📤 " + t("sendToNoShow")) + " (" + recipients.length + ")");

  async function doSend() {
    if (!recipients.length) return;
    const data = buildEventEmail(ev, kind, { note: state[noteKey], subject: subjInput.value });
    sendBtn.disabled = true; sendBtn.textContent = t("sending");
    try {
      const res = await Data.sendNewsletter({
        subject: data.subject, html: data.html, text: data.text,
        recipients: recipients.map((r) => ({ email: r.email, name: r.name })),
        from: (window.MBL_CONFIG.EVENT_FROM || window.MBL_CONFIG.NEWSLETTER_FROM),
      });
      await Data.create("event_sends", {
        event_id: ev.id, kind, subject: data.subject,
        recipients: recipients.map((r) => r.email), count: recipients.length, sent_at: U.realToday(),
      });
      const n = (res && res.count != null) ? res.count : recipients.length;
      U.toast(n + " " + t("sentOk") + (res && res.local ? " (local demo — wire SMTP to send for real)" : ""));
      if (onSent) onSent();
    } catch (err) { U.toast("Send failed: " + (err.message || err), true); }
    finally { sendBtn.disabled = false; sendBtn.textContent = (kind === "attended" ? "📤 " + t("sendToAttended") : "📤 " + t("sendToNoShow")) + " (" + recipients.length + ")"; }
  }

  return h("div", { class: "card", style: "margin-top:12px;background:var(--surface-2, #faf9f5)" }, [
    h("h4", { style: "margin:0 0 8px" }, kind === "attended" ? t("emailAttended") : t("emailNoShow")),
    h("div", { class: "field" }, [h("label", {}, t("subject")), subjInput]),
    h("div", { class: "small muted", style: "font-weight:600" }, t("recipientsLabel") + " (" + recipients.length + ") — " + t("recipientsIndiv")),
    chips,
    h("div", { class: "field", style: "margin-top:6px" }, [h("label", {}, t("customNote")), noteTa, h("div", { class: "small muted" }, t("customNoteHint"))]),
    frame,
    h("div", { style: "margin-top:10px" }, sendBtn),
  ]);
}

/* Build a thank-you email (inline-styled HTML + text). kind: attended | no_show */
function buildEventEmail(ev, kind, opts) {
  opts = opts || {};
  const cfg = window.MBL_CONFIG, zh = I18N.lang === "zh", esc = U.esc;
  const title = I18N.pick(ev, "title") || (ev.title_en || "");
  const brand = cfg.ORG_NAME + (cfg.ORG_NAME_ZH ? " · " + cfg.ORG_NAME_ZH : "");
  const docs = (ev.documents || []).filter((d) => d.url);
  const tools = (ev.tool_links || []).filter((d) => d.url);
  const greatLine = zh ? "昨晚出席踴躍，是一段美好的時光，謝謝大家！" : "Last night had a great attendance and was a great time — thank you all!";
  const note = (opts.note || "").trim();

  // voucher validity: one month from the actual send date
  const now = new Date();
  const exp = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const expStr = exp.toLocaleDateString(zh ? "zh-TW" : "en-GB", { year: "numeric", month: "long", day: "numeric" });

  const linkList = (arr) => "<ul style='margin:8px 0 0;padding-left:20px'>" +
    arr.map((d) => `<li style='margin:3px 0'><a href='${esc(d.url)}' style='color:#2f7d4f'>${esc(d.label || d.url)}</a></li>`).join("") + "</ul>";

  let subject, bodyHtml, bodyText;
  if (kind === "attended") {
    subject = opts.subject || (zh
      ? `🎁 感謝您昨晚的蒞臨 — 附上承諾的文件與工具（${title}）`
      : `🎁 Thank you for last night — your documents & tools, as promised`);
    const intro = zh
      ? `感謝您參加「${esc(title)}」。${greatLine}`
      : `Thank you for coming to <b>${esc(title)}</b>. ${greatLine}`;
    const promised = zh ? "如同承諾，附上昨晚的文件與連結：" : "As promised, here are the documents and links from the evening:";
    bodyHtml =
      `<p>${zh ? "您好，" : "Hello,"}</p>` +
      (note ? `<p>${esc(note)}</p>` : "") +
      `<p>${intro}</p>` +
      `<p style='margin-top:14px'><b>${promised}</b></p>` +
      (docs.length ? `<div><b>📎 ${zh ? "文件" : "Documents"}:</b>${linkList(docs)}</div>` : "") +
      (tools.length ? `<div style='margin-top:10px'><b>🔗 ${zh ? "工具" : "Tools"}:</b>${linkList(tools)}</div>` : "") +
      (ev.voucher_code ? voucherBox(ev, expStr, zh, esc) : "");
    bodyText =
      (note ? note + "\n\n" : "") +
      (zh ? `感謝您參加「${title}」。${greatLine}\n\n${promised}\n` : `Thank you for coming to ${title}. ${greatLine}\n\n${promised}\n`) +
      docs.map((d) => `- ${d.label}: ${d.url}`).join("\n") + (tools.length ? "\n" + tools.map((d) => `- ${d.label}: ${d.url}`).join("\n") : "") +
      (ev.voucher_code ? `\n\n${zh ? "優惠碼" : "Voucher"}: ${ev.voucher_code} (${zh ? "有效期至" : "valid until"} ${expStr}${ev.voucher_note ? " — " + ev.voucher_note : ""})` : "");
  } else {
    subject = opts.subject || (zh
      ? `感謝您報名「${title}」— 很可惜這次未能相見`
      : `Thank you for registering — we're sorry we missed you`);
    const p1 = zh
      ? `感謝您報名參加「${esc(title)}」，很可惜這次您未能到場。${greatLine}`
      : `Thank you for registering for <b>${esc(title)}</b>. We're sorry you couldn't make it. ${greatLine}`;
    const p2 = zh
      ? "我們希望在下一場活動與您相見 — 這是為您的公司獲得寶貴工具、並結識業界各方人士的絕佳機會。"
      : "We hope to see you at our next event — a great way to get valuable tools for your company and to meet different people from across the industry.";
    const p3 = zh
      ? "活動結束後，我們也會以電子郵件寄送文件與工具，以及我們為餐飲業打造之免費軟體的存取碼。"
      : "You'll also receive the event documents and tools by email, along with access codes for the free software technology we built for F&B.";
    bodyHtml =
      `<p>${zh ? "您好，" : "Hello,"}</p>` +
      (note ? `<p>${esc(note)}</p>` : "") +
      `<p>${p1}</p><p>${p2}</p><p>${p3}</p>` +
      (tools.length ? `<div style='margin-top:10px'><b>🔗 ${zh ? "工具" : "Tools"}:</b>${linkList(tools)}</div>` : "");
    bodyText = (note ? note + "\n\n" : "") +
      (zh ? `感謝您報名「${title}」，很可惜這次您未能到場。${greatLine}\n\n${p2}\n\n${p3}` : `Thank you for registering for ${title}. We're sorry you couldn't make it. ${greatLine}\n\n${p2}\n\n${p3}`);
  }

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;color:#23211c;max-width:600px">
      <div style="background:#2f7d4f;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0">
        <div style="font-size:18px;font-weight:700">${esc(brand)}</div>
        <div style="opacity:.9;font-size:13px">${esc(title)} — ${esc(U.fmtDate(ev.date))}</div>
      </div>
      <div style="border:1px solid #e4e1d9;border-top:none;border-radius:0 0 10px 10px;padding:18px;font-size:14px;line-height:1.6">
        ${bodyHtml}
        ${U.signature()}
      </div>
    </div>`;
  const text = bodyText + "\n\n" + (cfg.SIGNATURE_TEXT || "");
  return { subject, html, text };
}

function voucherBox(ev, expStr, zh, esc) {
  return `<div style="margin-top:16px;padding:14px 16px;background:#eef7f0;border:1px dashed #2f7d4f;border-radius:10px">
    <div style="font-size:13px;color:#2f7d4f;font-weight:700">${zh ? "🎁 工具優惠碼" : "🎁 Your tools voucher"}</div>
    <div style="font-size:20px;font-weight:800;letter-spacing:.5px;margin:6px 0">${esc(ev.voucher_code)}</div>
    <div style="font-size:12px;color:#555">${zh ? "有效期至" : "Valid until"} <b>${esc(expStr)}</b>${ev.voucher_note ? " · " + esc(ev.voucher_note) : ""}</div>
  </div>`;
}
