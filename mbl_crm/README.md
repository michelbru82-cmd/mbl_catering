# MBL — CRM

A bilingual (English / 繁體中文) **Customer Relationship Management** web app for MBL,
matching the fbws.tw / MBL Catering charte graphique (same colours, fonts and logo).

Built as a **static single-page app** (vanilla JS, no build step) that drops into a
subfolder of an existing site (e.g. `https://www.fbws.tw/mbl_crm`), backed by
**Supabase** for cloud storage, team login, and AI.

It ships with a **local demo mode**: serve `index.html` and everything works from
seed data in your browser's `localStorage`. Connect Supabase whenever you're ready to
go live — no code changes, just keys.

---

## Features

| Section | What it does |
|---------|--------------|
| **Dashboard** | Stats (contacts, companies, open deals, pipeline value), **who to follow up with today** (overdue & due), recently added contacts, quick-add. |
| **Contacts** | Full records: name, job title, company, personal + business email, mobile/office phone, **Line / WhatsApp / WeChat / Telegram**, LinkedIn/Facebook/Instagram/X, home + business address, **where we met**, source, tags, owner, status (lead → prospect → customer → partner → lost), priority, language, notes, last-contacted, next follow-up. Search & filter, click-through **detail view** with an interaction timeline, related tasks and deals. |
| **Business-card scanner** | Photo → **AI vision** extracts the fields → review form → **duplicate detection** → asks permission to **merge** into an existing contact or create a new one. |
| **Companies** | Company records + a click-to-open **AI enrichment popup**: industry, size, description, HQ, socials, key people and recent news (HubSpot/Salesforce-style). One click saves useful fields back onto the company. |
| **Deals** | Kanban **pipeline** (New → Qualified → Proposal → Negotiation → Won → Lost) with drag-and-drop between stages, per-stage totals, weighted value. |
| **Tasks & Follow-ups** | Calls, emails, meetings, follow-ups and to-dos grouped by **Overdue / Due today / Upcoming / Done**; completing a task logs an activity on the contact. |
| **Settings** | Connect Supabase, account / sign-out, AI status, JSON export, language switch. |

Sidebar footer: **language toggle** (EN ⇄ 中文) and the active **data source** badge
(`local` / `supabase`).

---

## Quick start (local demo)

Browsers block `file://` CDN loads, so serve the folder over HTTP:

```bash
cd mbl_crm
python3 -m http.server 8766
# open http://localhost:8766/
```

Edits are saved in your browser (`localStorage`). To wipe back to the seed data, open
Settings → **Reset demo data**, or run `Data.resetLocal()` in the console.

In local mode the business-card scanner uses a **built-in mock extractor** (one of the
sample cards intentionally duplicates a seed contact so you can try the merge flow), and
company enrichment returns a placeholder. Both switch to real AI once Supabase is
connected.

---

## Going live with Supabase

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Schema (+ optional seed)** — in the SQL editor run, in order:
   - `supabase/schema.sql`  *(tables + Row Level Security for signed-in team members)*
   - `supabase/seed.sql`  *(optional demo companies, contacts, deals, tasks)*
3. **Connect the app** — Sidebar → the `local` badge (or Settings → Connect cloud
   database) → paste your **Project URL** + **anon key**. Or hard-code them in
   `assets/js/config.js`.
4. **Create your login** — with Supabase connected the app requires email login
   (Supabase Auth). Enable Email auth in the Supabase dashboard and create your users
   (or use the in-app "Create account").

### AI features (business-card scan + company enrichment)

The AI runs in **Supabase Edge Functions** so your Anthropic API key stays server-side.

```bash
# from the mbl_crm folder, with the Supabase CLI linked to your project
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optional: pick the model (defaults to a vision-capable current model)
supabase secrets set ANTHROPIC_MODEL=claude-sonnet-5

supabase functions deploy scan-card
supabase functions deploy enrich-company
```

- `scan-card` — reads a business-card photo with Claude vision, returns structured fields.
- `enrich-company` — researches a company with Claude + web search, returns a public overview.

Until these are deployed the app stays fully usable in mock/demo mode.

---

## Deployment (cPanel)

The repo's `.cpanel.yml` copies this folder to `$HOME/public_html/mbl_crm` on
**Deploy HEAD Commit**, so it serves at `https://fbws.tw/mbl_crm/`. Adjust the path if
your document root differs.

---

## Customising the brand

All colours, fonts and shape tokens live in `assets/css/theme.css` (the only file you
need to edit to match the charte graphique). Drop your logo at `assets/img/logo.svg`.
Org name / defaults are in `assets/js/config.js`.

---

## Project structure

```
mbl_crm/
  index.html
  .htaccess
  assets/
    css/theme.css        brand tokens (colours, fonts)
    css/app.css          layout + components (incl. CRM: kanban, timeline, avatars…)
    img/logo.svg         MBL logo
    js/config.js         Supabase keys + branding + AI settings
    js/i18n.js           EN / 繁體中文 strings
    js/utils.js          DOM helpers, modal, toast, dates
    js/seed.js           demo data (local mode)
    js/data.js           data layer (local + Supabase adapters) + CRM helpers
    js/ai.js             AI layer (Edge Functions + local mock)
    js/auth.js           Supabase Auth login gate
    js/crm_ui.js         shared render helpers (avatars, status pills, channels)
    js/router.js         hash router + page registry
    js/app.js            boot, sidebar nav, language toggle, connect-cloud
    js/pages/            dashboard, contacts, companies, deals, tasks, cardscan, settings
  supabase/
    schema.sql           tables + RLS
    seed.sql             optional demo data
    functions/scan-card/index.ts        AI business-card OCR
    functions/enrich-company/index.ts   AI company enrichment
```
