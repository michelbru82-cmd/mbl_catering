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
  let currentUser = null;

  const Auth = {
    get user() { return currentUser; },
    get enabled() { return requireAuth; },

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
        }
      }
      await this.showHome();
      return true;
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

        // Sign-in card (Supabase + REQUIRE_AUTH). Skipped when auth is off /
        // when reopening the homepage from inside the app.
        function signin() {
          if (!mustSignIn()) return null;
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
