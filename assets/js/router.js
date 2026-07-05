/* ============================================================
   MBL Catering — hash router + page registry
   Pages self-register:  PAGES.<key> = { title, icon, render(view, params) }
   Routes:  #/<key>            -> render(view, [])
            #/<key>/<a>/<b>     -> render(view, ["a","b"])
   ============================================================ */
window.PAGES = window.PAGES || {};

window.Router = (function () {
  const view = () => document.getElementById("view");
  const titleEl = () => document.getElementById("pageTitle");
  const actionsEl = () => document.getElementById("topbarActions");

  function parse() {
    const raw = (location.hash || "#/dashboard").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    const key = parts.shift() || "dashboard";
    return { key, params: parts.map(decodeURIComponent) };
  }

  function setActions(nodes) {
    const a = actionsEl(); a.innerHTML = "";
    (nodes || []).forEach((n) => a.appendChild(n));
  }

  async function render() {
    await Data.ready();
    const { key, params } = parse();
    // Section gating: send a user to a safe landing if they open a section
    // their admin hasn't granted (admins & local demo see everything).
    if (window.Auth && PAGES[key] && !Auth.canSee(key)) {
      const home = Auth.firstAllowed();
      if (home !== key) { location.hash = "#/" + home; return; }
    }
    const page = PAGES[key] || PAGES.dashboard;
    // nav highlight
    document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.key === (PAGES[key] ? key : "dashboard")));
    titleEl().textContent = page.title ? page.title() : "";
    setActions([]);
    const v = view(); v.innerHTML = "";
    v.scrollTop = 0; window.scrollTo(0, 0);
    try { page.render(v, params); }
    catch (e) { console.error(e); v.appendChild(U.h("div", { class: "empty" }, [U.h("div", { class: "big" }, "⚠️"), U.h("div", {}, String(e && e.message || e))])); }
    // close mobile sidebar
    document.getElementById("sidebar").classList.remove("open");
  }

  function go(hash) { location.hash = hash; }
  function rerender() { render(); }

  window.addEventListener("hashchange", render);
  return { render, go, rerender, setActions, parse };
})();
