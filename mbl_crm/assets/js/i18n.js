/* ============================================================
   MBL CRM — i18n (English + Traditional Chinese / 繁體中文)
   ============================================================ */
(function () {
  const STR = {
    en: {
      // nav
      dashboard: "Dashboard", contacts: "Contacts", companies: "Companies",
      deals: "Deals", tasks: "Tasks & Follow-ups", cardscan: "Scan Business Card",
      settings: "Settings",
      grp_work: "Work", grp_pipeline: "Pipeline", grp_tools: "Tools", grp_admin: "Admin",

      // generic
      add: "Add", edit: "Edit", save: "Save", cancel: "Cancel", delete: "Delete",
      remove: "Remove", search: "Search…", close: "Close", all: "All", none: "None",
      actions: "Actions", saved: "Saved", deleted: "Deleted", open: "Open", back: "Back",
      confirmDelete: "Delete this item? This cannot be undone.", nothingHere: "Nothing here yet",
      today: "Today", yes: "Yes", no: "No", optional: "optional", required: "required",
      export: "Export", import: "Import", loading: "Loading…", copy: "Copy", copied: "Copied",

      // contact fields
      contact: "Contact", newContact: "New contact", fullName: "Full name",
      firstName: "First name", lastName: "Last name", jobTitle: "Job title",
      department: "Department", company: "Company", photo: "Photo",
      emailHome: "Email (personal)", emailWork: "Email (business)",
      phoneMobile: "Mobile", phoneWork: "Office phone", website: "Website",
      line: "Line", whatsapp: "WhatsApp", wechat: "WeChat", telegram: "Telegram",
      linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram", x: "X / Twitter",
      addressHome: "Home address", addressWork: "Business address",
      city: "City", country: "Country",
      whereMet: "Where we met", source: "Source", tags: "Tags", owner: "Owner",
      status: "Status", rating: "Priority", language: "Preferred language",
      birthday: "Birthday", notes: "Notes", lastContacted: "Last contacted",
      nextFollowUp: "Next follow-up", createdAt: "Added",
      // status values
      st_lead: "Lead", st_prospect: "Prospect", st_customer: "Customer",
      st_partner: "Partner", st_lost: "Lost",
      // rating
      pr_low: "Low", pr_medium: "Medium", pr_high: "High",
      // comms group labels
      grpIdentity: "Identity", grpComms: "Contact channels", grpSocial: "Social media",
      grpAddr: "Addresses", grpRel: "Relationship", grpActivity: "Activity",

      // companies
      companyName: "Company name", industry: "Industry", size: "Company size",
      companyWebsite: "Website", companyPhone: "Phone", companyAddress: "Address",
      description: "Description", linkedContacts: "Contacts here", openDeals: "Open deals",
      enrich: "Look up company info", enriching: "Gathering company info…",
      aiCompanyInfo: "AI company overview", keyPeople: "Key people", recentNews: "Recent news",
      enrichHint: "AI gathers a public overview: industry, size, description, socials and recent news.",
      revenue: "Revenue", founded: "Founded", headquarters: "Headquarters",

      // deals / pipeline
      deal: "Deal", newDeal: "New deal", dealTitle: "Deal title", value: "Value",
      stage: "Stage", closeDate: "Expected close", pipeline: "Pipeline",
      probability: "Probability", weighted: "Weighted",
      stg_new: "New", stg_qualified: "Qualified", stg_proposal: "Proposal",
      stg_negotiation: "Negotiation", stg_won: "Won", stg_lost: "Lost",
      totalPipeline: "Open pipeline", wonThisMonth: "Won (30 days)",

      // tasks
      task: "Task", newTask: "New task", taskTitle: "What to do", dueDate: "Due",
      done: "Done", pending: "Pending", overdue: "Overdue", dueToday: "Due today",
      upcoming: "Upcoming", relatedTo: "About", markDone: "Mark done", reopen: "Reopen",
      tk_call: "Call", tk_email: "Email", tk_meeting: "Meeting", tk_followup: "Follow-up", tk_todo: "To-do",
      logActivity: "Log activity", activityNote: "What happened?", addNote: "Add note",

      // activity kinds
      ac_note: "Note", ac_call: "Call", ac_email: "Email", ac_meeting: "Meeting",
      ac_created: "Created", ac_card: "Card scanned",

      // dashboard
      welcome: "Welcome back", contactsCount: "Contacts", companiesCount: "Companies",
      openDealsCount: "Open deals", followupsDue: "Follow-ups due",
      todayFollowups: "Who to follow up with", recentContacts: "Recently added",
      noFollowups: "Nothing due — you're all caught up 🎉", quickAdd: "Quick add",
      overdueFollowups: "Overdue & due today",

      // card scan
      scanTitle: "Scan a business card", scanIntro: "Take or upload a photo of a business card. AI reads the details, checks for duplicates, and adds the contact after you confirm.",
      takePhoto: "Take / choose photo", dropHere: "Drop a photo here, or click to choose", analyzing: "Reading the card…",
      reviewExtracted: "Review the details", extractedBy: "Extracted by AI — check before saving",
      duplicateFound: "Possible duplicate found", mergeQ: "This looks like someone already in your CRM. Merge into the existing contact, or create a new one?",
      merge: "Merge into existing", createNew: "Create new contact", saveContact: "Save contact",
      scanAnother: "Scan another", mock_note: "Local demo: using a sample extraction (no AI key configured).",

      // settings / auth / data source
      account: "Account", signIn: "Sign in", signOut: "Sign out", signUp: "Create account",
      password: "Password", emailAddr: "Email", signInHint: "Sign in to your MBL CRM.",
      dataSource: "Data source", connectCloud: "Connect cloud database", disconnect: "Disconnect (back to local)",
      localMode: "Local demo mode — data is saved in this browser only. Connect Supabase to sync across devices and enable AI + login.",
      cloudMode: "Connected to Supabase — data is stored in the cloud and shared across your team.",
      supaUrl: "Supabase URL", supaKey: "Supabase anon key", saveReload: "Save & reload",
      exportData: "Export my data (JSON)", aiSettings: "AI features",
      aiConnected: "AI ready (via Supabase Edge Functions).",
      aiLocal: "AI runs in demo/mock mode until Supabase + an AI key are configured.",
      teamOwner: "Team member", bothRequired: "Both fields are required",
      settingsIntro: "Connect Supabase to go live: cloud storage, team login, and real AI for card scanning + company enrichment.",
    },
    zh: {
      dashboard: "儀表板", contacts: "聯絡人", companies: "公司",
      deals: "商機", tasks: "任務與跟進", cardscan: "掃描名片",
      settings: "設定",
      grp_work: "工作", grp_pipeline: "銷售管線", grp_tools: "工具", grp_admin: "管理",

      add: "新增", edit: "編輯", save: "儲存", cancel: "取消", delete: "刪除",
      remove: "移除", search: "搜尋…", close: "關閉", all: "全部", none: "無",
      actions: "操作", saved: "已儲存", deleted: "已刪除", open: "開啟", back: "返回",
      confirmDelete: "確定刪除？此動作無法復原。", nothingHere: "尚無資料",
      today: "今天", yes: "是", no: "否", optional: "選填", required: "必填",
      export: "匯出", import: "匯入", loading: "載入中…", copy: "複製", copied: "已複製",

      contact: "聯絡人", newContact: "新增聯絡人", fullName: "全名",
      firstName: "名字", lastName: "姓氏", jobTitle: "職稱",
      department: "部門", company: "公司", photo: "照片",
      emailHome: "電子郵件（個人）", emailWork: "電子郵件（公司）",
      phoneMobile: "手機", phoneWork: "公司電話", website: "網站",
      line: "Line", whatsapp: "WhatsApp", wechat: "微信", telegram: "Telegram",
      linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram", x: "X / Twitter",
      addressHome: "住家地址", addressWork: "公司地址",
      city: "城市", country: "國家",
      whereMet: "認識地點", source: "來源", tags: "標籤", owner: "負責人",
      status: "狀態", rating: "優先度", language: "偏好語言",
      birthday: "生日", notes: "備註", lastContacted: "最近聯繫",
      nextFollowUp: "下次跟進", createdAt: "建立日期",
      st_lead: "潛在客戶", st_prospect: "準客戶", st_customer: "客戶",
      st_partner: "合作夥伴", st_lost: "流失",
      pr_low: "低", pr_medium: "中", pr_high: "高",
      grpIdentity: "基本資料", grpComms: "聯絡管道", grpSocial: "社群媒體",
      grpAddr: "地址", grpRel: "關係", grpActivity: "動態",

      companyName: "公司名稱", industry: "產業", size: "公司規模",
      companyWebsite: "網站", companyPhone: "電話", companyAddress: "地址",
      description: "簡介", linkedContacts: "此公司聯絡人", openDeals: "進行中商機",
      enrich: "查詢公司資訊", enriching: "正在蒐集公司資訊…",
      aiCompanyInfo: "AI 公司概覽", keyPeople: "重要人物", recentNews: "近期消息",
      enrichHint: "AI 蒐集公開概覽：產業、規模、簡介、社群與近期消息。",
      revenue: "營收", founded: "成立", headquarters: "總部",

      deal: "商機", newDeal: "新增商機", dealTitle: "商機名稱", value: "金額",
      stage: "階段", closeDate: "預計成交", pipeline: "銷售管線",
      probability: "成交機率", weighted: "加權金額",
      stg_new: "新進", stg_qualified: "已確認", stg_proposal: "提案",
      stg_negotiation: "議價", stg_won: "成交", stg_lost: "失單",
      totalPipeline: "進行中管線", wonThisMonth: "成交（30 天）",

      task: "任務", newTask: "新增任務", taskTitle: "待辦事項", dueDate: "到期",
      done: "已完成", pending: "待處理", overdue: "逾期", dueToday: "今日到期",
      upcoming: "即將到來", relatedTo: "關聯", markDone: "標記完成", reopen: "重新開啟",
      tk_call: "電話", tk_email: "電子郵件", tk_meeting: "會議", tk_followup: "跟進", tk_todo: "待辦",
      logActivity: "記錄動態", activityNote: "發生了什麼？", addNote: "新增備註",

      ac_note: "備註", ac_call: "通話", ac_email: "郵件", ac_meeting: "會議",
      ac_created: "建立", ac_card: "掃描名片",

      welcome: "歡迎回來", contactsCount: "聯絡人", companiesCount: "公司",
      openDealsCount: "進行中商機", followupsDue: "待跟進",
      todayFollowups: "今日待跟進對象", recentContacts: "最近新增",
      noFollowups: "目前沒有待辦，全部完成 🎉", quickAdd: "快速新增",
      overdueFollowups: "逾期與今日到期",

      scanTitle: "掃描名片", scanIntro: "拍攝或上傳名片照片。AI 會讀取資料、比對重複，並在您確認後新增聯絡人。",
      takePhoto: "拍照／選擇照片", dropHere: "將照片拖曳到此，或點擊選擇", analyzing: "正在讀取名片…",
      reviewExtracted: "確認資料", extractedBy: "由 AI 擷取 — 儲存前請確認",
      duplicateFound: "發現可能重複", mergeQ: "系統中似乎已有此人。要合併到現有聯絡人，還是新增一筆？",
      merge: "合併到現有", createNew: "新增聯絡人", saveContact: "儲存聯絡人",
      scanAnother: "掃描下一張", mock_note: "本機示範：使用範例擷取結果（未設定 AI 金鑰）。",

      account: "帳戶", signIn: "登入", signOut: "登出", signUp: "建立帳戶",
      password: "密碼", emailAddr: "電子郵件", signInHint: "登入您的 MBL CRM。",
      dataSource: "資料來源", connectCloud: "連接雲端資料庫", disconnect: "中斷連線（回到本機）",
      localMode: "本機示範模式 — 資料僅儲存於此瀏覽器。連接 Supabase 以跨裝置同步並啟用 AI 與登入。",
      cloudMode: "已連接 Supabase — 資料儲存於雲端並與團隊共用。",
      supaUrl: "Supabase 網址", supaKey: "Supabase anon 金鑰", saveReload: "儲存並重新載入",
      exportData: "匯出我的資料 (JSON)", aiSettings: "AI 功能",
      aiConnected: "AI 已就緒（透過 Supabase Edge Functions）。",
      aiLocal: "在設定 Supabase 與 AI 金鑰前，AI 以示範模式執行。",
      teamOwner: "團隊成員", bothRequired: "兩個欄位皆為必填",
      settingsIntro: "連接 Supabase 即可上線：雲端儲存、團隊登入，以及名片掃描與公司查詢的真實 AI。",
    }
  };

  let lang = (window.MBL_CONFIG && window.MBL_CONFIG.DEFAULT_LANG) || "en";
  try { lang = localStorage.getItem("mblcrm_lang") || lang; } catch (e) {}

  const I18N = {
    get lang() { return lang; },
    set(l) { lang = l; try { localStorage.setItem("mblcrm_lang", l); } catch (e) {} document.documentElement.lang = (l === "zh" ? "zh-Hant" : "en"); },
    t(key) { return (STR[lang] && STR[lang][key]) || (STR.en[key]) || key; },
    pick(obj, base) {
      if (!obj) return "";
      const a = obj[base + "_" + lang];
      const other = obj[base + "_" + (lang === "en" ? "zh" : "en")];
      return a || other || "";
    }
  };
  document.documentElement.lang = (lang === "zh" ? "zh-Hant" : "en");
  window.I18N = I18N;
})();
