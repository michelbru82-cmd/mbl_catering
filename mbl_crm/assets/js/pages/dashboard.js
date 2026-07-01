/* Dashboard — stats, who to follow up with, recent contacts */
PAGES.dashboard = {
  icon: "📊", title: () => I18N.t("dashboard"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;

    const stat = (num, label, hash) => h("a", { class: "card card--stat card--link", href: hash || "#/dashboard" }, [
      h("span", { class: "stat__num" }, String(num)),
      h("span", { class: "stat__label" }, label),
    ]);

    const contacts = Data.all("contacts"), companies = Data.all("companies");
    const open = Data.openDeals();
    const due = Data.dueFollowups();

    view.appendChild(h("div", { class: "stat-row" }, [
      stat(contacts.length, t("contactsCount"), "#/contacts"),
      stat(companies.length, t("companiesCount"), "#/companies"),
      stat(open.length, t("openDealsCount"), "#/deals"),
      stat(CRM.money(Data.pipelineValue()), t("totalPipeline"), "#/deals"),
      stat(due.length, t("followupsDue"), "#/tasks"),
    ]));

    // quick-add toolbar
    view.appendChild(h("div", { class: "toolbar" }, [
      h("span", { class: "muted small" }, t("quickAdd") + ":"),
      h("button", { class: "btn btn--primary btn--sm", onClick: () => contactForm(null) }, "＋ " + t("contact")),
      h("button", { class: "btn btn--sm", onClick: () => dealForm(null) }, "＋ " + t("deal")),
      h("button", { class: "btn btn--sm", onClick: () => taskForm(null) }, "＋ " + t("task")),
      h("button", { class: "btn btn--accent btn--sm", onClick: () => Router.go("#/cardscan") }, "📇 " + t("cardscan")),
    ]));

    const grid = h("div", { class: "detail-grid" });

    /* ---- Follow-ups due (overdue & today) ---- */
    const fuCard = h("div", { class: "detail-card" }, [
      h("div", { class: "section-head" }, [h("h2", {}, "🔔 " + t("overdueFollowups"))]),
    ]);
    if (!due.length) {
      fuCard.appendChild(h("p", { class: "muted" }, t("noFollowups")));
    } else {
      const list = h("div", {});
      due.forEach((c) => {
        const co = Data.companyOf(c);
        list.appendChild(h("div", { class: "cell-name", style: "padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer", onClick: () => Router.go("#/contacts/" + c.id) }, [
          CRM.avatar(c, "avatar--sm"),
          h("div", { style: "flex:1;min-width:0" }, [
            h("div", {}, [h("b", {}, Data.contactName(c)), co ? h("span", { class: "muted small" }, " · " + co.name) : null]),
            h("div", {}, CRM.followupBadge(c.next_follow_up)),
          ]),
          h("button", { class: "btn btn--sm btn--primary", onClick: (e) => { e.stopPropagation(); logActivityModal(c); } }, "✔ " + t("logActivity")),
        ]));
      });
      fuCard.appendChild(list);
    }
    grid.appendChild(fuCard);

    /* ---- Recently added ---- */
    const recent = contacts.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 6);
    const rc = h("div", { class: "detail-card" }, [
      h("div", { class: "section-head" }, [h("h2", {}, "🆕 " + t("recentContacts"))]),
    ]);
    if (!recent.length) rc.appendChild(h("p", { class: "muted" }, t("nothingHere")));
    recent.forEach((c) => {
      const co = Data.companyOf(c);
      rc.appendChild(h("div", { class: "cell-name", style: "padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer", onClick: () => Router.go("#/contacts/" + c.id) }, [
        CRM.avatar(c, "avatar--sm"),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", {}, [h("b", {}, Data.contactName(c)), c.job_title ? h("span", { class: "muted small" }, " · " + c.job_title) : null]),
          h("div", { class: "muted small" }, co ? co.name : ""),
        ]),
        CRM.status(c.status),
      ]));
    });
    grid.appendChild(rc);

    view.appendChild(grid);
  },
};
