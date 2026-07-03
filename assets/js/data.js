/* ============================================================
   MBL Catering — Data layer
   ------------------------------------------------------------
   Uniform CRUD API used by every page. Two interchangeable
   adapters return IDENTICAL plain objects:
     • SupabaseAdapter — when SUPABASE_URL/KEY are set in config.js
     • LocalAdapter    — seed data (assets/js/seed.js) + localStorage
   Relations (recipe items, menu slots, allergen_ids) are stored
   as JSONB columns / nested arrays, so both adapters match.

   Collections: allergens, ingredients, recipes, sites,
                menu_days, people, subscribers
   API:
     Data.ready()                      -> Promise (resolves when loaded)
     Data.all(coll)                    -> array (sync, from cache)
     Data.get(coll, id)                -> object | null
     await Data.create(coll, obj)      -> created obj (id assigned)
     await Data.update(coll, id, patch)-> updated obj
     await Data.remove(coll, id)
     Data.source                       -> "local" | "supabase"
   ============================================================ */
(function () {
  const COLLS = ["allergens", "ingredients", "recipes", "sites", "menu_days", "people", "subscribers", "settings", "places", "events", "event_registrations", "event_sends"];
  // Collections that belong to ONE catering place (filtered by the active place).
  // ingredients / recipes / allergens are shared master data (not scoped).
  const PLACE_COLLS = ["menu_days", "people", "subscribers", "settings"];
  const APKEY = "mbl_active_place";
  let activePlaceId = null;
  const cfg = window.MBL_CONFIG || {};
  const useSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);

  // Seed the default catering places + tag any legacy (place-less) records.
  function ensurePlaces() {
    if (!Array.isArray(cache.places)) cache.places = [];
    if (!cache.places.length) cache.places = [
      { id: "place_school_abc", name: "School ABC", name_zh: "", type: "catering", covers: 100, use_by_days: 2, food_cost_pct: 30 },
      { id: "place_corp_zac", name: "Corporate ZAC", name_zh: "", type: "catering", covers: 50, use_by_days: 2, food_cost_pct: 30 },
      { id: "place_corp_fgh", name: "Corporate FGH", name_zh: "", type: "catering", covers: 50, use_by_days: 2, food_cost_pct: 30 },
    ];
  }
  function migratePlaces() {
    const def = (cache.places[0] || {}).id; if (!def) return;
    PLACE_COLLS.forEach((c) => (cache[c] || []).forEach((r) => { if (r.place_id == null) r.place_id = def; }));
    // legacy single menu-builder config -> place-scoped id
    (cache.settings || []).forEach((s) => { if (s.id === "menu_config") s.id = "menu_config__" + def; });
    // default type/margin on any older place records
    (cache.places || []).forEach((p) => { if (p.type == null) p.type = "catering"; if (p.food_cost_pct == null) p.food_cost_pct = 30; });
  }

  // Seed a couple of demo events + registrations (local demo mode only).
  function ensureEvents() {
    if (!Array.isArray(cache.events)) cache.events = [];
    if (!Array.isArray(cache.event_registrations)) cache.event_registrations = [];
    if (!Array.isArray(cache.event_sends)) cache.event_sends = [];
    if (cache.events.length) return;
    cache.events = [
      {
        id: "ev_tech_jun", title_en: "MBL Tech Evening — Tools for F&B", title_zh: "MBL 科技之夜 — 餐飲工具",
        date: "2026-06-18", start_time: "18:30", end_time: "21:30",
        location: "Taipei · Xinyi", location_zh: "台北 · 信義",
        description: "An evening about the free software technology we built for F&B, with demos, drinks and industry networking.",
        description_zh: "一場關於我們為餐飲業打造的免費軟體技術的夜晚，包含實機示範、飲品與業界交流。",
        schedule: [
          { time: "18:30", item_en: "Welcome drinks", item_zh: "迎賓飲品" },
          { time: "19:00", item_en: "Keynote: tech for F&B", item_zh: "主題演講：餐飲科技" },
          { time: "19:45", item_en: "Live tool demos", item_zh: "工具實機示範" },
          { time: "20:30", item_en: "Networking & tastings", item_zh: "交流與試吃" },
        ],
        speakers: [
          { name: "Michel Bru", title: "Founder, MBL", bio: "20+ years in F&B operations and technology." },
          { name: "Guest Speaker", title: "Head of Product", bio: "Building automation tools for kitchens." },
        ],
        documents: [
          { label: "Event slides (PDF)", url: "https://www.fbws.tw/docs/mbl-tech-evening.pdf" },
          { label: "Tool one-pager", url: "https://www.fbws.tw/docs/mbl-tools.pdf" },
        ],
        tool_links: [
          { label: "MBL Catering app", url: "https://www.fbws.tw/mbl_catering" },
          { label: "MBL CRM", url: "https://www.fbws.tw/mbl_crm" },
        ],
        voucher_code: "MBL_TechnOLOGY_2026",
        voucher_note: "Can be used only once.",
        attendees: null, archived_at: null, created_at: "2026-05-20",
      },
      {
        id: "ev_tech_aug", title_en: "MBL Tech Evening — Automation Night", title_zh: "MBL 科技之夜 — 自動化之夜",
        date: "2026-08-20", start_time: "18:30", end_time: "21:30",
        location: "Taipei · Xinyi", location_zh: "台北 · 信義",
        description: "The next evening — kitchen automation, live demos and networking.",
        description_zh: "下一場夜晚 — 廚房自動化、實機示範與交流。",
        schedule: [], speakers: [], documents: [], tool_links: [],
        voucher_code: "", voucher_note: "", attendees: null, archived_at: null, created_at: "2026-06-25",
      },
    ];
    const reg = (id, event_id, name, email, company, job_title, phone) =>
      ({ id, event_id, name, email, company, job_title, phone, created_at: "2026-06-01" });
    cache.event_registrations = [
      reg("reg_1", "ev_tech_jun", "Amélie Chen", "amelie.chen@example.com", "Lumière Bistro", "Owner", "+886 912 000 001"),
      reg("reg_2", "ev_tech_jun", "David Lin", "david.lin@example.com", "Green Table Co.", "Operations Manager", "+886 912 000 002"),
      reg("reg_3", "ev_tech_jun", "Sophie Wang", "sophie.wang@example.com", "Harvest Catering", "Chef", "+886 912 000 003"),
      reg("reg_4", "ev_tech_jun", "Marco Rossi", "marco.rossi@example.com", "Trattoria 88", "Founder", "+886 912 000 004"),
      reg("reg_5", "ev_tech_jun", "Yuki Tanaka", "yuki.tanaka@example.com", "Sakura F&B", "Marketing Lead", "+886 912 000 005"),
      reg("reg_6", "ev_tech_jun", "Emma Dubois", "emma.dubois@example.com", "Café Central", "Manager", "+886 912 000 006"),
      reg("reg_7", "ev_tech_aug", "Liam Murphy", "liam.murphy@example.com", "Northside Grill", "Owner", "+886 912 000 007"),
      reg("reg_8", "ev_tech_aug", "Chloé Martin", "chloe.martin@example.com", "Bistro Bleu", "Chef", "+886 912 000 008"),
    ];
  }

  const cache = {}; COLLS.forEach((c) => (cache[c] = []));
  let readyResolve; const readyPromise = new Promise((r) => (readyResolve = r));

  // simple id generator (avoids Date.now/Math.random ban concerns in app runtime is fine here,
  // but we keep it deterministic-ish + unique enough for client use)
  let counter = 0;
  function newId(prefix) { counter++; return `${prefix}_${counter.toString(36)}${performance.now().toString(36).replace(".", "")}`; }

  /* ---------------- LOCAL adapter ---------------- */
  const Local = {
    LSKEY: "mbl_data_v1",
    load() {
      let stored = null;
      try { stored = JSON.parse(localStorage.getItem(this.LSKEY) || "null"); } catch (e) {}
      const seed = window.MBL_SEED || {};
      const seedVer = window.MBL_SEED_VERSION || 0;
      COLLS.forEach((c) => {
        cache[c] = (stored && Array.isArray(stored[c])) ? stored[c] : JSON.parse(JSON.stringify(seed[c] || []));
      });
      // Auto-refresh reference data (ingredients + recipes) when a newer dataset
      // ships, re-linking menu slots by name. Keeps menus, people & subscribers.
      if (stored && (stored._seedVersion || 0) !== seedVer) {
        cache.ingredients = JSON.parse(JSON.stringify(seed.ingredients || []));
        cache.recipes = JSON.parse(JSON.stringify(seed.recipes || []));
        this.relinkMenus();
      }
      this.persist();
    },
    relinkMenus() {
      const norm = (s) => (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
      const byName = {}; cache.recipes.forEach((r) => { if (r.name_en) byName[norm(r.name_en)] = r.id; });
      cache.menu_days.forEach((d) => { if (!d.slots) return; Object.keys(d.slots).forEach((k) => { const s = d.slots[k]; if (s) s.recipe_id = byName[norm(s.name_en)] || null; }); });
    },
    persist() { try { const o = {}; COLLS.forEach((c) => (o[c] = cache[c])); o._seedVersion = window.MBL_SEED_VERSION || 0; localStorage.setItem(this.LSKEY, JSON.stringify(o)); } catch (e) {} },
    reset() { try { localStorage.removeItem(this.LSKEY); } catch (e) {} this.load(); },
    async create(coll, obj) { obj.id = obj.id || newId(coll.slice(0, 3)); cache[coll].push(obj); this.persist(); return obj; },
    async update(coll, id, patch) { const i = cache[coll].findIndex((x) => x.id === id); if (i < 0) return null; cache[coll][i] = Object.assign({}, cache[coll][i], patch); this.persist(); return cache[coll][i]; },
    async remove(coll, id) { cache[coll] = cache[coll].filter((x) => x.id !== id); this.persist(); },
  };

  /* ---------------- SUPABASE adapter ---------------- */
  let sb = null;
  const loadErrors = {}; // coll -> error, when a table fails to load (e.g. missing table)
  const Supa = {
    async load() {
      sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      await Promise.all(COLLS.map(async (c) => {
        const { data, error } = await sb.from(c).select("*");
        if (error) { console.error("Supabase load", c, error); cache[c] = []; loadErrors[c] = error; }
        else { cache[c] = data || []; delete loadErrors[c]; }
      }));
    },
    async create(coll, obj) { const { data, error } = await sb.from(coll).insert(obj).select().single(); if (error) throw error; cache[coll].push(data); return data; },
    async update(coll, id, patch) { const { data, error } = await sb.from(coll).update(patch).eq("id", id).select().single(); if (error) throw error; const i = cache[coll].findIndex((x) => x.id === id); if (i >= 0) cache[coll][i] = data; return data; },
    async remove(coll, id) { const { error } = await sb.from(coll).delete().eq("id", id); if (error) throw error; cache[coll] = cache[coll].filter((x) => x.id !== id); },
    async sendNewsletter(payload) {
      const { data, error } = await sb.functions.invoke(cfg.NEWSLETTER_FUNCTION || "send-newsletter", { body: payload });
      if (error) throw error; return data;
    },
  };

  const adapter = useSupabase ? Supa : Local;

  const Data = {
    source: useSupabase ? "supabase" : "local",
    COLLS, PLACE_COLLS,
    ready: () => readyPromise,
    // all() auto-scopes per-place collections to the active place; allRaw() is unscoped.
    // Recipes: shop places have their OWN catalogue (place_id === active shop); catering
    // places share the master recipes (place_id null). This keeps a pastry shop's products
    // separate from the catering menus.
    all: (c) => {
      if (c === "recipes") {
        const shop = Data.activePlaceType() === "shop";
        return (cache.recipes || []).filter((r) => shop ? r.place_id === activePlaceId : (r.place_id == null));
      }
      return PLACE_COLLS.includes(c) ? (cache[c] || []).filter((x) => x.place_id === activePlaceId) : (cache[c] || []);
    },
    allRaw: (c) => cache[c] || [],
    get: (c, id) => (cache[c] || []).find((x) => x.id === id) || null,
    create: (c, o) => {
      if (PLACE_COLLS.includes(c) && o && o.place_id == null) o.place_id = activePlaceId;
      // new recipes created inside a shop place belong to that shop
      if (c === "recipes" && o && o.place_id == null && Data.activePlaceType() === "shop") o.place_id = activePlaceId;
      return adapter.create(c, o);
    },
    update: (c, id, p) => adapter.update(c, id, p),
    remove: (c, id) => adapter.remove(c, id),
    resetLocal: () => { if (!useSupabase) Local.reset(); },

    // ---------- catering places ----------
    places: () => cache.places || [],
    activePlaceId: () => activePlaceId,
    activePlace: () => (cache.places || []).find((p) => p.id === activePlaceId) || null,
    activePlaceType() { const p = this.activePlace(); return (p && p.type) || "catering"; },
    setActivePlace(id) { if ((cache.places || []).some((p) => p.id === id)) { activePlaceId = id; try { localStorage.setItem(APKEY, id); } catch (e) {} } },

    // Replace ingredients + recipes with the bundled MBL dataset (window.MBL_SEED),
    // re-linking existing menu-day slots to the new recipes by name. Keeps menus,
    // people and subscribers. Local mode only (Supabase: run supabase/seed.sql).
    async importMbl() {
      if (useSupabase) throw new Error("Connected to Supabase — import via supabase/seed.sql instead.");
      const seed = window.MBL_SEED || {};
      cache.ingredients = JSON.parse(JSON.stringify(seed.ingredients || []));
      cache.recipes = JSON.parse(JSON.stringify(seed.recipes || []));
      const norm = (s) => (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
      const byName = {}; cache.recipes.forEach((r) => { if (r.name_en) byName[norm(r.name_en)] = r.id; });
      cache.menu_days.forEach((d) => {
        if (!d.slots) return;
        Object.keys(d.slots).forEach((k) => { const s = d.slots[k]; if (s) s.recipe_id = byName[norm(s.name_en)] || null; });
      });
      Local.persist();
      return { ingredients: cache.ingredients.length, recipes: cache.recipes.length };
    },
    async sendNewsletter(payload) {
      if (useSupabase) return Supa.sendNewsletter(payload);
      // local mode: pretend-queue
      return { ok: true, queued: true, count: payload.recipients ? payload.recipients.length : 0, local: true };
    },

    /* ---------- domain helpers (shared by pages) ---------- */
    allergenName(id) { const a = this.get("allergens", id); return a ? I18N.pick(a, "name") : id; },
    siteName(id) { const s = this.get("sites", id); return s ? I18N.pick(s, "name") : ""; },

    // total covers across all sites (active people fallback to sites.covers)
    totalCovers() {
      const p = this.activePlace();
      const byPlace = p ? (p.covers || 0) : 0;
      return byPlace || this.activePeople().length;
    },
    coversForSite(siteId) { const s = this.get("sites", siteId); return s ? (s.covers || 0) : 0; },

    activePeople(onDate) {
      const d = onDate || U.TODAY;
      return this.all("people").filter((p) => (!p.date_in || p.date_in <= d) && (!p.date_out || p.date_out >= d));
    },

    // recipe nutrition computed from linked ingredients (per portion, where ingredient macros exist)
    recipeNutrition(recipe) {
      const KEYS = ["kcal", "protein", "carbs", "fat", "sugar", "added_sugar", "fiber", "sodium", "calcium", "salt"];
      const out = {}; KEYS.forEach((k) => (out[k] = 0));
      let any = false;
      (recipe.items || []).forEach((it) => {
        const ing = it.ingredient_id && this.get("ingredients", it.ingredient_id);
        if (!ing || it.grams == null) return;
        const f = it.grams / 100;
        KEYS.forEach((k) => {
          if (ing[k] != null) { out[k] += ing[k] * f; any = true; }
        });
      });
      if (!any) return null;
      Object.keys(out).forEach((k) => (out[k] = Math.round(out[k] * 10) / 10));
      return out;
    },

    // ingredient cost per cover for a recipe (needs ingredient.price_per_kg + item grams)
    recipeCost(recipe) {
      if (!recipe) return null;
      let c = 0, any = false;
      (recipe.items || []).forEach((it) => {
        const ing = it.ingredient_id && this.get("ingredients", it.ingredient_id);
        if (ing && ing.price_per_kg != null && it.grams != null) { c += (it.grams / 1000) * ing.price_per_kg; any = true; }
      });
      return any ? Math.round(c * 100) / 100 : null;
    },

    recipeAllergens(recipe) {
      const set = new Set(recipe.allergen_ids || []);
      (recipe.items || []).forEach((it) => {
        const ing = it.ingredient_id && this.get("ingredients", it.ingredient_id);
        if (ing) (ing.allergen_ids || []).forEach((a) => set.add(a));
      });
      return [...set];
    },

    menuForDate(date) { return this.all("menu_days").find((m) => m.date === date) || null; },

    /* ---------- Supabase load diagnostics ---------- */
    // A collection failed to load from Supabase (only meaningful in supabase mode).
    loadError(coll) { return loadErrors[coll] || null; },
    // The collection's table appears to be missing from the database (needs migration).
    tableMissing(coll) {
      const e = loadErrors[coll]; if (!e) return false;
      const code = String(e.code || ""), msg = String(e.message || "").toLowerCase();
      return code === "42P01" || code === "PGRST205" || code === "PGRST202" ||
             msg.includes("does not exist") || msg.includes("could not find the table") || msg.includes("schema cache");
    },

    /* ---------- events (company-wide) ---------- */
    eventIsPast(ev) { return !!ev && ev.date < U.realToday(); },
    eventsByDate() { return this.all("events").slice().sort((a, b) => b.date.localeCompare(a.date)); },
    upcomingEvents() { return this.eventsByDate().filter((e) => !this.eventIsPast(e)).sort((a, b) => a.date.localeCompare(b.date)); },
    pastEvents() { return this.eventsByDate().filter((e) => this.eventIsPast(e)); },
    registrationsForEvent(eventId) {
      return this.all("event_registrations").filter((r) => r.event_id === eventId)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    },
    // The guest list to show. Past events read their frozen snapshot; upcoming
    // events read the live registrations (which fill up on the website).
    eventAttendees(ev) {
      if (!ev) return [];
      if (Array.isArray(ev.attendees)) return ev.attendees;
      return this.registrationsForEvent(ev.id).map((r) => ({
        id: r.id, name: r.name, email: r.email, company: r.company,
        job_title: r.job_title, phone: r.phone, attended: false, source: "web",
      }));
    },
    // Freeze the live registrations into events.attendees the first time a past
    // event is opened, so its guest list keeps every detail from then on.
    async ensureArchived(ev) {
      if (!ev || !this.eventIsPast(ev) || Array.isArray(ev.attendees)) return ev;
      const snapshot = this.registrationsForEvent(ev.id).map((r) => ({
        id: r.id, name: r.name, email: r.email, company: r.company,
        job_title: r.job_title, phone: r.phone, attended: false, source: "web",
      }));
      return await this.update("events", ev.id, { attendees: snapshot, archived_at: U.realToday() });
    },

    // allergens present in a day's menu (union across slots' recipes + any explicit)
    dayAllergens(menuDay) {
      if (!menuDay) return [];
      const set = new Set();
      ["meat", "veg1", "veg2", "carb", "dairy", "fruit", "side"].forEach((s) => {
        const slot = menuDay.slots && menuDay.slots[s];
        if (!slot) return;
        const r = slot.recipe_id && this.get("recipes", slot.recipe_id);
        if (r) this.recipeAllergens(r).forEach((a) => set.add(a));
      });
      return [...set];
    },
  };

  // boot
  (async function () {
    if (useSupabase) { try { await Supa.load(); } catch (e) { console.error(e); } }
    else Local.load();
    ensurePlaces(); migratePlaces();
    if (!useSupabase) ensureEvents();
    if (!useSupabase) Local.persist();
    // resolve the active place (persisted choice, else the first place)
    let stored = null; try { stored = localStorage.getItem(APKEY); } catch (e) {}
    activePlaceId = (stored && (cache.places || []).some((p) => p.id === stored)) ? stored : ((cache.places[0] || {}).id || null);
    const badge = document.getElementById("dataSrc"); if (badge) badge.textContent = Data.source;
    readyResolve();
  })();

  window.Data = Data;
})();
