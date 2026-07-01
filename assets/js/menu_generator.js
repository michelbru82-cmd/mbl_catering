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
    ["sodium", "Sodium", "mg"], ["calcium", "Calcium", "mg"],
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
      id: "menu_config",
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
      nutrition: {}, // { kcal:{min,max,required}, ... }
      rotation_max: 4,          // max appearances within the window
      rotation_window_days: 60, // ~2 months
    };
  }
  function getConfig() {
    const c = Data.get("settings", "menu_config");
    if (!c) return defaultConfig();
    // merge to be resilient to new fields
    const d = defaultConfig();
    return Object.assign(d, c, { weekday: Object.assign(d.weekday, c.weekday || {}), nutrition: c.nutrition || {} });
  }
  async function saveConfig(cfg) {
    cfg.id = "menu_config";
    if (Data.get("settings", "menu_config")) return Data.update("settings", "menu_config", cfg);
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

  // ---------- generation ----------
  // months: array of "YYYY-MM"; cfg: config object; returns {days, shortfalls, report}
  function generate(months, cfg) {
    cfg = cfg || getConfig();
    const service = cfg.service_days || ["mon", "tue", "wed", "thu", "fri"];
    const dates = [].concat(...months.map(datesInMonth)).filter((iso) => service.includes(weekdayKey(iso))).sort();

    const usage = {};        // recipeId -> [dates used] (rotation)
    const lastUsed = {};     // recipeId -> index (variety)
    const cap = cfg.rotation_max || 999;
    const windowMs = (cfg.rotation_window_days || 60) * 86400000;

    const mains = poolFor("main");
    const vegPool = poolFor("vegetable");
    const carbPool = poolFor("carb");
    const dairyPool = poolFor("dairy");
    const fruitPool = poolFor("fruit");
    const sidePool = poolFor("side");

    const shortfalls = {}; // key -> count of days that couldn't be filled
    const addShort = (k) => (shortfalls[k] = (shortfalls[k] || 0) + 1);

    function withinCap(r, iso) {
      const list = usage[r.id] || [];
      const t = Date.parse(iso);
      const recent = list.filter((d) => Math.abs(Date.parse(d) - t) <= windowMs);
      return recent.length < cap;
    }
    // pick best candidate: satisfies filter, under cap, most "rested" (least/oldest use), avoid `avoid` ids
    function pick(pool, iso, filterFn, avoid, idx) {
      let cands = pool.filter((r) => (!filterFn || filterFn(r)) && withinCap(r, iso) && !(avoid || []).includes(r.id));
      if (!cands.length) return null;
      cands.sort((a, b) => {
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

    const days = dates.map((iso, idx) => {
      const wk = weekdayKey(iso);
      const rule = (cfg.weekday && cfg.weekday[wk]) || { protein: "any", cuisine: "any" };
      const slots = {};

      // MAIN by protein + cuisine
      const mainFilter = (r) => {
        const tg = tags(r);
        if (rule.protein && rule.protein !== "any" && tg.protein !== rule.protein) return false;
        if (rule.cuisine && rule.cuisine !== "any" && tg.cuisine !== rule.cuisine) return false;
        return true;
      };
      const main = pick(mains, iso, mainFilter, [], idx);
      slots.meat = slotObj(main);
      if (!main) addShort(`main · ${rule.protein}/${rule.cuisine}`);
      use(main, iso, idx);

      // CARB — "not applicable" if the main already includes a carb
      if (main && tags(main).contains_carb) {
        slots.carb = { name_en: "Not applicable", recipe_id: null, na: true };
      } else {
        const carb = pick(carbPool, iso, null, [], idx);
        slots.carb = slotObj(carb); if (!carb) addShort("carb"); use(carb, iso, idx);
      }

      // VEG 1 & 2 (distinct)
      const v1 = pick(vegPool, iso, null, [], idx); slots.veg1 = slotObj(v1); if (!v1) addShort("vegetable"); use(v1, iso, idx);
      const v2 = pick(vegPool, iso, null, v1 ? [v1.id] : [], idx); slots.veg2 = slotObj(v2); if (!v2) addShort("vegetable"); use(v2, iso, idx);

      // DAIRY, FRUIT, SIDE
      const da = pick(dairyPool, iso, null, [], idx); slots.dairy = slotObj(da); if (!da) addShort("dairy"); use(da, iso, idx);
      const fr = pick(fruitPool, iso, null, [], idx); slots.fruit = slotObj(fr); if (!fr) addShort("fruit/cake"); use(fr, iso, idx);
      const si = pick(sidePool, iso, null, [], idx); slots.side = slotObj(si); if (si) use(si, iso, idx); // side optional

      // nutrition check (only where macro data exists)
      const nut = dayNutrition(slots);
      const viol = checkNutrition(nut, cfg.nutrition);

      return { date: iso, weekday: wk, slots, nutrition: nut, violations: viol };
    });

    // shortfall report
    const totalSlots = days.length * 6;
    const unfilled = days.reduce((n, d) => n + ["meat", "veg1", "veg2", "carb", "dairy", "fruit"].filter((k) => !d.slots[k] || (!d.slots[k].recipe_id && !d.slots[k].na)).length, 0);
    const needed = neededRecipes(shortfalls, cfg);

    return {
      days, shortfalls,
      report: { days: days.length, totalSlots, unfilled, needed, poolSizes: { main: mains.length, vegetable: vegPool.length, carb: carbPool.length, dairy: dairyPool.length, fruit: fruitPool.length, side: sidePool.length } },
    };
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
      ["kcal", "protein", "fat", "carbs", "sugar"].forEach((m) => (out[m] += n[m] || 0));
      // sodium from salt (1 g salt ≈ 400 mg sodium); calcium/added_sugar not in ingredient model yet
      if (n.salt != null) out.sodium += n.salt * 400;
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

  return { tags, deriveProtein, deriveCuisine, deriveCourse, containsCarb, defaultConfig, getConfig, saveConfig, generate, poolFor, PROTEINS, NUTRIENTS, COURSES, WD_ORDER };
})();
