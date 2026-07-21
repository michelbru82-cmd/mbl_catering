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
  const COLLS = ["allergens", "ingredients", "recipes", "sites", "menu_days", "people", "subscribers", "settings", "places"];
  // Collections that belong to ONE catering place (filtered by the active place).
  // ingredients / recipes / allergens are shared master data (not scoped).
  const PLACE_COLLS = ["menu_days", "people", "subscribers", "settings"];
  const APKEY = "mbl_active_place";
  let activePlaceId = null;
  const cfg = window.MBL_CONFIG || {};
  // Login isolation: never connect to a Supabase project used by another MBL
  // app (MBL Tools / MBL Shopping), or the two would share the same users.
  // Compare by project ref (the "xxxx" in https://xxxx.supabase.co).
  const projRef = (u) => { try { return new URL(u).hostname.split(".")[0].toLowerCase(); } catch (e) { return ""; } };
  const forbiddenRefs = (cfg.OTHER_APP_SUPABASE_URLS || []).map(projRef).filter(Boolean);
  const sharesOtherApp = !!cfg.SUPABASE_URL && forbiddenRefs.includes(projRef(cfg.SUPABASE_URL));
  if (sharesOtherApp) {
    console.error("[MBL Catering] Refusing to connect: SUPABASE_URL is a project listed in OTHER_APP_SUPABASE_URLS (used by another MBL app). Catering must use its OWN Supabase project so logins stay separate. Falling back to local mode.");
  }
  const useSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase) && !sharesOtherApp;
  // Exposed so the Connect-database dialog can block forbidden projects too.
  window.MBL_projRef = projRef;
  window.MBL_forbiddenRefs = forbiddenRefs;

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
    // people "kind" renamed: kid -> student (teacher added as a new option in the UI)
    (cache.people || []).forEach((p) => { if (p.kind === "kid") p.kind = "student"; });
  }

  const cache = {}; COLLS.forEach((c) => (cache[c] = []));
  // Per-user "hidden" library items: a user can remove a SHARED (owner-less)
  // allergen/ingredient/recipe from their own view without deleting it for
  // everyone. Stored in the hidden_items table (Supabase) or localStorage (local).
  const HIDE_COLLS = ["allergens", "ingredients", "recipes"];
  const hidden = {}; HIDE_COLLS.forEach((c) => (hidden[c] = new Set()));
  const HIDDEN_LSKEY = "mbl_hidden_v1";
  function loadHiddenLocal() {
    try { const o = JSON.parse(localStorage.getItem(HIDDEN_LSKEY) || "{}"); HIDE_COLLS.forEach((c) => (hidden[c] = new Set(o[c] || []))); } catch (e) {}
  }
  function persistHiddenLocal() {
    try { const o = {}; HIDE_COLLS.forEach((c) => (o[c] = [...hidden[c]])); localStorage.setItem(HIDDEN_LSKEY, JSON.stringify(o)); } catch (e) {}
  }
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
  // Surface cloud write failures instead of failing silently.
  function sbErr(op, coll, error) {
    console.error("Supabase " + op, coll, error);
    try { if (window.U && U.toast) U.toast("Cloud " + op + " failed: " + ((error && error.message) || "error"), true); } catch (e) {}
  }
  // Best-effort activity logging (never blocks or breaks the main write).
  const LOG_COLLS = new Set(["menu_days", "recipes", "ingredients", "people", "subscribers", "places", "allergens", "settings", "sites", "newsletter_log"]);
  function logAct(action, coll, row) {
    try {
      if (!sb || !LOG_COLLS.has(coll)) return;
      const email = (window.Auth && Auth.user && Auth.user.email) || null;
      const label = row ? (row.name || row.name_en || row.title || row.date || row.email || null) : null;
      sb.from("activity_log").insert({ action, entity: coll, entity_id: row && row.id != null ? String(row.id) : null, label, actor_email: email }).then(() => {}, () => {});
    } catch (e) { /* logging must never throw */ }
  }
  const Supa = {
    async load() {
      sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      await Promise.all(COLLS.map(async (c) => {
        const { data, error } = await sb.from(c).select("*");
        if (error) { console.error("Supabase load", c, error); cache[c] = []; }
        else cache[c] = data || [];
      }));
    },
    async create(coll, obj) { const { data, error } = await sb.from(coll).insert(obj).select().single(); if (error) { sbErr("save", coll, error); throw error; } cache[coll].push(data); logAct("create", coll, data); return data; },
    async update(coll, id, patch) { const { data, error } = await sb.from(coll).update(patch).eq("id", id).select().single(); if (error) { sbErr("update", coll, error); throw error; } const i = cache[coll].findIndex((x) => x.id === id); if (i >= 0) cache[coll][i] = data; logAct("update", coll, data); return data; },
    async remove(coll, id) { const prev = cache[coll].find((x) => x.id === id); const { error } = await sb.from(coll).delete().eq("id", id); if (error) { sbErr("delete", coll, error); throw error; } cache[coll] = cache[coll].filter((x) => x.id !== id); logAct("delete", coll, prev || { id }); },
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
    // The live Supabase client (created during load) — used by auth.js for
    // email sign-in. Null in local demo mode.
    supaClient: () => sb,
    // Record an app-level action (login / menu generation) in the activity log.
    logActivity(action, entity, label) {
      try {
        if (!sb) return;
        const email = (window.Auth && Auth.user && Auth.user.email) || null;
        sb.from("activity_log").insert({ action, entity: entity || null, label: label || null, actor_email: email }).then(() => {}, () => {});
      } catch (e) { /* never throws */ }
    },
    // Drop activity older than 3 months (called by admin when viewing history).
    pruneActivity() { try { if (sb) sb.rpc("prune_activity_log").then(() => {}, () => {}); } catch (e) {} },
    // all() auto-scopes per-place collections to the active place; allRaw() is unscoped.
    // Recipes: shop places have their OWN catalogue (place_id === active shop); catering
    // places share the master recipes (place_id null). This keeps a pastry shop's products
    // separate from the catering menus.
    all: (c) => {
      let list;
      if (c === "recipes") {
        const shop = Data.activePlaceType() === "shop";
        list = (cache.recipes || []).filter((r) => shop ? r.place_id === activePlaceId : (r.place_id == null));
      } else {
        list = PLACE_COLLS.includes(c) ? (cache[c] || []).filter((x) => x.place_id === activePlaceId) : (cache[c] || []);
      }
      // Drop items the current user has hidden from their own view.
      if (hidden[c] && hidden[c].size) list = list.filter((x) => !hidden[c].has(x.id));
      return list;
    },
    allRaw: (c) => cache[c] || [],
    get: (c, id) => (cache[c] || []).find((x) => x.id === id) || null,
    // Demo gate: without full access the seed data is read-only. A blocked write
    // pops the subscribe modal and rejects. (Auth may not be loaded yet at boot;
    // the app's own seeding writes cache directly and never hits this.)
    canEdit: () => !(window.Auth && typeof Auth.hasFullAccess === "function") || Auth.hasFullAccess(),
    _guard() {
      if (Data.canEdit()) return true;
      if (window.Auth && Auth.showSubscribe) { try { Auth.showSubscribe(); } catch (e) {} }
      return false;
    },
    create: (c, o) => {
      if (!Data._guard()) return Promise.reject(new Error(I18N.t("demoBlocked")));
      // Assign a primary key up-front. Supabase id columns are `text primary key`
      // with no default, so an insert without an id is rejected by Postgres — this
      // is what made new ingredients (and recipes/people/etc.) silently fail to
      // save in cloud mode. The local adapter already generated ids, so local
      // mode was unaffected — which is why it "worked for me but not for them".
      if (o && o.id == null) o.id = newId(c.slice(0, 3));
      if (PLACE_COLLS.includes(c) && o && o.place_id == null) o.place_id = activePlaceId;
      // new recipes created inside a shop place belong to that shop
      if (c === "recipes" && o && o.place_id == null && Data.activePlaceType() === "shop") o.place_id = activePlaceId;
      // Shared "original library": allergens/ingredients and catering master recipes
      // added by an admin are owner-less (owner_id null) so every user can see them.
      if (useSupabase && o && window.Auth && Auth.isAdmin && Auth.isAdmin()) {
        if (c === "allergens" || c === "ingredients" || (c === "recipes" && o.place_id == null)) o.owner_id = null;
      }
      return adapter.create(c, o);
    },
    update: (c, id, p) => Data._guard() ? adapter.update(c, id, p) : Promise.reject(new Error(I18N.t("demoBlocked"))),
    remove: (c, id) => Data._guard() ? adapter.remove(c, id) : Promise.reject(new Error(I18N.t("demoBlocked"))),
    resetLocal: () => { if (!useSupabase) Local.reset(); },

    // ---------- per-user hide of shared library items ----------
    canHide: (c) => HIDE_COLLS.includes(c),
    isHidden: (c, id) => !!(hidden[c] && hidden[c].has(id)),
    hiddenIds: (c) => (hidden[c] ? [...hidden[c]] : []),
    hiddenCount: (c) => (hidden[c] ? hidden[c].size : 0),
    async hideItem(c, id) {
      if (!HIDE_COLLS.includes(c)) return;
      hidden[c].add(id);
      if (useSupabase && sb) { try { await sb.from("hidden_items").upsert({ coll: c, item_id: id }, { onConflict: "owner_id,coll,item_id" }); } catch (e) { console.error("hideItem", e); } }
      else persistHiddenLocal();
    },
    async unhideItem(c, id) {
      if (!hidden[c]) return;
      hidden[c].delete(id);
      if (useSupabase && sb) { try { await sb.from("hidden_items").delete().eq("coll", c).eq("item_id", id); } catch (e) { console.error("unhideItem", e); } }
      else persistHiddenLocal();
    },
    // True when "deleting" this item would only hide it from the current user's
    // view (a shared, owner-less library item + a non-admin) rather than delete
    // it for everyone. (In local/demo mode the single owner is admin, so this is
    // false and deletes are real.)
    willHide(c, item) {
      return !!(item && item.owner_id == null && HIDE_COLLS.includes(c) &&
        window.Auth && !(Auth.isAdmin && Auth.isAdmin()));
    },
    // Delete an item the "right" way: a shared (owner-less) library item is only
    // HIDDEN from a non-admin's own view; own items and admin actions really delete.
    removeOrHide(c, item) {
      if (!item) return Promise.resolve();
      return Data.willHide(c, item) ? Data.hideItem(c, item.id) : Data.remove(c, item.id);
    },

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
    // Local demo fabricates default places; Supabase mode gets ONE real place
    // for a brand-new user (their own isolated dataset) so the app is usable.
    if (useSupabase) {
      if (!Array.isArray(cache.places) || cache.places.length === 0) {
        try { await Supa.create("places", { id: newId("place"), name: "My catering", type: "catering", covers: 100, use_by_days: 2, food_cost_pct: 30 }); }
        catch (e) { console.error("seed place", e); }
      }
    } else {
      ensurePlaces();
    }
    migratePlaces();
    if (!useSupabase) Local.persist();
    // load this user's hidden library items
    if (useSupabase && sb) {
      try { const { data } = await sb.from("hidden_items").select("coll,item_id"); (data || []).forEach((r) => { if (hidden[r.coll]) hidden[r.coll].add(r.item_id); }); }
      catch (e) { /* table may not exist yet — ignore */ }
    } else loadHiddenLocal();
    // resolve the active place (persisted choice, else the first place)
    let stored = null; try { stored = localStorage.getItem(APKEY); } catch (e) {}
    activePlaceId = (stored && (cache.places || []).some((p) => p.id === stored)) ? stored : ((cache.places[0] || {}).id || null);
    const badge = document.getElementById("dataSrc"); if (badge) badge.textContent = Data.source;
    readyResolve();
  })();

  window.Data = Data;
})();
