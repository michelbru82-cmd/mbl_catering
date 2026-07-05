/* ============================================================
   MBL Catering — Auth + Homepage (landing)
   ------------------------------------------------------------
   Mirrors the MBL Tools login system, ported to this app's
   vanilla-JS stack:

   • The homepage (hero + how-it-works + features + sign-in) is
     the entry screen. It introduces the catering service.
   • Supabase + REQUIRE_AUTH  -> visitors must sign in (email +
     password via Supabase Auth) before the app loads.
   • Supabase without REQUIRE_AUTH, or local demo mode -> the
     homepage shows an "Enter the app" button; no password.

   Auth.ensure() resolves once the app may render. The homepage
   can be reopened any time from the sidebar brand.
   ============================================================ */
(function () {
  const cfg = window.MBL_CONFIG || {};
  const usingSupabase = Data.source === "supabase";
  const requireAuth = usingSupabase && cfg.REQUIRE_AUTH !== false;

  const t = (k) => I18N.t(k);
  const h = U.h;
  const PENDING_VOUCHER = "mbl_pending_voucher";
  let currentUser = null;
  let currentProfile = null;      // { role, sections, active, full_access_until } for the signed-in user
  let fullAccessUntil = null;     // ISO string of the entitlement expiry, or null
  const adminEmails = (cfg.ADMIN_EMAILS || []).map((e) => String(e).toLowerCase());
  // Whether we arrived via a Supabase invite / password-reset link (captured
  // before the supabase client consumes the URL hash).
  const authAction = ((/[#&?]type=(invite|recovery|signup)/i.exec(location.hash + location.search)) || [])[1] || "";

  const Auth = {
    get user() { return currentUser; },
    get enabled() { return requireAuth; },

    // True when the account may edit (not just browse the demo): local demo is
    // always read-only; on Supabase, an allow-listed admin email or a live
    // full_access_until (voucher / subscription) unlocks full access.
    hasFullAccess() {
      if (!usingSupabase || !currentUser) return false;
      if (adminEmails.includes((currentUser.email || "").toLowerCase())) return true;
      return !!(fullAccessUntil && new Date(fullAccessUntil).getTime() > Date.now());
    },

    // ── Roles & per-section access (multi-user) ──────────────────
    get profile() { return currentProfile; },
    // The account owner / admin (can invite users & set their sections).
    isAdmin() {
      if (!usingSupabase) return true;                                   // local demo = single owner
      if (adminEmails.includes((currentUser && currentUser.email || "").toLowerCase())) return true;
      return !!(currentProfile && currentProfile.role === "admin");
    },
    // Allowed section keys, or null for "all sections".
    sections() {
      const s = currentProfile && currentProfile.sections;
      return Array.isArray(s) ? s : null;
    },
    // May the signed-in user open this page/section?
    canSee(key) {
      if (!usingSupabase) return true;                                   // local demo: everything
      if (this.isAdmin()) return true;                                   // admins: everything
      if (key === "dashboard") return true;                             // always a safe landing
      const s = this.sections();
      return s ? s.indexOf(key) !== -1 : true;                          // null = all
    },
    firstAllowed() { return "dashboard"; },
    async reloadProfile() {
      const sb = Data.supaClient();
      if (sb && currentUser) await this._loadEntitlement(sb);
    },

    // The homepage is the front door: it is shown on EVERY visit. It resolves
    // when the user chooses to enter (Enter button) or has just signed in.
    async ensure() {
      if (usingSupabase) {
        const sb = Data.supaClient();
        if (sb) {
          try {
            const { data } = await sb.auth.getSession();
            currentUser = data && data.session ? data.session.user : null;
            sb.auth.onAuthStateChange((_e, session) => { currentUser = session ? session.user : null; });
          } catch (e) { /* fall through to homepage */ }
          if (currentUser) {
            await this._loadEntitlement(sb);
            await this._redeemPending();
            // Account disabled by the admin — block entry (never resolves to app).
            if (currentProfile && currentProfile.active === false) { await this.showBlocked(); return true; }
            // Arrived from an invite / reset link — let the user set a password.
            if (authAction === "invite" || authAction === "recovery") { await this.showSetPassword(sb); }
          }
        }
      }
      await this.showHome();
      return true;
    },

    // Load the signed-in user's profile: entitlement + role + allowed sections.
    // Uses select("*") so it degrades gracefully if the multi-user columns
    // (role/sections/active) haven't been added to `profiles` yet.
    async _loadEntitlement(sb) {
      try {
        const { data } = await sb.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
        currentProfile = data || null;
        fullAccessUntil = data ? data.full_access_until : null;
      } catch (e) { currentProfile = null; fullAccessUntil = null; }
    },

    // Minimal full-screen card shown after an invite/reset link so the user
    // can choose a password (Supabase already established the session).
    showSetPassword(sb) {
      const app = document.getElementById("app"); if (app) app.style.display = "none";
      return new Promise((resolve) => {
        const state = { pw: "", err: "", loading: false };
        const root = h("div", { class: "landing" });
        document.body.appendChild(root);
        const done = () => {
          root.remove(); if (app) app.style.display = "";
          try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
          resolve(true);
        };
        async function submit(ev) {
          if (ev) ev.preventDefault();
          if ((state.pw || "").length < 6) { state.err = t("passwordTooShort"); render(); return; }
          state.loading = true; state.err = ""; render();
          try { const { error } = await sb.auth.updateUser({ password: state.pw }); if (error) throw error; done(); }
          catch (e) { state.err = (e && e.message) || t("err_server"); state.loading = false; render(); }
        }
        function render() {
          root.innerHTML = "";
          const pw = h("input", { class: "input", type: "password", placeholder: "••••••••", autocomplete: "new-password", value: state.pw });
          pw.addEventListener("input", (e) => (state.pw = e.target.value));
          pw.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(e); });
          root.appendChild(h("form", { class: "card landing__signin-card", onSubmit: submit, style: "max-width:420px;margin:12vh auto" }, [
            h("div", { class: "landing__h2", style: "text-align:center;font-size:20px;margin-bottom:4px" }, t("setPasswordTitle")),
            h("div", { class: "muted small", style: "text-align:center;margin-bottom:16px" }, t("setPasswordSub")),
            h("div", { class: "field" }, [h("label", {}, t("password")), pw]),
            state.err ? h("div", { class: "banner banner--allergen small", style: "margin-bottom:10px" }, state.err) : null,
            h("button", { class: "btn btn--primary", type: "submit", disabled: state.loading }, state.loading ? t("signin_loading") : t("save")),
          ]));
          pw.focus();
        }
        render();
      });
    },

    // Full-screen block for a deactivated account (only exit is sign-out).
    showBlocked() {
      const app = document.getElementById("app"); if (app) app.style.display = "none";
      return new Promise(() => {
        const root = h("div", { class: "landing" });
        root.appendChild(h("div", { class: "card landing__signin-card", style: "max-width:440px;margin:14vh auto;text-align:center" }, [
          h("div", { style: "font-size:40px" }, "🔒"),
          h("div", { class: "landing__h2", style: "font-size:20px;margin:8px 0" }, t("accountDisabled")),
          h("div", { class: "muted small", style: "margin-bottom:16px" }, t("accountDisabledSub")),
          h("button", { class: "btn btn--primary", onClick: () => Auth.signOut() }, t("signOut")),
        ]));
        document.body.appendChild(root);
      });
    },

    // Redeem a voucher that was entered before the account existed.
    async _redeemPending() {
      let code = "";
      try { code = localStorage.getItem(PENDING_VOUCHER) || ""; } catch (e) {}
      if (!code || this.hasFullAccess()) { try { localStorage.removeItem(PENDING_VOUCHER); } catch (e) {} return; }
      try { await this.redeemVoucher(code); U.toast(t("voucherApplied")); } catch (e) { /* user can retry in-app */ }
      try { localStorage.removeItem(PENDING_VOUCHER); } catch (e) {}
    },

    // Call the redeem-voucher Edge Function (the server enforces the per-IP /
    // per-account limits). Resolves with the grant; throws an i18n error key.
    async redeemVoucher(code) {
      const sb = Data.supaClient();
      if (!sb || !currentUser) throw new Error("not_signed_in");
      const { data, error } = await sb.functions.invoke(cfg.VOUCHER_FUNCTION || "redeem-voucher", { body: { code: code } });
      let body = data;
      if (error && error.context && typeof error.context.json === "function") {
        try { body = await error.context.json(); } catch (e) {}
      }
      if (body && body.ok) { fullAccessUntil = body.full_access_until; return body; }
      const map = { invalid_code: "voucherInvalid", already_redeemed_account: "voucherUsedAccount", already_redeemed_ip: "voucherUsedIp", already_redeemed: "voucherUsedAccount" };
      throw new Error(map[body && body.error] || "voucherFailed");
    },

    // Centered "you're in demo mode — subscribe" modal, shown when a demo user
    // attempts to edit. Offers the plans (homepage pricing) and voucher entry.
    showSubscribe() {
      const body = h("div", {}, [
        h("p", { class: "small", style: "margin:0 0 16px;line-height:1.6;color:var(--text-soft)" }, t("subscribeBody")),
        h("div", { class: "field" }, [
          h("label", {}, t("voucher")),
          (function () {
            const inp = h("input", { class: "input", placeholder: "MBL_…", autocapitalize: "characters" });
            inp._isVoucher = true; return inp;
          })(),
        ]),
      ]);
      const voucherInput = body.querySelector("input");
      const msg = h("div", { class: "small", style: "min-height:16px;margin:-6px 0 8px" });
      body.appendChild(msg);

      U.modal(t("subscribeTitle"), body, {
        saveText: t("redeem"),
        cancelText: t("maybeLater"),
        async onSave() {
          const code = (voucherInput.value || "").trim();
          if (!code) { msg.style.color = "var(--danger)"; msg.textContent = t("voucher"); return false; }
          if (!usingSupabase || !currentUser) {
            // No account yet → stash the code and send them to sign up.
            try { localStorage.setItem(PENDING_VOUCHER, code); } catch (e) {}
            Auth.openHome();
            return true;
          }
          try {
            await Auth.redeemVoucher(code);
            U.toast(t("voucherApplied"));
            location.reload();
            return true;
          } catch (e) {
            msg.style.color = "var(--danger)"; msg.textContent = t(e.message) || t("voucherFailed");
            return false;
          }
        },
        buttons: [
          { label: t("seePlans"), class: "btn--accent", close: true, onClick: () => { Auth.openHome(); setTimeout(() => { const p = document.querySelector(".landing #pricing"); if (p) p.scrollIntoView({ behavior: "smooth" }); }, 60); } },
        ],
      });
    },

    // Open the homepage over the running app (from the sidebar brand).
    openHome() { return this.showHome({ reopen: true }); },

    async signOut() {
      if (usingSupabase && Data.supaClient()) {
        try { await Data.supaClient().auth.signOut(); } catch (e) {}
      }
      location.reload();
    },

    // ── The homepage ────────────────────────────────────────────
    showHome(opts) {
      opts = opts || {};
      const app = document.getElementById("app");
      if (app) app.style.display = "none";

      return new Promise((resolve) => {
        // UI state for the sign-in card.
        const state = { mode: "signin", error: "", info: "", loading: false };

        const root = h("div", { class: "landing" });
        document.body.appendChild(root);

        const enterApp = () => {
          root.remove();
          if (app) app.style.display = "";
          resolve(true);
        };

        // Whether the user must sign in before entering (auth on + not signed in
        // + not just reopening the homepage from inside the app).
        const mustSignIn = () => requireAuth && !currentUser && !opts.reopen;

        // Sign in / sign up against Supabase Auth. On success the page reloads
        // so the data layer re-inits WITH the session and loads the real rows;
        // Auth.ensure() then sees the session and skips the homepage.
        async function doAuth(ev) {
          if (ev) ev.preventDefault();
          state.error = ""; state.info = "";
          const sb = usingSupabase && Data.supaClient();
          // No backend (local demo, or auth turned off): just enter.
          if (!requireAuth || !sb) { enterApp(); return; }

          const email = (state.email || "").trim(), pass = state.password || "";
          if (!email || !pass) { state.error = t("bothRequired"); render(); return; }
          state.loading = true; render();
          try {
            if (state.mode === "signup") {
              const { data, error } = await sb.auth.signUp({
                email, password: pass,
                options: { emailRedirectTo: location.origin + location.pathname },
              });
              if (error) throw error;
              if (!data.session) { state.info = t("signin_checkEmail"); state.loading = false; render(); return; }
              location.reload(); return;
            }
            const { error } = await sb.auth.signInWithPassword({ email, password: pass });
            if (error) throw error;
            location.reload(); return;
          } catch (err) {
            state.error = (err && err.message) || t("err_server");
            state.loading = false; render();
          }
        }

        const scrollTo = (id) => root.querySelector("#" + id)?.scrollIntoView({ behavior: "smooth" });

        function langSwitcher() {
          const box = h("div", { class: "langswitch" });
          [["en", "EN"], ["zh", "中文"]].forEach(([code, label]) => {
            box.appendChild(h("button", { class: I18N.lang === code ? "active" : "", onClick: () => { if (I18N.lang !== code) { I18N.set(code); render(); } } }, label));
          });
          return box;
        }

        function header() {
          const orgName = I18N.lang === "zh" ? (cfg.ORG_NAME_ZH || cfg.ORG_NAME) : cfg.ORG_NAME;
          const appName = I18N.lang === "zh" ? (cfg.APP_NAME_ZH || cfg.APP_NAME || "") : (cfg.APP_NAME || "");
          const brand = h("div", { class: "brand" }, [
            h("img", { class: "brand__logo", src: "assets/img/logo.svg", alt: orgName, onerror: "this.style.display='none'" }),
            h("div", { class: "brand__text" }, [
              h("span", { class: "brand__name" }, orgName || "MBL Catering"),
              h("span", { class: "brand__sub" }, appName),
            ]),
          ]);
          const nav = h("nav", { class: "landing__nav" }, [
            langSwitcher(),
            h("button", { class: "btn btn--ghost btn--sm landing__navlink", onClick: () => scrollTo("features") }, t("nav_features")),
            h("button", { class: "btn btn--ghost btn--sm landing__navlink", onClick: () => scrollTo("how") }, t("nav_how")),
            h("button", { class: "btn btn--ghost btn--sm landing__navlink", onClick: () => scrollTo("pricing") }, t("nav_pricing")),
            opts.reopen
              ? h("button", { class: "btn btn--primary btn--sm", onClick: enterApp }, t("backToApp"))
              : (mustSignIn()
                  ? h("button", { class: "btn btn--primary btn--sm", onClick: () => scrollTo("signin") }, t("nav_signin"))
                  : h("button", { class: "btn btn--primary btn--sm", onClick: enterApp }, t("hero_cta"))),
          ]);
          return h("header", { class: "landing__header" }, [brand, nav]);
        }

        function hero() {
          const primaryCta = mustSignIn()
            ? h("button", { class: "btn btn--primary landing__cta", onClick: () => scrollTo("signin") }, t("nav_signin"))
            : h("button", { class: "btn btn--primary landing__cta", onClick: enterApp }, opts.reopen ? t("backToApp") : t("hero_cta"));
          const secondaryCta = (!usingSupabase && !opts.reopen)
            ? h("button", { class: "btn landing__cta", onClick: enterApp }, t("hero_demo"))
            : null;

          const stats = [
            [t("stat1big"), t("stat1small")],
            [t("stat2big"), t("stat2small")],
            [t("stat3big"), t("stat3small")],
          ].map(([big, small]) => h("div", { class: "landing__stat" }, [
            h("div", { class: "landing__stat-big" }, big),
            h("div", { class: "landing__stat-small" }, small),
          ]));

          const mockCard = h("div", { class: "landing__mock" }, [
            h("div", { class: "landing__mock-bar" }, [
              h("span", { class: "landing__dot" }), h("span", { class: "landing__dot" }), h("span", { class: "landing__dot" }),
              h("span", { class: "landing__mock-title" }, t("hero_card_title")),
            ]),
            h("div", { class: "landing__mock-body" }, [
              h("div", { class: "landing__mock-row" }, [h("b", {}, "🍗 " + (I18N.lang === "zh" ? "主菜" : "Meat")), h("span", { class: "muted small" }, I18N.lang === "zh" ? "宮保雞丁" : "Kung Pao Chicken")]),
              h("div", { class: "landing__mock-row" }, [h("b", {}, "🥦 " + (I18N.lang === "zh" ? "蔬菜" : "Vegetable")), h("span", { class: "muted small" }, I18N.lang === "zh" ? "蒜炒時蔬" : "Garlic Greens")]),
              h("div", { class: "landing__mock-row" }, [h("b", {}, "🍚 " + (I18N.lang === "zh" ? "主食" : "Carb")), h("span", { class: "muted small" }, I18N.lang === "zh" ? "白飯" : "Steamed Rice")]),
              h("div", { class: "landing__mock-row landing__mock-row--alert" }, [h("b", {}, "⚠ " + (I18N.lang === "zh" ? "過敏原" : "Allergens")), h("span", { class: "small" }, I18N.lang === "zh" ? "花生 · 大豆 · 麩質" : "Peanut · Soy · Gluten")]),
              h("div", { class: "landing__mock-caption muted small" }, t("hero_card_caption")),
            ]),
          ]);

          return h("section", { class: "landing__hero" }, [
            h("div", { class: "landing__hero-inner" }, [
              h("div", { class: "landing__hero-copy" }, [
                h("div", { class: "landing__tag" }, t("hero_tag")),
                h("h1", { class: "landing__h1" }, [
                  t("hero_h1a"),
                  h("span", { class: "landing__h1-accent" }, t("hero_h1b")),
                  t("hero_h1c"),
                ]),
                h("p", { class: "landing__lead" }, t("hero_p")),
                h("div", { class: "landing__cta-row" }, [primaryCta, secondaryCta]),
                h("div", { class: "muted small landing__note" }, (!usingSupabase && !opts.reopen) ? t("hero_note") : ""),
              ]),
              h("div", { class: "landing__hero-art" }, mockCard),
            ]),
            h("div", { class: "landing__stats" }, stats),
          ]);
        }

        function how() {
          const steps = [
            ["1", "📝", t("how_step1h"), t("how_step1p")],
            ["2", "⚙️", t("how_step2h"), t("how_step2p")],
            ["3", "🖨️", t("how_step3h"), t("how_step3p")],
          ].map(([n, ic, hh, pp]) => h("div", { class: "card landing__step" }, [
            h("div", { class: "landing__step-n" }, n),
            h("div", { class: "landing__step-ic" }, ic),
            h("div", { class: "landing__step-h" }, hh),
            h("div", { class: "muted small" }, pp),
          ]));
          return h("section", { id: "how", class: "landing__section" }, [
            h("div", { class: "landing__section-head" }, [
              h("h2", { class: "landing__h2" }, t("how_title")),
              h("div", { class: "muted" }, t("how_sub")),
            ]),
            h("div", { class: "landing__grid landing__grid--3" }, steps),
          ]);
        }

        function features() {
          const items = [
            ["🗓️", t("feat_menu_h"), t("feat_menu_p")],
            ["📖", t("feat_recipes_h"), t("feat_recipes_p")],
            ["🍳", t("feat_production_h"), t("feat_production_p")],
            ["🧑‍🤝‍🧑", t("feat_people_h"), t("feat_people_p")],
            ["🏷️", t("feat_print_h"), t("feat_print_p")],
            ["✉️", t("feat_news_h"), t("feat_news_p")],
          ].map(([ic, hh, pp]) => h("div", { class: "card landing__feat" }, [
            h("div", { class: "landing__feat-ic" }, ic),
            h("div", { class: "landing__feat-h" }, hh),
            h("div", { class: "muted small" }, pp),
          ]));
          return h("section", { id: "features", class: "landing__section" }, [
            h("div", { class: "landing__section-head" }, [
              h("h2", { class: "landing__h2" }, t("features_title")),
              h("div", { class: "muted" }, t("features_sub")),
            ]),
            h("div", { class: "landing__grid landing__grid--3" }, items),
          ]);
        }

        // Pricing — the MBL suite of modules. The card for THIS app starts the
        // trial here; the others link out to their own site.
        function pricing() {
          const cur = cfg.CURRENCY || "NT$";
          const disc = cfg.ANNUAL_DISCOUNT != null ? cfg.ANNUAL_DISCOUNT : 0.2;
          const annual = (m) => Math.round(m * 12 * (1 - disc));
          const fmt = (n) => n.toLocaleString();
          const mods = cfg.MODULES || [];
          const thisMod = cfg.THIS_MODULE;

          const startTrial = () => {
            if (mustSignIn()) { state.mode = "signup"; state.error = ""; state.info = ""; render(); scrollTo("signin"); }
            else enterApp();
          };

          const priceLines = (name, monthly) => [
            h("div", { class: "price__name" }, name),
            h("div", { class: "price__amt" }, [cur + monthly, h("span", { class: "price__per" }, t("price_permo"))]),
            h("div", { class: "price__year muted small" }, t("price_peryear").replace("{cur}", cur).replace("{n}", fmt(annual(monthly)))),
          ];

          const cards = mods.map((m) => {
            const isThis = m.key === thisMod;
            const cta = isThis
              ? h("button", { class: "btn btn--primary price__cta", onClick: startTrial }, t("price_trial"))
              : h("a", { class: "btn btn--primary price__cta", href: m.url, target: "_blank", rel: "noopener" }, t("price_trial"));
            return h("div", { class: "card price__card" + (isThis ? " price__card--this" : "") },
              [...priceLines(t("mod_" + m.key), m.monthly), cta]);
          });

          const b = cfg.BUNDLE;
          const bundleCard = b ? h("div", { class: "card price__card price__card--soon" }, [
            h("div", { class: "landing__tag price__soon" }, t("price_soon")),
            h("div", { class: "price__name" }, t("price_bundle")),
            h("div", { class: "price__amt" }, [cur + fmt(b.monthly), h("span", { class: "price__per" }, t("price_permo"))]),
            h("div", { class: "muted small", style: "margin-top:8px" }, t("price_bundle_sub")),
          ]) : null;

          return h("section", { id: "pricing", class: "landing__section" }, [
            h("div", { class: "landing__section-head" }, [
              h("h2", { class: "landing__h2" }, t("pricing_title")),
              h("div", { class: "muted" }, t("pricing_sub")),
            ]),
            h("div", { class: "landing__grid landing__grid--4" }, [...cards, bundleCard].filter(Boolean)),
          ]);
        }

        // Sign-in card (Supabase + REQUIRE_AUTH). Skipped when auth is off /
        // when reopening the homepage from inside the app.
        function signin() {
          if (!mustSignIn()) return null;
          // Entering a voucher without an account: stash it and switch to sign-up
          // so it applies automatically once the account exists (see _redeemPending).
          function applyVoucher() {
            const code = (state.voucher || "").trim();
            if (!code) return;
            try { localStorage.setItem(PENDING_VOUCHER, code); } catch (e) {}
            state.mode = "signup"; state.error = ""; state.info = t("voucherNeedAccount"); state.voucherOpen = false;
            render(); scrollTo("signin");
          }
          const emailInp = h("input", { class: "input", type: "email", placeholder: "your@email.com", autocomplete: "username", value: state.email || "" });
          const passInp = h("input", { class: "input", type: "password", placeholder: "••••••••", autocomplete: state.mode === "signup" ? "new-password" : "current-password", value: state.password || "" });
          emailInp.addEventListener("input", (e) => (state.email = e.target.value));
          passInp.addEventListener("input", (e) => (state.password = e.target.value));
          [emailInp, passInp].forEach((inp) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter") doAuth(); }));

          const form = h("form", { class: "card landing__signin-card", onSubmit: doAuth }, [
            h("div", { class: "landing__h2", style: "text-align:center;margin-bottom:4px;font-size:20px" }, state.mode === "signup" ? t("signin_signupTitle") : t("signin_title")),
            h("div", { class: "muted small", style: "text-align:center;margin-bottom:16px" }, t("signin_sub")),
            h("div", { class: "field" }, [h("label", {}, t("emailAddr")), emailInp]),
            h("div", { class: "field" }, [h("label", {}, t("password")), passInp]),
            state.error ? h("div", { class: "small", style: "color:var(--danger);margin-bottom:10px" }, state.error) : null,
            state.info ? h("div", { class: "small", style: "color:var(--ok);margin-bottom:10px" }, state.info) : null,
            h("button", { class: "btn btn--primary", type: "submit", style: "width:100%", disabled: state.loading }, state.loading ? t("signin_loading") : (state.mode === "signup" ? t("signin_create") : t("signin_title"))),
            h("div", { class: "landing__signin-toggle small muted" }, [
              state.mode === "signup" ? t("signin_haveAcct") : t("signin_noAcctQ"), " ",
              h("button", { type: "button", class: "landing__link", onClick: () => { state.mode = state.mode === "signup" ? "signin" : "signup"; state.error = ""; state.info = ""; render(); } },
                state.mode === "signup" ? t("signin_signInLink") : t("signin_create")),
            ]),
            h("div", { class: "landing__voucher" }, [
              h("button", { type: "button", class: "landing__link small", onClick: () => { state.voucherOpen = !state.voucherOpen; render(); } }, t("haveVoucher")),
              state.voucherOpen ? h("div", { style: "margin-top:8px" }, [
                (function () {
                  const vinp = h("input", { class: "input", placeholder: "MBL_…", autocapitalize: "characters", style: "width:100%;box-sizing:border-box", value: state.voucher || "" });
                  vinp.addEventListener("input", (e) => (state.voucher = e.target.value));
                  vinp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); applyVoucher(); } });
                  return vinp;
                })(),
                h("button", { type: "button", class: "btn btn--accent", style: "width:100%;margin-top:8px", onClick: applyVoucher }, t("applyVoucher")),
              ]) : null,
            ]),
          ]);
          return h("section", { id: "signin", class: "landing__section landing__signin" }, form);
        }

        function footer() {
          const orgName = I18N.lang === "zh" ? (cfg.ORG_NAME_ZH || cfg.ORG_NAME) : cfg.ORG_NAME;
          return h("footer", { class: "landing__footer" }, [
            h("div", { class: "brand", style: "justify-content:center;margin-bottom:8px" }, [
              h("span", { class: "brand__name" }, orgName || "MBL Catering"),
            ]),
            h("div", { class: "muted small" }, t("footerTagline")),
            h("div", { class: "muted small", style: "margin-top:6px" }, "© " + new Date().getFullYear() + " " + (orgName || "MBL Catering")),
          ]);
        }

        function render() {
          root.innerHTML = "";
          root.appendChild(header());
          root.appendChild(hero());
          root.appendChild(how());
          root.appendChild(features());
          root.appendChild(pricing());
          const si = signin();
          if (si) root.appendChild(si);
          root.appendChild(footer());
        }

        render();
      });
    },
  };

  window.Auth = Auth;
})();
