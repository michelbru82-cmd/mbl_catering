/* ============================================================
   MBL Catering — i18n (English + Traditional Chinese / 繁體中文)
   ============================================================ */
(function () {
  const STR = {
    en: {
      dashboard: "Dashboard", menu: "Monthly Menu", recipes: "Recipes",
      ingredients: "Ingredients", production: "Kitchen Production", people: "People",
      allergens: "Allergens", printMenu: "Print Menu", labels: "Print Labels",
      newsletter: "Newsletter",
      grp_planning: "Planning", grp_kitchen: "Kitchen", grp_print: "Print & Send", grp_admin: "Admin",

      add: "Add", edit: "Edit", save: "Save", cancel: "Cancel", delete: "Delete",
      remove: "Remove", search: "Search…", close: "Close", print: "Print", today: "Today",
      tomorrow: "Tomorrow", nextDay: "Next day", all: "All", none: "None", actions: "Actions",
      name: "Name", name_en: "Name (English)", name_zh: "Name (中文)", category: "Category",
      supplier: "Supplier", site: "Site", date: "Date", notes: "Notes", quantity: "Quantity",
      grams: "Grams", portions: "Portions", confirmDelete: "Delete this item? This cannot be undone.",
      saved: "Saved", deleted: "Deleted", nothingHere: "Nothing here yet",

      // macros
      kcal: "Energy (kcal)", protein: "Protein", carbs: "Carbs", fat: "Fat",
      sugar: "Sugar", fiber: "Fibre", salt: "Salt", per100: "per 100 g", perPortion: "per portion",
      addedSugar: "Added sugar", sodium: "Sodium", calcium: "Calcium", origin: "Origin",
      kcalShort: "kcal", totalKcalHint: "Total calories of this menu (per cover)",
      partialKcalHint: "Partial — some dishes have no recipe/macro data yet (~ = incomplete)",
      kcalGapTitle: "Calorie target not fully met", kcalGapDays: "day(s) out of range",
      proposeRecipes: "Add recipes to fix", noProposals: "All suggested recipes are already in your database",
      kcalGapHint: "Some days couldn't reach your calorie min/max with the current recipes. I can add balanced dishes (built from your ingredients) to close the gap — you approve them first.",
      proposeIntro: "These new recipes will be added to your database (with real ingredient macros), then the menus regenerate to meet your calorie range:",
      addAndRegen: "Add recipes & regenerate", recipesAdded: "recipes added",
      reducePortions: "Reduce portions to meet max", noOverMax: "No days are over the maximum",
      reduceIntro: "For these days no dish combination fits the maximum, so the serving sizes (grams) will be reduced just enough to meet it. Production quantities scale down accordingly:",
      reduceApply: "Reduce portions & regenerate", scaledHint: "Portions reduced to meet the calorie maximum",
      place: "Place", places: "Places", addPlace: "Add place", setActive: "Set active", menusCount: "Menus",
      placesIntro: "Each catering place has its own menus, calorie rules, people, production and newsletter. Recipes, ingredients and allergens are shared across all places. Switch the active place from the sidebar.",
      cannotDeleteLast: "You must keep at least one place", deletePlaceWarn: "Delete this place and ALL its menus, people and subscribers? This cannot be undone.",
      companyInfo: "Company / organisation details", representative: "Representative", taxNumber: "Tax number", email: "Email", phone: "Telephone", companyAddress: "Company address", deliverySite: "Delivery site",
      labelDay: "Day:", orientation: "Orientation", landscape: "Landscape", portrait: "Portrait", sizePreset: "Size", contains: "Contains", nutritionFacts: "Nutrition Facts", portionWeight: "Portion",
      scopeDay: "Single day", scopeWeek: "Whole week", showIngredients: "Ingredients",
      preparedOn: "Prepared", useBy: "Use by", keepRefrigerated: "Keep refrigerated",
      freshNote: "Prepared fresh today — consume within 48 h",

      // menu
      meat: "Meat", veg1: "Vegetable 1", veg2: "Vegetable 2", carb: "Carb",
      dairy: "Dairy", fruit: "Fruit / Cake", menuFor: "Menu for", month: "Month",
      week: "Week", weekMenu: "Weekly Menu", noMenu: "No menu set for this day",
      setMenu: "Set menu", editDay: "Edit day", dayMacros: "Day total (per cover)",

      // recipes / ingredients
      recipeCount: "recipes", ingredientCount: "ingredients", ingredientsInRecipe: "Ingredients",
      addIngredientRow: "Add ingredient", allergensLabel: "Allergens", noAllergens: "No allergens",
      computedFromIngredients: "Computed from ingredients (where data available)",

      // people
      kind: "Type", kid: "Kid", employee: "Employee", guest: "Guest", dateIn: "Start date",
      dateOut: "End date", active: "Active", inactive: "Inactive", allergen1: "Allergen 1",
      allergen2: "Allergen 2", allergen3: "Allergen 3", headcount: "Active people",

      // production
      todayProduction: "Today's production", nextDayProduction: "Next-day production",
      dishesToPrepare: "Dishes to prepare", qtyToPrepare: "Qty to prepare", covers: "Covers",
      allergensOfDay: "Allergens of the day", allergenAlert: "ALLERGEN ALERT",
      noProduction: "No menu scheduled — set a menu to generate production.",
      affectedPeople: "People with these allergens",

      // labels
      labelSize: "Label size", widthCm: "Width (cm)", heightCm: "Height (cm)",
      perRow: "Per row", chooseDishes: "Choose dishes", showNutrition: "Show nutrition",
      showAllergens: "Show allergens",

      // newsletter
      subscribers: "Subscribers", subscriberEmail: "Email", subscribe: "Add subscriber",
      sendNewsletter: "Send today's newsletter", previewNewsletter: "Preview", sentTo: "sent to",
      newsletterIntro: "The daily newsletter sends today's menu, ingredients and allergen alerts to all active subscribers.",
      queued: "Newsletter queued",

      // allergens admin
      allergenName: "Allergen", allergenCode: "Code", usedBy: "Used by",
      addAllergen: "Add allergen", eu14: "EU 14 major allergens",

      config: "Configuration", menuBuilder: "Menu Builder", buildMenu: "Build menu", generate: "Generate",
      months: "Months", weekdayRules: "Weekday rules (main dish)", proteinLabel: "Protein", cuisine: "Cuisine",
      western: "Western", asian: "Asian", anyOpt: "Any", nutritionRules: "Nutrition limits (per cover)",
      minLbl: "Min", maxLbl: "Max", compulsory: "Compulsory", rotationRule: "Rotation — max times per 2 months",
      serviceDays: "Service days", saveConfig: "Save settings", applyToMenu: "Apply to menu", regenerate: "Regenerate",
      shortfall: "Missing recipes", daysBuilt: "days built", slotsUnfilled: "slots unfilled", notApplicable: "Not applicable",
      addRecipesHint: "Add recipes of these types to fill the gaps, then regenerate", builderIntro: "Set the rules, then generate menus for the selected months using only recipes already in your database.",
      chicken: "Chicken", beef: "Beef", pork: "Pork", fish: "Fish", duck: "Duck", vegetarianP: "Vegetarian", veganP: "Vegan", otherP: "Other",
      course: "Course", cuisineTag: "Cuisine", containsCarb: "Contains carb (carb slot = N/A)", overwriteWarn: "This replaces existing menus for those days (unless locked or kept).",
      profile: "Profile", newProfile: "New profile", optionsLbl: "Options", minGap: "Min days between repeats",
      spreadAllergens: "Spread allergens (avoid same allergen back-to-back)", keepExisting: "Keep existing menus (only fill empty days)",
      maxCostLbl: "Max cost / cover", importDishes: "Import past-menu dishes as recipes", lockDay: "Lock", imported: "recipes imported", kept: "kept",
      localMode: "Local demo mode — edits are saved in this browser only. Connect Supabase in config.js to go live.",
    },
    zh: {
      dashboard: "儀表板", menu: "每月菜單", recipes: "食譜",
      ingredients: "食材", production: "廚房生產", people: "用餐人員",
      allergens: "過敏原", printMenu: "列印菜單", labels: "列印標籤",
      newsletter: "電子報",
      grp_planning: "規劃", grp_kitchen: "廚房", grp_print: "列印與發送", grp_admin: "管理",

      add: "新增", edit: "編輯", save: "儲存", cancel: "取消", delete: "刪除",
      remove: "移除", search: "搜尋…", close: "關閉", print: "列印", today: "今天",
      tomorrow: "明天", nextDay: "隔天", all: "全部", none: "無", actions: "操作",
      name: "名稱", name_en: "名稱（英文）", name_zh: "名稱（中文）", category: "類別",
      supplier: "供應商", site: "據點", date: "日期", notes: "備註", quantity: "數量",
      grams: "公克", portions: "份數", confirmDelete: "確定刪除？此動作無法復原。",
      saved: "已儲存", deleted: "已刪除", nothingHere: "尚無資料",

      kcal: "熱量 (大卡)", protein: "蛋白質", carbs: "碳水化合物", fat: "脂肪",
      sugar: "糖", fiber: "膳食纖維", salt: "鹽", per100: "每 100 公克", perPortion: "每份",
      addedSugar: "添加糖", sodium: "鈉", calcium: "鈣", origin: "產地",
      kcalShort: "大卡", totalKcalHint: "此菜單總熱量（每份）",
      partialKcalHint: "部分：部分菜餚尚無食譜／營養資料（~ 表示不完整）",
      kcalGapTitle: "未完全符合熱量目標", kcalGapDays: "天超出範圍",
      proposeRecipes: "新增食譜以修正", noProposals: "建議的食譜皆已在資料庫中",
      kcalGapHint: "部分日期以現有食譜無法達到您的熱量上下限。我可以新增均衡菜餚（以您的食材製作）來補足——需先經您核准。",
      proposeIntro: "以下新食譜將加入資料庫（含真實食材營養），接著重新產生菜單以符合您的熱量範圍：",
      addAndRegen: "新增食譜並重新產生", recipesAdded: "已新增食譜",
      reducePortions: "減少份量以符合上限", noOverMax: "沒有超過上限的日期",
      reduceIntro: "這些日期無法以任何菜餚組合符合上限，因此將適度減少份量（公克）以達標，生產份量也會隨之調整：",
      reduceApply: "減少份量並重新產生", scaledHint: "已減少份量以符合熱量上限",
      place: "據點", places: "據點", addPlace: "新增據點", setActive: "設為使用中", menusCount: "菜單數",
      placesIntro: "每個餐飲據點各有自己的菜單、熱量規則、人員、生產與電子報。食譜、食材與過敏原為所有據點共用。可從側邊欄切換使用中的據點。",
      cannotDeleteLast: "至少需保留一個據點", deletePlaceWarn: "刪除此據點及其所有菜單、人員與訂閱者？此動作無法復原。",
      companyInfo: "公司／機構資料", representative: "代表人", taxNumber: "統一編號", email: "電子郵件", phone: "電話", companyAddress: "公司地址", deliverySite: "配送地點",
      labelDay: "日期：", orientation: "方向", landscape: "橫式", portrait: "直式", sizePreset: "尺寸", contains: "含", nutritionFacts: "營養標示", portionWeight: "份量",
      scopeDay: "單日", scopeWeek: "整週", showIngredients: "成分",
      preparedOn: "製造日期", useBy: "有效期限", keepRefrigerated: "請冷藏保存",
      freshNote: "本產品為當日新鮮製作，請於48小時內食用",

      meat: "肉類", veg1: "蔬菜 1", veg2: "蔬菜 2", carb: "澱粉",
      dairy: "乳製品", fruit: "水果／甜點", menuFor: "菜單日期", month: "月",
      week: "週", weekMenu: "每週菜單", noMenu: "本日尚未設定菜單",
      setMenu: "設定菜單", editDay: "編輯本日", dayMacros: "每位營養總計",

      recipeCount: "道食譜", ingredientCount: "項食材", ingredientsInRecipe: "食材",
      addIngredientRow: "新增食材", allergensLabel: "過敏原", noAllergens: "無過敏原",
      computedFromIngredients: "依食材計算（若有資料）",

      kind: "類型", kid: "孩童", employee: "員工", guest: "訪客", dateIn: "開始日期",
      dateOut: "結束日期", active: "在籍", inactive: "已停用", allergen1: "過敏原 1",
      allergen2: "過敏原 2", allergen3: "過敏原 3", headcount: "在籍人數",

      todayProduction: "今日生產", nextDayProduction: "隔日生產",
      dishesToPrepare: "待準備餐點", qtyToPrepare: "準備數量", covers: "份數",
      allergensOfDay: "本日過敏原", allergenAlert: "過敏原警示",
      noProduction: "尚未排定菜單 — 請先設定菜單以產生生產清單。",
      affectedPeople: "含此過敏原的人員",

      labelSize: "標籤尺寸", widthCm: "寬 (公分)", heightCm: "高 (公分)",
      perRow: "每行數量", chooseDishes: "選擇餐點", showNutrition: "顯示營養",
      showAllergens: "顯示過敏原",

      subscribers: "訂閱者", subscriberEmail: "電子郵件", subscribe: "新增訂閱者",
      sendNewsletter: "發送今日電子報", previewNewsletter: "預覽", sentTo: "已發送給",
      newsletterIntro: "每日電子報會將今日菜單、食材與過敏原警示寄給所有在籍訂閱者。",
      queued: "電子報已排入發送",

      allergenName: "過敏原", allergenCode: "代碼", usedBy: "使用於",
      addAllergen: "新增過敏原", eu14: "歐盟 14 大過敏原",

      config: "設定", menuBuilder: "菜單產生器", buildMenu: "產生菜單", generate: "產生",
      months: "月份", weekdayRules: "每日規則（主餐）", proteinLabel: "蛋白質", cuisine: "菜系",
      western: "西式", asian: "亞洲", anyOpt: "不限", nutritionRules: "營養限制（每份）",
      minLbl: "最小", maxLbl: "最大", compulsory: "必須", rotationRule: "輪替 — 兩個月內最多次數",
      serviceDays: "供餐日", saveConfig: "儲存設定", applyToMenu: "套用到菜單", regenerate: "重新產生",
      shortfall: "缺少的食譜", daysBuilt: "天已建立", slotsUnfilled: "空格未填", notApplicable: "不適用",
      addRecipesHint: "請新增這些類型的食譜以補齊缺口，然後重新產生", builderIntro: "設定規則後，系統只會使用資料庫中既有的食譜為所選月份產生菜單。",
      chicken: "雞肉", beef: "牛肉", pork: "豬肉", fish: "魚", duck: "鴨肉", vegetarianP: "素食", veganP: "純素", otherP: "其他",
      course: "餐別", cuisineTag: "菜系", containsCarb: "含澱粉（澱粉格 = 不適用）", overwriteWarn: "這將取代這些日期既有的菜單（已鎖定或保留者除外）。",
      profile: "設定檔", newProfile: "新增設定檔", optionsLbl: "選項", minGap: "重複間隔最少天數",
      spreadAllergens: "分散過敏原（避免連續兩天相同）", keepExisting: "保留現有菜單（僅填補空白日）",
      maxCostLbl: "每份最高成本", importDishes: "將過往菜單餐點匯入為食譜", lockDay: "鎖定", imported: "道食譜已匯入", kept: "保留",
      localMode: "本機示範模式 — 編輯僅儲存於此瀏覽器。請於 config.js 連接 Supabase 以正式上線。",
    }
  };

  let lang = (window.MBL_CONFIG && window.MBL_CONFIG.DEFAULT_LANG) || "en";
  try { lang = localStorage.getItem("mbl_lang") || lang; } catch (e) {}

  const I18N = {
    get lang() { return lang; },
    set(l) { lang = l; try { localStorage.setItem("mbl_lang", l); } catch (e) {} document.documentElement.lang = (l === "zh" ? "zh-Hant" : "en"); },
    t(key) { return (STR[lang] && STR[lang][key]) || (STR.en[key]) || key; },
    // pick a bilingual field: returns the active-language value, falling back to the other
    pick(obj, base) {
      if (!obj) return "";
      const a = obj[base + "_" + lang];
      const other = obj[base + "_" + (lang === "en" ? "zh" : "en")];
      return a || other || "";
    },
    both(obj, base) {
      const en = obj[base + "_en"], zh = obj[base + "_zh"];
      if (en && zh) return lang === "zh" ? `${zh} · ${en}` : `${en} · ${zh}`;
      return en || zh || "";
    }
  };
  document.documentElement.lang = (lang === "zh" ? "zh-Hant" : "en");
  window.I18N = I18N;
})();
