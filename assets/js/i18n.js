/* ============================================================
   MBL Catering — i18n (English + Traditional Chinese / 繁體中文)
   ============================================================ */
(function () {
  const STR = {
    en: {
      dashboard: "Dashboard", menu: "Monthly Menu", recipes: "Recipes",
      ingredients: "Ingredients", production: "Kitchen Production", people: "People",
      allergens: "Allergens", printMenu: "Print Menu", labels: "Print Labels",
      newsletter: "Newsletter", events: "Events",
      grp_planning: "Planning", grp_kitchen: "Kitchen", grp_print: "Print & Send", grp_admin: "Admin",

      // events
      eventsIntro: "Company events (tech evenings, tastings…). Guests register themselves on the website. When an event's date passes it is archived here with its full guest list, ready for the thank-you mailing.",
      upcomingEvents: "Upcoming events", pastEvents: "Past events",
      waitingNextEvent: "Waiting for next event", newEvent: "New event", editEvent: "Edit event",
      eventDate: "Date", startTime: "Start", endTime: "End", location: "Location",
      description: "Description", schedule: "Schedule", speakers: "Speakers", speakerTitle: "Title / role", bio: "Bio",
      documents: "Documents (links)", toolLinks: "Tool links", label: "Label", url: "URL",
      voucher: "Voucher code", voucherNote: "Voucher note", addRow: "＋ Add",
      registrations: "registrations", guests: "Guests", guestList: "Guest list", attended: "Attended",
      liveListNote: "This list updates automatically as people register on the website.",
      archivedNote: "Archived guest list — frozen when the event passed.",
      openEvent: "Open", details: "Details", back: "← Back to events",
      sendThankYou: "Send “Thank you”", markAll: "Mark all attended", markNone: "Mark none",
      extraEmails: "Extra emails (walk-ins, one per line)", extraEmailsHint: "People who attended without registering. Format: email  or  Name <email>",
      whoAttended: "Who attended?", attendedGroup: "Attended", noShowGroup: "Did not attend",
      emailAttended: "Email 1 — Attended", emailNoShow: "Email 2 — Did not attend",
      subject: "Subject", recipientsLabel: "Recipients", recipientsIndiv: "Sent individually — each person receives their own email (no one sees the others).",
      preview: "Preview", customNote: "Extra message (optional)", customNoteHint: "Added near the top of the email.",
      sendToAttended: "Send to attendees", sendToNoShow: "Send to no-shows",
      noRecipients: "No recipients in this group", sentOk: "sent", sending: "Sending…",
      sendLog: "Send history", noEventYet: "No events yet — create one to get started.",
      eventsTableMissingTitle: "Events tables not found in your database",
      eventsTableMissingBody: "You're connected to Supabase but the events tables don't exist yet, so nothing can load. Open your Supabase project → SQL Editor and run the events migration from supabase/schema.sql (the events, event_registrations and event_sends tables). Then reload this page.",

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
      preparedOn: "Prepared", useBy: "Use by", keepRefrigerated: "Keep refrigerated", useByDays: "Use-by (days)",
      freshNote: "Prepared fresh today — consume within {d} day(s)",
      placeType: "Type", typeCatering: "Catering", typeShop: "Shop / Restaurant", foodCostPct: "Target food cost %",
      recipeCards: "Recipe cards", priceList: "Menu / price list", batchQty: "Batch (qty)", qtyForBatch: "Qty for batch", onlyPriced: "Only priced items",
      shopFields: "Shop / restaurant", yieldPortions: "Yield (portions)", prepMin: "Prep (min)", cookMin: "Cook (min)", salePrice: "Sale price", method: "Method / steps",
      methodHint: "One step per line…", costPortion: "Cost / portion", suggestedPrice: "Suggested price", margin: "Margin",
      allergenMatrix: "Allergen matrix", showQR: "QR code",

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
      selectAll: "Select all", clearSel: "Clear", chooseProducts: "Tick the products to print labels for", copies: "Copies",
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
      newsletter: "電子報", events: "活動",
      grp_planning: "規劃", grp_kitchen: "廚房", grp_print: "列印與發送", grp_admin: "管理",

      // events
      eventsIntro: "公司活動（科技之夜、試吃等）。來賓於網站自行報名。活動日期一過即在此封存，保留完整賓客名單，可用於致謝郵件。",
      upcomingEvents: "即將舉行的活動", pastEvents: "過往活動",
      waitingNextEvent: "等待下一場活動", newEvent: "新增活動", editEvent: "編輯活動",
      eventDate: "日期", startTime: "開始", endTime: "結束", location: "地點",
      description: "說明", schedule: "議程", speakers: "講者", speakerTitle: "頭銜／職稱", bio: "簡介",
      documents: "文件（連結）", toolLinks: "工具連結", label: "標題", url: "網址",
      voucher: "優惠碼", voucherNote: "優惠碼備註", addRow: "＋ 新增",
      registrations: "位報名", guests: "賓客", guestList: "賓客名單", attended: "已出席",
      liveListNote: "此名單會隨著網站報名自動更新。",
      archivedNote: "已封存的賓客名單 — 於活動結束時凍結。",
      openEvent: "開啟", details: "詳情", back: "← 返回活動列表",
      sendThankYou: "發送「致謝」", markAll: "全部標為出席", markNone: "全部取消",
      extraEmails: "額外電子郵件（現場加入，每行一個）", extraEmailsHint: "未報名但出席者。格式：email  或  姓名 <email>",
      whoAttended: "誰出席了？", attendedGroup: "已出席", noShowGroup: "未出席",
      emailAttended: "郵件 1 — 已出席", emailNoShow: "郵件 2 — 未出席",
      subject: "主旨", recipientsLabel: "收件人", recipientsIndiv: "個別發送 — 每人收到各自的郵件（彼此看不到）。",
      preview: "預覽", customNote: "額外訊息（選填）", customNoteHint: "加在郵件上方。",
      sendToAttended: "發送給出席者", sendToNoShow: "發送給未出席者",
      noRecipients: "此群組沒有收件人", sentOk: "已發送", sending: "發送中…",
      sendLog: "發送紀錄", noEventYet: "尚無活動 — 建立一個開始吧。",
      eventsTableMissingTitle: "資料庫中找不到活動資料表",
      eventsTableMissingBody: "您已連接 Supabase，但活動資料表尚未建立，因此無法載入。請開啟 Supabase 專案 → SQL Editor，執行 supabase/schema.sql 中的活動遷移（events、event_registrations 與 event_sends 資料表），然後重新載入本頁。",

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
      preparedOn: "製造日期", useBy: "有效期限", keepRefrigerated: "請冷藏保存", useByDays: "有效天數",
      freshNote: "本產品為當日新鮮製作，請於{d}天內食用",
      placeType: "類型", typeCatering: "餐飲外燴", typeShop: "商店／餐廳", foodCostPct: "目標食材成本 %",
      recipeCards: "食譜卡", priceList: "菜單／價目表", batchQty: "批量（數量）", qtyForBatch: "批量用量", onlyPriced: "僅顯示有定價",
      shopFields: "商店／餐廳", yieldPortions: "產出（份）", prepMin: "準備（分）", cookMin: "烹調（分）", salePrice: "售價", method: "作法／步驟",
      methodHint: "每行一個步驟…", costPortion: "每份成本", suggestedPrice: "建議售價", margin: "毛利",
      allergenMatrix: "過敏原對照表", showQR: "QR 碼",

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
      selectAll: "全選", clearSel: "清除", chooseProducts: "勾選要列印標籤的產品", copies: "份數",
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
