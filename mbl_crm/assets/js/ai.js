/* ============================================================
   MBL CRM — AI layer
   ------------------------------------------------------------
   Two capabilities, both behind Supabase Edge Functions that
   hold the AI provider key server-side (see supabase/functions):
     • AI.scanCard(imageDataUrl)  -> extracted contact fields
     • AI.enrichCompany(name,web) -> public company overview

   In LOCAL mode (no Supabase) a built-in mock is used so the
   whole flow — capture, extract, dedup, merge, save — works
   offline for demos. Swap in real AI just by connecting Supabase.
   ============================================================ */
(function () {
  const cfg = window.MBL_CONFIG || {};

  // ---- Mock business cards (local demo). One intentionally duplicates
  //      an existing seed contact to demonstrate the merge flow. ----
  const MOCK_CARDS = [
    {
      full_name: "Sophie Martin", first_name: "Sophie", last_name: "Martin",
      job_title: "Purchasing Manager", company_name: "Bistro Group Asia",
      email_work: "sophie.martin@bistrogroup.example", phone_mobile: "+886 987 654 321",
      phone_work: "+886 2 8765 4321", website: "https://bistrogroup.example",
      line: "sophie.m", wechat: "", whatsapp: "+886987654321",
      address_work: "Xinyi District, Taipei", city: "Taipei", country: "Taiwan",
      linkedin: "https://linkedin.com/in/sophiemartin",
    },
    {
      full_name: "Kenji Tanaka", first_name: "Kenji", last_name: "Tanaka",
      job_title: "Executive Chef", company_name: "Sakura Hospitality",
      email_work: "k.tanaka@sakura-hosp.example", phone_mobile: "+81 90 1234 5678",
      phone_work: "", website: "https://sakura-hosp.example",
      line: "kenji_t", wechat: "", whatsapp: "",
      address_work: "Shibuya, Tokyo", city: "Tokyo", country: "Japan",
      linkedin: "",
    },
    { // duplicate of seed contact "Chen Wei-Ting" @ Formosa Tech Park
      full_name: "Chen Wei-Ting", first_name: "Wei", last_name: "Chen",
      job_title: "Facilities Manager", company_name: "Formosa Tech Park",
      email_work: "wt.chen@example-tech.tw", phone_mobile: "+886 928 111 222",
      phone_work: "", website: "",
      line: "chenwt", wechat: "chen_weiting", whatsapp: "",
      address_work: "Hsinchu Science Park", city: "Hsinchu", country: "Taiwan",
      linkedin: "",
    },
  ];
  let mockIdx = 0;

  function mockCompany(name) {
    return {
      name: name,
      industry: "—",
      size: "Unknown",
      description: "Local demo mode: connect Supabase and an AI key to fetch a live overview of " + name + ".",
      website: "",
      headquarters: "",
      founded: "",
      revenue: "",
      socials: {},
      key_people: [],
      recent_news: [],
      _mock: true,
    };
  }

  const AI = {
    get connected() { return Data.source === "supabase"; },

    // imageDataUrl: a data: URL (base64) of the business-card photo
    async scanCard(imageDataUrl) {
      if (this.connected) {
        const out = await Data.invoke(cfg.AI_SCAN_FUNCTION || "scan-card", { image: imageDataUrl });
        return out && (out.fields || out) || {};
      }
      // local mock — simulate latency + rotate through samples
      await new Promise((r) => setTimeout(r, 900));
      const card = MOCK_CARDS[mockIdx % MOCK_CARDS.length]; mockIdx++;
      return Object.assign({ _mock: true }, card);
    },

    async enrichCompany(name, website) {
      if (this.connected) {
        const out = await Data.invoke(cfg.AI_ENRICH_FUNCTION || "enrich-company", { name, website });
        return out && (out.company || out) || mockCompany(name);
      }
      await new Promise((r) => setTimeout(r, 800));
      return mockCompany(name);
    },
  };

  window.AI = AI;
})();
