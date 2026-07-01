/* ============================================================
   MBL CRM — Data layer
   ------------------------------------------------------------
   Uniform CRUD API used by every page. Two interchangeable
   adapters return IDENTICAL plain objects:
     • SupabaseAdapter — when SUPABASE_URL/KEY are set / connected
     • LocalAdapter    — demo data (assets/js/seed.js) + localStorage

   Collections: contacts, companies, deals, tasks, activities
   API:
     Data.ready()                       -> Promise (resolves when loaded)
     Data.all(coll)                     -> array (sync, from cache)
     Data.get(coll, id)                 -> object | null
     await Data.create(coll, obj)       -> created obj (id assigned)
     await Data.update(coll, id, patch) -> updated obj
     await Data.remove(coll, id)
     Data.source                        -> "local" | "supabase"
   ============================================================ */
(function () {
  const COLLS = ["contacts", "companies", "deals", "tasks", "activities"];
  const cfg = window.MBL_CONFIG || {};
  const useSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);

  const cache = {}; COLLS.forEach((c) => (cache[c] = []));
  let readyResolve; const readyPromise = new Promise((r) => (readyResolve = r));

  let counter = 0;
  function newId(prefix) { counter++; return `${prefix}_${counter.toString(36)}${performance.now().toString(36).replace(".", "")}`; }

  /* ---------------- LOCAL adapter ---------------- */
  const Local = {
    LSKEY: "mblcrm_data_v1",
    load() {
      let stored = null;
      try { stored = JSON.parse(localStorage.getItem(this.LSKEY) || "null"); } catch (e) {}
      const seed = window.MBLCRM_SEED || {};
      COLLS.forEach((c) => {
        cache[c] = (stored && Array.isArray(stored[c])) ? stored[c] : JSON.parse(JSON.stringify(seed[c] || []));
      });
      this.persist();
    },
    persist() { try { const o = {}; COLLS.forEach((c) => (o[c] = cache[c])); localStorage.setItem(this.LSKEY, JSON.stringify(o)); } catch (e) {} },
    reset() { try { localStorage.removeItem(this.LSKEY); } catch (e) {} this.load(); },
    async create(coll, obj) { obj.id = obj.id || newId(coll.slice(0, 3)); cache[coll].push(obj); this.persist(); return obj; },
    async update(coll, id, patch) { const i = cache[coll].findIndex((x) => x.id === id); if (i < 0) return null; cache[coll][i] = Object.assign({}, cache[coll][i], patch); this.persist(); return cache[coll][i]; },
    async remove(coll, id) { cache[coll] = cache[coll].filter((x) => x.id !== id); this.persist(); },
  };

  /* ---------------- SUPABASE adapter ---------------- */
  let sb = null;
  const Supa = {
    client() { if (!sb) sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY); return sb; },
    async load() {
      this.client();
      await Promise.all(COLLS.map(async (c) => {
        const { data, error } = await sb.from(c).select("*");
        if (error) { console.error("Supabase load", c, error); cache[c] = []; }
        else cache[c] = data || [];
      }));
    },
    async create(coll, obj) { const { data, error } = await sb.from(coll).insert(obj).select().single(); if (error) throw error; cache[coll].push(data); return data; },
    async update(coll, id, patch) { const { data, error } = await sb.from(coll).update(patch).eq("id", id).select().single(); if (error) throw error; const i = cache[coll].findIndex((x) => x.id === id); if (i >= 0) cache[coll][i] = data; return data; },
    async remove(coll, id) { const { error } = await sb.from(coll).delete().eq("id", id); if (error) throw error; cache[coll] = cache[coll].filter((x) => x.id !== id); },
    async invoke(fn, payload) { const { data, error } = await this.client().functions.invoke(fn, { body: payload }); if (error) throw error; return data; },
  };

  const adapter = useSupabase ? Supa : Local;

  const Data = {
    source: useSupabase ? "supabase" : "local",
    COLLS,
    ready: () => readyPromise,
    all: (c) => cache[c] || [],
    get: (c, id) => (cache[c] || []).find((x) => x.id === id) || null,
    async create(c, o) {
      if (!o.created_at) o.created_at = U.TODAY;
      const rec = await adapter.create(c, o);
      return rec;
    },
    update: (c, id, p) => adapter.update(c, id, p),
    remove: (c, id) => adapter.remove(c, id),
    resetLocal: () => { if (!useSupabase) Local.reset(); },
    invoke: (fn, payload) => useSupabase ? Supa.invoke(fn, payload) : Promise.reject(new Error("not connected")),
    supaClient: () => useSupabase ? Supa.client() : null,

    /* ---------- domain helpers ---------- */
    contactName(c) {
      if (!c) return "";
      if (c.full_name) return c.full_name;
      return [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
    },
    initials(c) {
      const n = this.contactName(c) || "?";
      const parts = n.trim().split(/\s+/);
      return ((parts[0] || "")[0] || "") + (parts.length > 1 ? (parts[parts.length - 1][0] || "") : "");
    },
    companyName(c) {
      if (!c) return "";
      if (typeof c === "string") { const co = this.get("companies", c); return co ? co.name : ""; }
      return c.name || "";
    },
    companyOf(contact) {
      if (!contact) return null;
      if (contact.company_id) return this.get("companies", contact.company_id);
      return null;
    },
    contactsOfCompany(companyId) {
      return this.all("contacts").filter((c) => c.company_id === companyId);
    },
    dealsOfCompany(companyId) {
      return this.all("deals").filter((d) => d.company_id === companyId);
    },
    activitiesFor(contactId) {
      return this.all("activities").filter((a) => a.contact_id === contactId)
        .slice().sort((a, b) => (b.at || "").localeCompare(a.at || ""));
    },
    tasksFor(contactId) {
      return this.all("tasks").filter((t) => t.contact_id === contactId);
    },

    // follow-up status vs TODAY: "over" | "today" | "soon" | "future" | null
    followState(iso) {
      if (!iso) return null;
      if (iso < U.TODAY) return "over";
      if (iso === U.TODAY) return "today";
      const soon = U.isoAddDays(U.TODAY, 3);
      if (iso <= soon) return "soon";
      return "future";
    },
    // contacts needing a follow-up now (overdue or today), soonest first
    dueFollowups() {
      return this.all("contacts")
        .filter((c) => c.next_follow_up && c.next_follow_up <= U.TODAY)
        .sort((a, b) => (a.next_follow_up || "").localeCompare(b.next_follow_up || ""));
    },

    // open (non-final) deals
    openDeals() { return this.all("deals").filter((d) => d.stage !== "won" && d.stage !== "lost"); },
    pipelineValue() { return this.openDeals().reduce((s, d) => s + (Number(d.value) || 0), 0); },
    wonRecently(days) {
      const from = U.isoAddDays(U.TODAY, -(days || 30));
      return this.all("deals").filter((d) => d.stage === "won" && (d.close_date || "") >= from);
    },

    // Duplicate detection for imported cards. Returns best match or null.
    // Matches on email (strong) then normalised name + company.
    findDuplicate(cand) {
      const norm = (s) => (s || "").toString().trim().toLowerCase();
      const emails = [cand.email_work, cand.email_home].map(norm).filter(Boolean);
      const name = norm(cand.full_name || [cand.first_name, cand.last_name].join(" "));
      const comp = norm(cand.company_name);
      let best = null, bestScore = 0;
      this.all("contacts").forEach((c) => {
        let score = 0;
        const cEmails = [c.email_work, c.email_home].map(norm).filter(Boolean);
        if (emails.length && cEmails.some((e) => emails.includes(e))) score += 100;
        const cName = norm(this.contactName(c));
        if (name && cName && name === cName) score += 40;
        if (comp && norm(this.companyName(this.companyOf(c))) === comp) score += 20;
        if (score > bestScore) { bestScore = score; best = c; }
      });
      return bestScore >= 40 ? { contact: best, score: bestScore } : null;
    },

    // Ensure a company row exists for a name; returns its id (creates if new).
    async ensureCompany(name) {
      const norm = (s) => (s || "").trim().toLowerCase();
      if (!norm(name)) return null;
      const existing = this.all("companies").find((c) => norm(c.name) === norm(name));
      if (existing) return existing.id;
      const co = await this.create("companies", { name: name.trim() });
      return co.id;
    },

    async logActivity(contactId, kind, note) {
      return this.create("activities", { contact_id: contactId, kind: kind || "note", note: note || "", at: U.TODAY });
    },

    exportJson() {
      const o = {}; COLLS.forEach((c) => (o[c] = cache[c]));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: "application/json" }));
      a.download = "mbl_crm_data.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    },
  };

  // boot
  (async function () {
    if (useSupabase) { try { await Supa.load(); } catch (e) { console.error(e); } }
    else Local.load();
    if (!useSupabase) Local.persist();
    const badge = document.getElementById("dataSrc"); if (badge) badge.textContent = Data.source;
    readyResolve();
  })();

  window.Data = Data;
})();
