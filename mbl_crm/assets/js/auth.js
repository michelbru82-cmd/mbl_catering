/* ============================================================
   MBL CRM — Auth (Supabase email login)
   ------------------------------------------------------------
   • Local demo mode  -> auth skipped (Auth.ensure resolves).
   • Supabase + REQUIRE_AUTH -> shows a login screen and only
     resolves once a user is signed in.
   ============================================================ */
(function () {
  const cfg = window.MBL_CONFIG || {};
  const usingSupabase = Data.source === "supabase";
  const requireAuth = usingSupabase && cfg.REQUIRE_AUTH !== false;

  let currentUser = null;

  const Auth = {
    get user() { return currentUser; },
    get enabled() { return requireAuth; },

    // Resolves when the app may render (signed in, or auth not required).
    async ensure() {
      if (!requireAuth) return true;
      const sb = Data.supaClient();
      const { data } = await sb.auth.getSession();
      currentUser = data && data.session ? data.session.user : null;
      sb.auth.onAuthStateChange((_e, session) => {
        currentUser = session ? session.user : null;
      });
      if (currentUser) return true;
      await this.showLogin();
      return true;
    },

    showLogin() {
      const sb = Data.supaClient(), t = I18N.t.bind(I18N), h = U.h;
      const app = document.getElementById("app");
      if (app) app.style.display = "none";

      return new Promise((resolve) => {
        const email = h("input", { class: "input", type: "email", placeholder: t("emailAddr"), autocomplete: "username" });
        const pass = h("input", { class: "input", type: "password", placeholder: t("password"), autocomplete: "current-password" });
        const msg = h("div", { class: "small", style: "min-height:18px;color:var(--danger);margin:-4px 0 8px" });
        let mode = "in"; // in | up

        const submit = h("button", { class: "btn btn--primary", style: "width:100%", onClick: doAuth }, t("signIn"));
        const toggle = h("button", { class: "btn btn--ghost", style: "width:100%", onClick: () => {
          mode = mode === "in" ? "up" : "in";
          submit.textContent = mode === "in" ? t("signIn") : t("signUp");
          toggle.textContent = mode === "in" ? t("signUp") : t("signIn");
          msg.textContent = "";
        } }, t("signUp"));

        async function doAuth() {
          msg.style.color = "var(--danger)"; msg.textContent = "";
          const e = email.value.trim(), p = pass.value;
          if (!e || !p) { msg.textContent = t("bothRequired"); return; }
          submit.disabled = true; submit.textContent = "…";
          try {
            if (mode === "up") {
              const { error } = await sb.auth.signUp({ email: e, password: p });
              if (error) throw error;
              msg.style.color = "var(--ok)"; msg.textContent = "Check your email to confirm, then sign in.";
              submit.disabled = false; submit.textContent = t("signIn"); mode = "in"; toggle.textContent = t("signUp");
              return;
            }
            const { data, error } = await sb.auth.signInWithPassword({ email: e, password: p });
            if (error) throw error;
            currentUser = data.user;
            back.remove();
            if (app) app.style.display = "";
            resolve(true);
          } catch (err) {
            msg.textContent = (err && err.message) || String(err);
            submit.disabled = false; submit.textContent = mode === "in" ? t("signIn") : t("signUp");
          }
        }

        [email, pass].forEach((inp) => inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") doAuth(); }));

        const card = h("div", { class: "login-card" }, [
          h("div", { class: "brand" }, [
            h("img", { class: "brand__logo", src: "assets/img/logo.svg", alt: "MBL" }),
            h("div", { class: "brand__text" }, [
              h("span", { class: "brand__name" }, cfg.ORG_NAME || "MBL"),
              h("span", { class: "brand__sub" }, cfg.APP_NAME || "CRM"),
            ]),
          ]),
          h("p", { class: "muted small center", style: "margin:-6px 0 16px" }, t("signInHint")),
          h("div", { class: "field" }, [h("label", {}, t("emailAddr")), email]),
          h("div", { class: "field" }, [h("label", {}, t("password")), pass]),
          msg, submit,
          h("div", { style: "height:8px" }), toggle,
        ]);
        const back = h("div", { class: "login-wrap" }, card);
        document.body.appendChild(back);
        email.focus();
      });
    },

    async signOut() {
      if (!usingSupabase) return;
      try { await Data.supaClient().auth.signOut(); } catch (e) {}
      location.reload();
    },
  };

  window.Auth = Auth;
})();
