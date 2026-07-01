/* ============================================================
   MBL CRM — demo seed data (LOCAL mode)
   ------------------------------------------------------------
   Loaded into localStorage on first run so the app is fully
   usable offline. Follow-up dates are computed relative to
   TODAY so the dashboard always has something to show.
   ============================================================ */
(function () {
  const rel = (n) => U.isoAddDays(U.TODAY, n); // n days from today (negative = past)

  const companies = [
    { id: "co_fbws", name: "FBWS International", industry: "Education", size: "51-200",
      website: "https://www.fbws.tw", phone: "+886 2 1234 5678",
      address: "Taipei, Taiwan", country: "Taiwan",
      description: "Bilingual school group and long-standing catering client.",
      linkedin: "https://linkedin.com/company/fbws", created_at: rel(-120) },
    { id: "co_tsmc", name: "Formosa Tech Park", industry: "Technology", size: "1000+",
      website: "https://example-tech.tw", phone: "+886 3 555 0000",
      address: "Hsinchu, Taiwan", country: "Taiwan",
      description: "Corporate campus — daily staff-canteen catering prospect.", created_at: rel(-60) },
    { id: "co_greenfarm", name: "GreenFarm Produce Co.", industry: "Food & Agriculture", size: "11-50",
      website: "https://greenfarm.example", phone: "+886 4 222 3333",
      address: "Taichung, Taiwan", country: "Taiwan",
      description: "Organic vegetable and fruit supplier.", created_at: rel(-90) },
    { id: "co_lumiere", name: "Lumière Events", industry: "Events & Hospitality", size: "11-50",
      website: "https://lumiere-events.example", phone: "+33 1 44 55 66 77",
      address: "Paris, France", country: "France",
      description: "Event agency — wedding & gala catering partner.", created_at: rel(-45) },
  ];

  const contacts = [
    {
      id: "ct_amelie", first_name: "Amélie", last_name: "Laurent", full_name: "Amélie Laurent",
      job_title: "Head of Operations", department: "Operations", company_id: "co_fbws",
      email_work: "amelie.laurent@fbws.tw", email_home: "", phone_mobile: "+886 912 345 678",
      phone_work: "+886 2 1234 5679", website: "https://www.fbws.tw",
      line: "amelie.l", whatsapp: "+886912345678", wechat: "", telegram: "",
      linkedin: "https://linkedin.com/in/amelielaurent", facebook: "", instagram: "", x: "",
      address_work: "Neihu District, Taipei", address_home: "", city: "Taipei", country: "Taiwan",
      where_met: "School catering review, on-site", source: "Existing client", tags: ["VIP", "Decision maker"],
      owner: "Michel", status: "customer", rating: "high", language: "en",
      notes: "Main contact for the daily school menu contract. Prefers email + Line.",
      last_contacted: rel(-6), next_follow_up: rel(-1), created_at: rel(-120),
    },
    {
      id: "ct_chen", first_name: "Wei", last_name: "Chen", full_name: "Chen Wei-Ting",
      job_title: "Facilities Manager", department: "Admin", company_id: "co_tsmc",
      email_work: "wt.chen@example-tech.tw", email_home: "", phone_mobile: "+886 928 111 222",
      phone_work: "", website: "",
      line: "chenwt", whatsapp: "", wechat: "chen_weiting", telegram: "",
      linkedin: "", facebook: "", instagram: "", x: "",
      address_work: "Hsinchu Science Park", address_home: "", city: "Hsinchu", country: "Taiwan",
      where_met: "Food expo, Taipei Nangang", source: "Trade show", tags: ["Hot lead"],
      owner: "Michel", status: "prospect", rating: "high", language: "zh",
      notes: "Evaluating a 500-cover daily staff canteen. Wants a tasting session.",
      last_contacted: rel(-3), next_follow_up: rel(0), created_at: rel(-40),
    },
    {
      id: "ct_lin", first_name: "Mei", last_name: "Lin", full_name: "Lin Mei-Hua",
      job_title: "Sales Director", department: "Sales", company_id: "co_greenfarm",
      email_work: "meihua@greenfarm.example", email_home: "meihua.personal@gmail.com",
      phone_mobile: "+886 933 444 555", phone_work: "+886 4 222 3334", website: "https://greenfarm.example",
      line: "greenfarm_mei", whatsapp: "+886933444555", wechat: "", telegram: "",
      linkedin: "https://linkedin.com/in/linmeihua", facebook: "", instagram: "", x: "",
      address_work: "Taichung Industrial Park", address_home: "", city: "Taichung", country: "Taiwan",
      where_met: "Introduced by a supplier", source: "Referral", tags: ["Supplier"],
      owner: "Michel", status: "partner", rating: "medium", language: "zh",
      notes: "Supplies organic vegetables. Reliable, competitive on leafy greens.",
      last_contacted: rel(-14), next_follow_up: rel(4), created_at: rel(-88),
    },
    {
      id: "ct_dubois", first_name: "Julien", last_name: "Dubois", full_name: "Julien Dubois",
      job_title: "Managing Director", department: "Management", company_id: "co_lumiere",
      email_work: "j.dubois@lumiere-events.example", email_home: "",
      phone_mobile: "+33 6 12 34 56 78", phone_work: "+33 1 44 55 66 77", website: "https://lumiere-events.example",
      line: "", whatsapp: "+33612345678", wechat: "", telegram: "julien_d",
      linkedin: "https://linkedin.com/in/juliendubois", facebook: "", instagram: "@lumiere.events", x: "",
      address_work: "8 Rue de Rivoli, Paris", address_home: "", city: "Paris", country: "France",
      where_met: "Wedding fair, Paris", source: "Networking event", tags: ["Events", "International"],
      owner: "Michel", status: "prospect", rating: "medium", language: "en",
      notes: "Interested in gala & wedding catering collaborations for 2026.",
      last_contacted: rel(-20), next_follow_up: rel(7), created_at: rel(-44),
    },
    {
      id: "ct_wang", first_name: "David", last_name: "Wang", full_name: "David Wang",
      job_title: "Procurement Lead", department: "Procurement", company_id: "co_tsmc",
      email_work: "david.wang@example-tech.tw", email_home: "",
      phone_mobile: "+886 955 666 777", phone_work: "", website: "",
      line: "davidw", whatsapp: "", wechat: "", telegram: "",
      linkedin: "https://linkedin.com/in/davidwang", facebook: "", instagram: "", x: "",
      address_work: "Hsinchu Science Park", address_home: "", city: "Hsinchu", country: "Taiwan",
      where_met: "Referred by Chen Wei-Ting", source: "Referral", tags: [],
      owner: "Michel", status: "lead", rating: "low", language: "en",
      notes: "Secondary contact for the canteen RFP.",
      last_contacted: "", next_follow_up: rel(2), created_at: rel(-12),
    },
  ];

  const deals = [
    { id: "dl_canteen", title: "Staff canteen — 500 covers/day", company_id: "co_tsmc", contact_id: "ct_chen",
      value: 4800000, stage: "proposal", probability: 50, close_date: rel(25), owner: "Michel", created_at: rel(-30),
      notes: "Annual contract. Tasting scheduled next week." },
    { id: "dl_gala", title: "Autumn gala catering (300 guests)", company_id: "co_lumiere", contact_id: "ct_dubois",
      value: 950000, stage: "qualified", probability: 30, close_date: rel(50), owner: "Michel", created_at: rel(-20), notes: "" },
    { id: "dl_school", title: "School menu contract renewal", company_id: "co_fbws", contact_id: "ct_amelie",
      value: 3600000, stage: "negotiation", probability: 80, close_date: rel(12), owner: "Michel", created_at: rel(-25),
      notes: "Renewal of the daily bilingual-school contract." },
    { id: "dl_supply", title: "Organic produce framework", company_id: "co_greenfarm", contact_id: "ct_lin",
      value: 600000, stage: "won", probability: 100, close_date: rel(-8), owner: "Michel", created_at: rel(-70), notes: "" },
  ];

  const tasks = [
    { id: "tk_1", title: "Send tasting-session proposal", kind: "email", contact_id: "ct_chen", deal_id: "dl_canteen",
      due_date: rel(0), done: false, created_at: rel(-3) },
    { id: "tk_2", title: "Call about contract renewal terms", kind: "call", contact_id: "ct_amelie", deal_id: "dl_school",
      due_date: rel(-1), done: false, created_at: rel(-5) },
    { id: "tk_3", title: "Follow up after Paris wedding fair", kind: "followup", contact_id: "ct_dubois", deal_id: "dl_gala",
      due_date: rel(7), done: false, created_at: rel(-20) },
    { id: "tk_4", title: "Confirm July vegetable prices", kind: "todo", contact_id: "ct_lin", deal_id: "",
      due_date: rel(4), done: false, created_at: rel(-2) },
    { id: "tk_5", title: "Send welcome email", kind: "email", contact_id: "ct_wang", deal_id: "",
      due_date: rel(-4), done: true, created_at: rel(-12) },
  ];

  const activities = [
    { id: "av_1", contact_id: "ct_amelie", kind: "meeting", note: "On-site menu review — happy with variety, wants more vegetarian options.", at: rel(-6) },
    { id: "av_2", contact_id: "ct_chen", kind: "call", note: "Discussed canteen scope; sending proposal and arranging a tasting.", at: rel(-3) },
    { id: "av_3", contact_id: "ct_dubois", kind: "note", note: "Met at Paris wedding fair. Very interested in 2026 gala season.", at: rel(-20) },
    { id: "av_4", contact_id: "ct_lin", kind: "email", note: "Received updated organic price list for summer.", at: rel(-14) },
    { id: "av_5", contact_id: "ct_amelie", kind: "created", note: "Contact added to CRM.", at: rel(-120) },
  ];

  window.MBLCRM_SEED = { companies, contacts, deals, tasks, activities };
})();
