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
