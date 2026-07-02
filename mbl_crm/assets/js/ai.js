/* ============================================================
   MBL CRM — AI layer
   ------------------------------------------------------------
   Two capabilities:
     • AI.scanCard(imageDataUrl)  -> extracted contact fields
     • AI.enrichCompany(name,web) -> public company overview

   Card scanning uses the best available extractor:
     1. Supabase Edge Function "scan-card" (Claude vision) — when
        Supabase is connected. Highest accuracy, reads EN + 中文.
     2. On-device OCR (Tesseract.js) — offline fallback. Actually
        reads the photo (email / phone / website reliably; name,
        company & title heuristically) so no data is invented.
   Company enrichment uses the "enrich-company" Edge Function when
   connected, otherwise returns a clearly-labelled placeholder.
   ============================================================ */
(function () {
  const cfg = window.MBL_CONFIG || {};

  // ---- Heuristic parser: turn raw OCR text into contact fields ----
  function parseCardText(text) {
    const out = {
      first_name: "", last_name: "", full_name: "", job_title: "", company_name: "",
      email_work: "", email_home: "", phone_mobile: "", phone_work: "", website: "",
      line: "", whatsapp: "", wechat: "", linkedin: "", address_work: "", city: "", country: "",
    };
    const raw = (text || "").replace(/\r/g, "");
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

    // emails
    const emails = (raw.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []);
    if (emails[0]) out.email_work = emails[0];
    if (emails[1]) out.email_home = emails[1];

    // website — search text with emails removed so an email's domain can't hide the site
    const noEmails = raw.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, " ");
    let site = (noEmails.match(/\b(?:https?:\/\/|www\.)[^\s]+/i) || [])[0]
      || (noEmails.match(/\b[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?:com|net|org|tw|co|io|biz|info|asia|dev|app|shop|store|me|us|uk|jp|cn|hk|fr|de|edu|gov)(?:\.[a-z]{2})?\b/i) || [])[0];
    if (site) out.website = site.replace(/[.,;]+$/, "");

    // phones — sequences with 7+ digits
    const phones = [];
    (raw.match(/\+?[\d][\d\s().\-]{6,}\d/g) || []).forEach((p) => {
      const digits = p.replace(/\D/g, "");
      if (digits.length >= 7 && digits.length <= 15) phones.push(p.trim());
    });
    if (phones[0]) out.phone_mobile = phones[0];
    if (phones[1]) out.phone_work = phones[1];

    // messaging handles / socials by keyword
    lines.forEach((l) => {
      const low = l.toLowerCase();
      const val = l.replace(/^[^:：]*[:：]\s*/, "").trim();
      if (/(^|\b)line(\b|[:：])/i.test(l) && !out.line) out.line = val !== l ? val : "";
      if (/(wechat|微信|weixin)/i.test(l) && !out.wechat) out.wechat = val !== l ? val : "";
      if (/whats\s*app/i.test(l) && !out.whatsapp) out.whatsapp = (val.match(/\+?[\d][\d\s().\-]{5,}\d/) || [val])[0];
      if (/linkedin/i.test(low)) out.linkedin = (l.match(/https?:\/\/\S+/) || ["https://linkedin.com/in/"])[0];
    });

    // job title
    const TITLE = /(manager|director|engineer|ceo|cto|cfo|coo|founder|co-?founder|head|officer|president|vice|vp|consultant|lead|specialist|executive|owner|partner|analyst|designer|sales|marketing|procurement|purchasing|chef)/i;
    // company markers
    const COMPANY = /(inc\.?|ltd\.?|llc|co\.,?\s*ltd|corp\.?|company|group|gmbh|s\.a\.|pte|有限公司|股份|企業|集團|公司)/i;

    const looksContact = (l) => /@|https?:|www\.|\+?\d[\d\s().\-]{6,}/.test(l) || /(line|wechat|微信|whats\s*app|tel|fax|mobile|email|e-mail)/i.test(l);

    for (const l of lines) {
      if (!out.company_name && COMPANY.test(l)) out.company_name = l;
    }
    for (const l of lines) {
      if (!out.job_title && TITLE.test(l) && !COMPANY.test(l) && !looksContact(l)) out.job_title = l;
    }
    // name: first "clean" line (letters, <=4 words), not company/title/contact
    for (const l of lines) {
      if (looksContact(l)) continue;
      if (COMPANY.test(l)) continue;
      if (l === out.job_title) continue;
      const words = l.split(/\s+/);
      const hasLetters = /[A-Za-z一-鿿]/.test(l);
      if (hasLetters && words.length <= 4 && l.length <= 40 && !/\d{3,}/.test(l)) { out.full_name = l; break; }
    }
    // fallback company from website domain
    if (!out.company_name && out.website) {
      const m = out.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[./]/)[0];
      if (m) out.company_name = m.charAt(0).toUpperCase() + m.slice(1);
    }
    if (out.full_name) {
      const parts = out.full_name.split(/\s+/);
      out.first_name = parts[0] || "";
      out.last_name = parts.length > 1 ? parts.slice(1).join(" ") : "";
    }
    return out;
  }

  function mockCompany(name) {
    return {
      name, industry: "—", size: "Unknown",
      description: "Local demo mode: connect Supabase and an AI key to fetch a live overview of " + name + ".",
      website: "", headquarters: "", founded: "", revenue: "", socials: {}, key_people: [], recent_news: [], _mock: true,
    };
  }

  // Prepare a photo for OCR: honor EXIF orientation (canvas draw does this),
  // scale toward ~2000px on the long edge, then grayscale + boost contrast.
  // Tesseract reads dramatically better on a clean, right-sized, high-contrast
  // image than on a raw multi-megapixel phone snapshot.
  function preprocess(dataUrl) {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            const longest = Math.max(img.width, img.height) || 1;
            let s = 2000 / longest;
            if (s > 1.8) s = 1.8;                 // don't over-upscale tiny images
            if (s > 1 && longest >= 1400) s = 1;  // already a good size
            const w = Math.max(1, Math.round(img.width * s));
            const h = Math.max(1, Math.round(img.height * s));
            const c = document.createElement("canvas");
            c.width = w; c.height = h;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            const id = ctx.getImageData(0, 0, w, h), d = id.data;
            const contrast = 1.25, intercept = 128 * (1 - contrast);
            for (let i = 0; i < d.length; i += 4) {
              let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              g = g * contrast + intercept;
              d[i] = d[i + 1] = d[i + 2] = g < 0 ? 0 : g > 255 ? 255 : g;
            }
            ctx.putImageData(id, 0, 0);
            resolve(c);
          } catch (e) { resolve(dataUrl); }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      } catch (e) { resolve(dataUrl); }
    });
  }

  let _tessLoading = null;
  function ensureTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (_tessLoading) return _tessLoading;
    _tessLoading = new Promise((resolve, reject) => {
      // Wait briefly in case the <script> is still loading, else give up.
      let tries = 0;
      const t = setInterval(() => {
        if (window.Tesseract) { clearInterval(t); resolve(window.Tesseract); }
        else if (++tries > 40) { clearInterval(t); reject(new Error("OCR engine unavailable")); }
      }, 150);
    });
    return _tessLoading;
  }

  const AI = {
    get connected() { return Data.source === "supabase"; },

    // imageDataUrl: a data: URL (base64) of the business-card photo.
    // opts.onProgress(0..1) optional. Returns extracted fields (+ meta).
    async scanCard(imageDataUrl, opts) {
      opts = opts || {};
      if (this.connected) {
        const out = await Data.invoke(cfg.AI_SCAN_FUNCTION || "scan-card", { image: imageDataUrl });
        const fields = (out && (out.fields || out)) || {};
        fields._engine = "ai";
        return fields;
      }
      // on-device OCR fallback — actually reads the photo (English + 繁體中文)
      const T = await ensureTesseract();
      const prepped = await preprocess(imageDataUrl);
      const res = await T.recognize(prepped, "eng+chi_tra", {
        logger: (m) => { if (opts.onProgress && m.status === "recognizing text") opts.onProgress(m.progress); },
      });
      const fields = parseCardText(res && res.data && res.data.text);
      fields._engine = "ocr";
      fields._text = (res && res.data && res.data.text) || "";
      return fields;
    },

    async enrichCompany(name, website) {
      if (this.connected) {
        const out = await Data.invoke(cfg.AI_ENRICH_FUNCTION || "enrich-company", { name, website });
        return (out && (out.company || out)) || mockCompany(name);
      }
      await new Promise((r) => setTimeout(r, 500));
      return mockCompany(name);
    },
  };

  window.AI = AI;
})();
