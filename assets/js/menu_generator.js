/* ============================================================
   MBL Catering — Menu Generator (in-app, database-only)
   ------------------------------------------------------------
   Builds daily menus from EXISTING recipes only — no invention.
   Respects: per-weekday protein, per-weekday cuisine, rotation
   cap, and nutrition min/max (enforced where macro data exists).
   Reports exactly what's missing when a slot can't be filled.
   ============================================================ */
window.MenuGen = (function () {
  const WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // JS getUTCDay order
  const WD_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const PROTEINS = ["chicken", "beef", "pork", "fish", "duck", "vegetarian", "vegan"];
  const NUTRIENTS = [
    ["kcal", "Calories", "kcal"], ["protein", "Proteins", "g"], ["fat", "Lipids", "g"],
    ["carbs", "Carbs", "g"], ["sugar", "Sugar", "g"], ["added_sugar", "Added Sugar", "g"],
    ["sodium", "Sodium", "g"], ["calcium", "Calcium", "mg"],
  ];
  const COURSES = ["main", "vegetable", "carb", "dairy", "fruit", "side"];

  // ---------- keyword tables for runtime tag derivation ----------
  const KW = {
    chicken: ["chicken", "poultry"],
    duck: ["duck"],
    pork: ["pork", "bacon", "ham ", "gammon", "chorizo", "sausage", "pancetta"],
    beef: ["beef", "sirloin", "bolognaise", "bolognese", "chuck", "steak", "bourguignon", "meatloaf", "cottage pie"],
    fish: ["fish", "salmon", "cod", "tuna", "seabass", "sea bass", "mackerel", "sardine", "trout", "shrimp", "prawn", "squid", "scallop", "seafood"],
    vegan: ["vegan"],
    vegetarian: ["vegetarian", "veggie", "omelette", "quiche", "cheese", "egg", "tofu", "paneer", "halloumi"],
  };
  const ASIAN = ["curry", "tofu", "soy ", "soya", "teriyaki", "schezuan", "sichuan", "szechuan", "stir fry", "stir-fry", "stir fried", "stir-fried", "ramen", "noodle", "dumpling", "bok choy", "choy sum", "miso", "thai", "japanese", "japan", "korean", "chinese", "sushi", "edamame", "coconut curry", "satay", "char siu", "kung pao", "sweet & sour", "sweet and sour", "taiwanese", "daal", " dal ", "tikka", "masala", "biryani", "pad ", "asian", "sesame & ginger", "hoisin", "gochujang", "wonton", "spring roll"];
  const CARB_IN = ["pasta", "spaghetti", "carbonara", "lasagn", "penne", "macaroni", "linguin", "noodle", "risotto", "arborio", "paella", "couscous", "gnocchi", "burrito", "sushi", "biryani", "cottage pie", "shepherd", "ratatouille arborio", "fried rice", "pilaf", "pilau", "dauphinoise"];
  const CARB_DISH = ["rice", "potato", "potatoes", "mash", "linguini", "linguinis", "pasta", "pastas", "noodle", "noodles", "couscous", "quinoa", "arborio", "risotto", "paella", "polenta", "gnocchi", "bread"];
  const DAIRY_DISH = ["yoghurt", "yogurt", "smoothie", "milk", "kefir", "fromage", "cheese cube"];
  const FRUIT_DISH = ["apple", "apples", "orange", "oranges", "mango", "pineapple", "banana", "dragon fruit", "dragon fruits", "mandarin", "grape", "grapes", "melon", "watermelon", "kiwi", "pear", "peach", "berries", "strawberr", "fruit salad"];
  const CAKE_DISH = ["cake", "brownie", "muffin", "tart", "cookie", "pie ", "flan", "pudding", "mousse"];
  const VEG_HINT = ["broccoli", "broccolis", "carrot", "carrots", "spinach", "cauliflower", "cabbage", "beans", "peas", "courgette", "zucchini", "pepper", "peppers", "aubergine", "eggplant", "asparagus", "leek", "greens", "salad", "ratatouille", "veggies", "vegetables", "tomatoes", "onions", "edamame", "corn", "artichoke"];

  const norm = (s) => (s || "").toString().toLowerCase();
  const has = (hay, arr) => arr.some((k) => hay.indexOf(k) >= 0);

  function deriveProtein(name, cat) {
    const h = " " + norm(name) + " | " + norm(cat) + " ";
    if (has(h, KW.vegan) || norm(cat) === "vegan") return "vegan";
    for (const p of ["fish", "chicken", "duck", "pork", "beef"]) if (has(h, KW[p])) return p;
    if (has(h, KW.vegetarian) || norm(cat) === "vegetarian") return "vegetarian";
    return "other";
  }
  function deriveCuisine(name, cat) {
    const h = " " + norm(name) + " | " + norm(cat) + " ";
    return has(h, ASIAN) ? "asian" : "western";
  }
  function deriveCourse(name, cat) {
    const h = norm(name), c = norm(cat);
    // mains usually carry a protein/dish word; check side courses first
    if (has(h, DAIRY_DISH)) return "dairy";
    if (has(h, CAKE_DISH) || (has(h, FRUIT_DISH) && h.split(" ").length <= 4)) return "fruit";
    const proteinish = has(" " + h + " ", KW.chicken.concat(KW.beef, KW.pork, KW.fish, KW.duck)) || c === "vegan" || c === "vegetarian";
    if (!proteinish && has(h, CARB_DISH) && !has(h, VEG_HINT)) return "carb";
    if (!proteinish && has(h, VEG_HINT) && !has(h, ["quiche", "omelette", "lasagn", "gratin", "curry", "stew", "pie", "moussaka", "burrito", "meatball"])) return "vegetable";
    return "main";
  }
  function containsCarb(name) { return has(norm(name), CARB_IN); }

  // stored tag wins; otherwise derive at runtime (robust for pre-tag data)
  function tags(r) {
    return {
      course: r.course || deriveCourse(r.name_en, r.category),
      protein: r.protein || deriveProtein(r.name_en, r.category),
      cuisine: r.cuisine || deriveCuisine(r.name_en, r.category),
      contains_carb: (r.contains_carb != null) ? !!r.contains_carb : containsCarb(r.name_en),
    };
  }

  // ---------- config ----------
  function defaultConfig() {
    return {
      id: "menu_config", name: "Default",
      weekday: {
        mon: { protein: "chicken", cuisine: "western" },
        tue: { protein: "beef", cuisine: "western" },
        wed: { protein: "vegetarian", cuisine: "asian" },
        thu: { protein: "fish", cuisine: "western" },
        fri: { protein: "pork", cuisine: "asian" },
        sat: { protein: "any", cuisine: "any" },
        sun: { protein: "any", cuisine: "any" },
      },
      service_days: ["mon", "tue", "wed", "thu", "fri"],
      nutrition: {},            // { kcal:{min,max,required}, ... }
      rotation_max: 4,          // max appearances within the window
      rotation_window_days: 60, // ~2 months
      min_repeat_gap: 7,        // min days before a dish may repeat
      spread_allergens: true,   // avoid same allergen on consecutive days
      keep_existing: false,     // regenerate all days so nutrition/cost rules are enforced (toggle on to preserve existing menus)
      max_cost: null,           // optional max ingredient cost per cover (NT$)
    };
  }
  function mergeConfig(c) {
    const d = defaultConfig();
    return Object.assign(d, c, { weekday: Object.assign(d.weekday, c.weekday || {}), nutrition: c.nutrition || {} });
  }
  function getConfig(id) {
    const c = Data.get("settings", id || "menu_config");
    return c ? mergeConfig(c) : defaultConfig();
  }
  function listProfiles() {
    const rows = Data.all("settings").filter((s) => s.id === "menu_config" || String(s.id).startsWith("cfg_"));
    if (!rows.some((r) => r.id === "menu_config")) rows.unshift(defaultConfig());
    return rows.map((r) => ({ id: r.id, name: r.name || (r.id === "menu_config" ? "Default" : r.id) }));
  }
  async function saveConfig(cfg, id) {
    cfg.id = id || cfg.id || "menu_config";
    if (Data.get("settings", cfg.id)) return Data.update("settings", cfg.id, cfg);
    return Data.create("settings", cfg);
  }

  // ---------- date helpers ----------
  function weekdayKey(iso) { const [y, m, d] = iso.split("-").map(Number); return WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]; }
  function datesInMonth(ym) {
    const [y, m] = ym.split("-").map(Number);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const out = [];
    for (let d = 1; d <= days; d++) out.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    return out;
  }

  // ---------- pools ----------
  function poolFor(course) { return Data.all("recipes").filter((r) => tags(r).course === course); }

  // ---------- booster library ----------
  // Balanced dishes (built from real ingredients) spanning a wide calorie range per
  // course, so the builder can always hit a min/max target. Added to the database only
  // on explicit user permission (see the menu-builder "add recipes" flow). items: [ingredientId, grams].
  const BOOSTER = [
    { name_en: "Herb-Steamed Chicken Breast", name_zh: "香草蒸雞胸肉", course: "main", items: [["chicken-breast-without-skin", 150]] },
    { name_en: "Seared Beef Sirloin", name_zh: "香煎沙朗牛排", course: "main", items: [["beef-sirloin", 150]] },
    { name_en: "Chicken & Mushroom Sauté", name_zh: "蘑菇炒雞肉", course: "main", items: [["chicken-breast-without-skin", 130], ["paris-mushrooms", 60], ["olive-oil-evoo", 8]] },
    { name_en: "Slow-Braised Pork Belly", name_zh: "慢燉五花肉", course: "main", items: [["pork-belly", 150]] },
    { name_en: "Steamed Brown Rice (small)", name_zh: "糙米飯（小份）", course: "carb", items: [["brown-rice", 55]] },
    { name_en: "Steamed Brown Rice", name_zh: "糙米飯", course: "carb", items: [["brown-rice", 90]] },
    { name_en: "Herbed Couscous", name_zh: "香草北非小米", course: "carb", items: [["couscous", 70]] },
    { name_en: "Buttered Fusilli", name_zh: "奶油螺旋麵", course: "carb", items: [["fusilli", 110], ["butter", 12]] },
    { name_en: "Steamed Broccoli", name_zh: "清蒸青花菜", course: "vegetable", items: [["broccolis", 120]] },
    { name_en: "Garden Salad", name_zh: "田園沙拉", course: "vegetable", items: [["green-salad", 100], ["cherry-tomatoes", 30]] },
    { name_en: "Sautéed Mushrooms in Olive Oil", name_zh: "橄欖油炒蘑菇", course: "vegetable", items: [["paris-mushrooms", 100], ["olive-oil-evoo", 10]] },
    { name_en: "Plain Yoghurt Cup", name_zh: "原味優格", course: "dairy", items: [["fresh-delight-yoghurt", 100]] },
    { name_en: "Edam Cheese Portion", name_zh: "艾登起司", course: "dairy", items: [["edam-cheese", 40]] },
    { name_en: "Comté Cheese Portion", name_zh: "康提起司", course: "dairy", items: [["comte-cheese", 45]] },
    { name_en: "Fresh Apple", name_zh: "蘋果", course: "fruit", items: [["apples", 130]] },
    { name_en: "Fresh Banana", name_zh: "香蕉", course: "fruit", items: [["banana-school", 120]] },
    { name_en: "Pineapple Slices", name_zh: "鳳梨片", course: "fruit", items: [["pineapple", 130]] },
    { name_en: "Green Side Salad", name_zh: "綠沙拉", course: "side", items: [["green-salad", 120]] },
    { name_en: "Garlic Baguette", name_zh: "蒜香法棍", course: "side", items: [["french-baguette", 55], ["olive-oil-evoo", 7]] },
  ];
  // Resolve booster entries against the current ingredient DB (skipping any whose
  // ingredient is missing), computing kcal + allergens. Returns ready-to-save recipes.
  function boosterRecipes() {
    return BOOSTER.map((b) => {
      const items = b.items.map(([id, grams]) => { const ing = Data.get("ingredients", id); return ing ? { ingredient_id: id, name_en: ing.name_en, name_zh: ing.name_zh || "", grams } : null; });
      if (items.some((x) => !x)) return null;
      const alg = new Set(); items.forEach((it) => { const ing = Data.get("ingredients", it.ingredient_id); (ing.allergen_ids || []).forEach((a) => alg.add(a)); });
      const rec = { name_en: b.name_en, name_zh: b.name_zh, category: "Balanced (added)", course: b.course, contains_carb: false, items, allergen_ids: [...alg] };
      const n = Data.recipeNutrition(rec); rec.kcal = n && n.kcal != null ? Math.round(n.kcal) : null;
      return rec;
    }).filter(Boolean);
  }
  // Booster recipes not already present in the DB (by name) — the ones we'd propose to add.
  function boosterProposals() {
    const have = new Set(Data.all("recipes").map((r) => norm(r.name_en)));
    return boosterRecipes().filter((r) => !have.has(norm(r.name_en)));
  }
  // Days in a result that still miss the calorie range (kcal violation remains).
  function kcalGapDays(result) {
    return (result && result.days ? result.days : []).filter((d) => (d.violations || []).some((v) => v.key === "kcal"));
  }

  // ---------- generation ----------
  // months: array of "YYYY-MM"; cfg: config object; returns {days, shortfalls, report}
  // months: ["YYYY-MM"]; opts.lockedDays: {date: slots} kept verbatim on regenerate
  function generate(months, cfg, opts) {
    cfg = cfg || getConfig();
    opts = opts || {};
    const locked = opts.lockedDays || {};
    const service = cfg.service_days || ["mon", "tue", "wed", "thu", "fri"];
    const dates = [].concat(...months.map(datesInMonth)).filter((iso) => service.includes(weekdayKey(iso))).sort();

    const usage = {};        // recipeId -> [dates used] (rotation)
    const lastUsed = {};     // recipeId -> index (variety)
    const cap = cfg.rotation_max || 999;
    const windowMs = (cfg.rotation_window_days || 60) * 86400000;
    const gapMs = (cfg.min_repeat_gap || 0) * 86400000;

    const mains = poolFor("main"), vegPool = poolFor("vegetable"), carbPool = poolFor("carb"),
      dairyPool = poolFor("dairy"), fruitPool = poolFor("fruit"), sidePool = poolFor("side");

    const shortfalls = {};
    const addShort = (k) => (shortfalls[k] = (shortfalls[k] || 0) + 1);

    const recentUse = (r, iso) => { const t = Date.parse(iso); return (usage[r.id] || []).filter((d) => Math.abs(Date.parse(d) - t) <= windowMs).length; };
    const withinCap = (r, iso) => recentUse(r, iso) < cap;
    const tooSoon = (r, iso) => { if (!gapMs) return false; const t = Date.parse(iso); return (usage[r.id] || []).some((d) => Math.abs(Date.parse(d) - t) < gapMs); };
    const allergensOf = (r) => r ? Data.recipeAllergens(r) : [];

    // pick best candidate. Prefer variety (cap + gap + distinct); if that leaves no
    // option, relax progressively and REUSE a previously-used dish rather than leave
    // a gap. Only returns null when no dish matches the rule at all (empty pool).
    function pick(pool, iso, filterFn, avoid, prevAlg) {
      const base = pool.filter((r) => (!filterFn || filterFn(r)));
      const av = avoid || [];
      const tiers = [
        base.filter((r) => withinCap(r, iso) && !tooSoon(r, iso) && !av.includes(r.id)), // ideal: rotation + gap + distinct
        base.filter((r) => withinCap(r, iso) && !av.includes(r.id)),                      // relax repeat-gap
        base.filter((r) => !av.includes(r.id)),                                           // relax rotation cap → reuse
        base,                                                                             // last resort: allow same-day repeat
      ];
      const cands = tiers.find((tt) => tt.length) || [];
      if (!cands.length) return null; // genuinely no dish of this type / rule → real shortfall
      cands.sort((a, b) => {
        if (cfg.spread_allergens && prevAlg && prevAlg.length) {
          const oa = allergensOf(a).filter((x) => prevAlg.includes(x)).length, ob = allergensOf(b).filter((x) => prevAlg.includes(x)).length;
          if (oa !== ob) return oa - ob;
        }
        const ua = (usage[a.id] || []).length, ub = (usage[b.id] || []).length;
        if (ua !== ub) return ua - ub;
        const la = lastUsed[a.id] == null ? -1 : lastUsed[a.id], lb = lastUsed[b.id] == null ? -1 : lastUsed[b.id];
        if (la !== lb) return la - lb;
        return a.name_en.localeCompare(b.name_en);
      });
      return cands[0];
    }
    function use(r, iso, idx) { if (!r) return; (usage[r.id] = usage[r.id] || []).push(iso); lastUsed[r.id] = idx; }
    const slotObj = (r) => r ? { name_en: r.name_en, recipe_id: r.id } : null;
    const countSlots = (slots, iso, idx) => ["meat", "veg1", "veg2", "carb", "dairy", "fruit", "side"].forEach((k) => { const s = slots[k]; if (s && s.recipe_id) use(Data.get("recipes", s.recipe_id), iso, idx); });

    // ---- calorie-range enforcement (min + max) ----
    const RK = ["meat", "carb", "veg1", "veg2", "dairy", "fruit", "side"];
    const recipeKcal = (r) => { if (!r) return 0; const n = Data.recipeNutrition(r); return n && n.kcal != null ? n.kcal : 0; };
    const kcalMin = (cfg.nutrition && cfg.nutrition.kcal && cfg.nutrition.kcal.min != null) ? Number(cfg.nutrition.kcal.min) : null;
    const kcalMax = (cfg.nutrition && cfg.nutrition.kcal && cfg.nutrition.kcal.max != null) ? Number(cfg.nutrition.kcal.max) : null;
    // Greedily swap dishes (per slot) toward the [min,max] kcal range: each step makes
    // the single swap that most reduces the day's distance to the range, until inside
    // it or no swap improves. Handles both an over-max and an under-min day.
    function repairKcal(chosen, pools, min, max) {
      const lo = min == null ? -Infinity : min, hi = max == null ? Infinity : max;
      const total = () => RK.reduce((s, k) => s + recipeKcal(chosen[k]), 0);
      const dist = (t) => (t < lo ? lo - t : t > hi ? t - hi : 0);
      let guard = 0;
      while (guard++ < 60) {
        const t = total(), d0 = dist(t);
        if (d0 === 0) break;
        let best = null;
        RK.forEach((k) => {
          const cur = chosen[k]; if (!cur) return;
          const pool = pools[k]; if (!pool || !pool.length) return;
          const other = k === "veg1" ? "veg2" : k === "veg2" ? "veg1" : null;
          const otherId = other && chosen[other] ? chosen[other].id : null;
          const ck = recipeKcal(cur);
          pool.forEach((r) => {
            if (r.id === cur.id || r.id === otherId) return;
            const nt = t - ck + recipeKcal(r), nd = dist(nt);
            if (nd < d0 && (!best || nd < best.nd)) best = { key: k, cand: r, nd };
          });
        });
        if (!best) break;
        chosen[best.key] = best.cand;
      }
      return total();
    }

    let prevAlg = [];
    const days = dates.map((iso, idx) => {
      const wk = weekdayKey(iso);

      // keep an existing menu untouched
      if (cfg.keep_existing && !locked[iso]) {
        const ex = Data.menuForDate(iso);
        if (ex && ["meat", "veg1", "veg2", "carb", "dairy", "fruit"].some((k) => ex.slots[k])) {
          countSlots(ex.slots, iso, idx); prevAlg = Data.dayAllergens(ex);
          const exNut = dayNutrition(ex.slots);
          return { date: iso, weekday: wk, slots: ex.slots, kept: true, locked: true, nutrition: exNut, cost: dayCost(ex.slots), violations: checkNutrition(exNut, cfg.nutrition) };
        }
      }
      // a day the user locked in the preview
      if (locked[iso]) {
        countSlots(locked[iso], iso, idx); const nut = dayNutrition(locked[iso]); prevAlg = unionAllergens(locked[iso]);
        return { date: iso, weekday: wk, slots: locked[iso], locked: true, nutrition: nut, cost: dayCost(locked[iso]), violations: checkNutrition(nut, cfg.nutrition) };
      }

      const rule = (cfg.weekday && cfg.weekday[wk]) || { protein: "any", cuisine: "any" };
      const mainFilter = (r) => {
        const tg = tags(r);
        if (rule.protein && rule.protein !== "any" && tg.protein !== rule.protein) return false;
        if (rule.cuisine && rule.cuisine !== "any" && tg.cuisine !== rule.cuisine) return false;
        return true;
      };
      const chosen = {};
      chosen.meat = pick(mains, iso, mainFilter, [], prevAlg);
      if (!chosen.meat) addShort(`main · ${rule.protein}/${rule.cuisine}`);
      const carbNA = !!(chosen.meat && tags(chosen.meat).contains_carb);
      if (!carbNA) { chosen.carb = pick(carbPool, iso, null, [], prevAlg); if (!chosen.carb) addShort("carb"); }
      chosen.veg1 = pick(vegPool, iso, null, [], prevAlg); if (!chosen.veg1) addShort("vegetable");
      chosen.veg2 = pick(vegPool, iso, null, chosen.veg1 ? [chosen.veg1.id] : [], prevAlg); if (!chosen.veg2) addShort("vegetable");
      chosen.dairy = pick(dairyPool, iso, null, [], prevAlg); if (!chosen.dairy) addShort("dairy");
      chosen.fruit = pick(fruitPool, iso, null, [], prevAlg); if (!chosen.fruit) addShort("fruit/cake");
      chosen.side = pick(sidePool, iso, null, [], prevAlg);

      // enforce the min/max total-kcal rule by swapping dishes toward the range
      if (kcalMin != null || kcalMax != null) repairKcal(chosen, {
        meat: mains.filter(mainFilter), carb: carbNA ? [] : carbPool, veg1: vegPool, veg2: vegPool,
        dairy: dairyPool, fruit: fruitPool, side: sidePool,
      }, kcalMin, kcalMax);

      const slots = {};
      slots.meat = slotObj(chosen.meat);
      slots.carb = carbNA ? { name_en: "Not applicable", recipe_id: null, na: true } : slotObj(chosen.carb);
      slots.veg1 = slotObj(chosen.veg1); slots.veg2 = slotObj(chosen.veg2);
      slots.dairy = slotObj(chosen.dairy); slots.fruit = slotObj(chosen.fruit); slots.side = slotObj(chosen.side);
      RK.forEach((k) => { if (chosen[k]) use(chosen[k], iso, idx); });

      const nut = dayNutrition(slots); const viol = checkNutrition(nut, cfg.nutrition);
      const cost = dayCost(slots);
      if (cfg.max_cost != null && cost != null && cost > cfg.max_cost) viol.push({ key: "cost", type: "max", value: Math.round(cost), limit: cfg.max_cost, required: true });
      prevAlg = unionAllergens(slots);
      return { date: iso, weekday: wk, slots, nutrition: nut, cost, violations: viol };
    });

    const filledCount = (d) => ["meat", "veg1", "veg2", "carb", "dairy", "fruit"].filter((k) => { const s = d.slots[k]; return s && (s.na || s.recipe_id || s.name_en); }).length;
    const unfilled = days.reduce((n, d) => n + (6 - filledCount(d)), 0);
    return {
      days, shortfalls,
      report: { days: days.length, totalSlots: days.length * 6, unfilled, needed: neededRecipes(shortfalls, cfg),
        poolSizes: { main: mains.length, vegetable: vegPool.length, carb: carbPool.length, dairy: dairyPool.length, fruit: fruitPool.length, side: sidePool.length } },
    };
  }

  function unionAllergens(slots) {
    const set = new Set();
    ["meat", "veg1", "veg2", "carb", "dairy", "fruit", "side"].forEach((k) => { const s = slots[k]; if (s && s.recipe_id) { const r = Data.get("recipes", s.recipe_id); if (r) Data.recipeAllergens(r).forEach((a) => set.add(a)); } });
    return [...set];
  }
  function dayCost(slots) {
    let c = 0, any = false;
    ["meat", "veg1", "veg2", "carb", "dairy", "fruit", "side"].forEach((k) => { const s = slots[k]; if (s && s.recipe_id) { const rc = Data.recipeCost(Data.get("recipes", s.recipe_id)); if (rc != null) { c += rc; any = true; } } });
    return any ? Math.round(c * 100) / 100 : null;
  }

  // ---- import past-menu dishes as recipes (fills thin veg/carb/dairy/fruit/side pools) ----
  async function importMenuDishes() {
    const SLOT_COURSE = { meat: "main", veg1: "vegetable", veg2: "vegetable", carb: "carb", dairy: "dairy", fruit: "fruit", side: "side" };
    const existing = new Set(Data.all("recipes").map((r) => norm(r.name_en)));
    const seen = new Map(); // norm -> {name_en, course}
    Data.all("menu_days").forEach((d) => {
      Object.keys(SLOT_COURSE).forEach((k) => {
        const s = d.slots && d.slots[k];
        if (!s || !s.name_en || s.na) return;
        const key = norm(s.name_en);
        if (existing.has(key) || seen.has(key)) return;
        seen.set(key, { name_en: s.name_en, course: SLOT_COURSE[k] });
      });
    });
    let created = 0;
    for (const { name_en, course } of seen.values()) {
      await Data.create("recipes", {
        name_en, name_zh: "", category: "", items: [], allergen_ids: [],
        course, protein: deriveProtein(name_en, ""), cuisine: deriveCuisine(name_en, ""), contains_carb: containsCarb(name_en),
      });
      created++;
    }
    return { created, byCourse: [...seen.values()].reduce((m, x) => (m[x.course] = (m[x.course] || 0) + 1, m), {}) };
  }

  // how many recipes to add, per bucket (distinct days needing that bucket → rough count)
  function neededRecipes(shortfalls, cfg) {
    // for each shortfall key, recommend adding enough to cover the cap over the window
    const out = [];
    Object.keys(shortfalls).forEach((k) => {
      const days = shortfalls[k];
      const perWindow = Math.max(1, Math.ceil(days / Math.max(1, cfg.rotation_max || 1)));
      out.push({ bucket: k, missingDays: days, suggestAdd: perWindow });
    });
    return out.sort((a, b) => b.missingDays - a.missingDays);
  }

  // per-cover day nutrition summed across slots (only where recipe macro data exists)
  function dayNutrition(slots) {
    const out = { kcal: 0, protein: 0, fat: 0, carbs: 0, sugar: 0, added_sugar: 0, sodium: 0, calcium: 0 };
    let any = false;
    ["meat", "veg1", "veg2", "carb", "dairy", "fruit", "side"].forEach((k) => {
      const s = slots[k]; if (!s || !s.recipe_id) return;
      const r = Data.get("recipes", s.recipe_id); if (!r) return;
      const n = Data.recipeNutrition(r); if (!n) return; any = true;
      ["kcal", "protein", "fat", "carbs", "sugar", "added_sugar", "sodium", "calcium"].forEach((m) => (out[m] += n[m] || 0));
    });
    out._hasData = any;
    return out;
  }
  function checkNutrition(nut, rules) {
    const viol = [];
    if (!nut._hasData || !rules) return viol;
    NUTRIENTS.forEach(([key]) => {
      const rr = rules[key]; if (!rr) return;
      const v = nut[key]; if (v == null) return;
      if (rr.min != null && v < rr.min) viol.push({ key, type: "min", value: Math.round(v), limit: rr.min, required: !!rr.required });
      if (rr.max != null && v > rr.max) viol.push({ key, type: "max", value: Math.round(v), limit: rr.max, required: !!rr.required });
    });
    return viol;
  }

  return { tags, deriveProtein, deriveCuisine, deriveCourse, containsCarb, defaultConfig, getConfig, listProfiles, saveConfig, generate, importMenuDishes, poolFor, boosterRecipes, boosterProposals, kcalGapDays, PROTEINS, NUTRIENTS, COURSES, WD_ORDER };
})();
