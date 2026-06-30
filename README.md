# MBL Catering — Management Web App

A bilingual (English / 繁體中文) catering-management app for a daily school/corporate
menu operation. Built as a **static single-page app** that you can drop into a
subfolder of an existing site (e.g. `https://www.fbws.tw/mbl_catering`), backed by
**Supabase** for live data + email.

It ships with a **local demo mode**: open `index.html` and everything already works
from the seed data (built from your three Google Sheets). Connect Supabase whenever
you're ready to go live — no code changes, just keys.

---

## Features

| Page | What it does |
|------|--------------|
| **Dashboard** | Today's menu at a glance + allergen alert + quick stats |
| **Monthly Menu** | Month grid, one row per service day, **7 slots**: Meat · Vegetable 1 · Vegetable 2 · Carb · Dairy · Fruit/Cake · Side. Edit each day; dishes auto-link to recipes by name |
| **Recipes** | All recipes with ingredients & grams, **macro-nutrition computed from ingredients**, allergen union. Full add/edit |
| **Ingredients** | Master list with per-100 g macros (kcal/protein/carbs/fat/sugar/fibre/salt) and allergens. Edit any field |
| **Kitchen Production** | Dish-by-dish for **today + next day**, quantities per site (Liu-Gong 66 / Yongchun 80) and total, plus **allergens of the day** and the list of people affected |
| **People** | Diners (kid / employee / guest), in & out dates, up to **3 allergens** each, per site |
| **Allergens** | Manage the master allergen list (**EU 14 + Mango/Taiwan**), see usage counts |
| **Print Menu** | Ready-to-print **weekly** menu — this week + next — bilingual EN + 中文 |
| **Print Labels** | Per-dish labels, **size chosen in centimetres**, English + 中文 name + nutrition + allergens |
| **Newsletter** | Subscriber list + daily newsletter (menu, ingredients, allergens) with a **Send** button (SMTP via Supabase Edge Function) |

Top-right of the sidebar: **language toggle** (EN ⇄ 中文) and the active **data source**
badge (`local` / `supabase`).

---

## Quick start (local demo)

Because browsers block `file://` module/CDN loads, serve the folder over HTTP:

```bash
cd mbl_catering
python3 -m http.server 8765
# open http://localhost:8765/
```

Edits are saved in your browser (`localStorage`). To wipe back to the seed data, run
`Data.resetLocal()` in the console, or clear site data.

---

## Going live with Supabase

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Schema + seed** — in the SQL editor run, in order:
   - `supabase/schema.sql`
   - `supabase/seed.sql`  *(253→278 ingredients, 147 recipes, 15 allergens, 23 July-2026 menu days, sample people & subscribers)*
3. **Connect the app** — fill in `assets/js/config.js`:
   ```js
   SUPABASE_URL:      "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "ey...",
   ```
   The badge flips to `supabase` and all CRUD now reads/writes Postgres.
4. **Newsletter sending** — deploy the Edge Function and set SMTP secrets:
   ```bash
   supabase functions deploy send-newsletter
   supabase secrets set SMTP_HOST=smtp.yourhost.com SMTP_PORT=465 \
     SMTP_USER=kitchen@fbws.tw SMTP_PASS=*** SMTP_FROM=kitchen@fbws.tw
   ```
   Until secrets are set the function runs in **dry-run** mode (the Send button works,
   logs recipients, sends nothing) so you can test safely.

> **Security note:** `schema.sql` enables Row Level Security with permissive
> `using(true)` policies so the staff tool works immediately with the anon key.
> **Tighten these** (e.g. require `auth.role() = 'authenticated'`) before exposing
> the app publicly, and put it behind Supabase Auth.

---

## Deploying to `www.fbws.tw/mbl_catering`

It's plain static files — copy the folder to that path on your host (FTP, rsync,
`gh-pages`, Netlify, etc.). All asset paths are **relative**, so it works from any
subfolder with no build step. To send the daily newsletter on a schedule, add a
Supabase **cron** that invokes `send-newsletter` each morning.

---

## Matching your fbws.tw graphic charter

Everything visual lives in **one file: `assets/css/theme.css`**. No other file
hard-codes a colour. To match your brand:

- **Colours** — edit the `--brand-primary`, `--brand-accent`, surfaces & text tokens.
- **Logo** — drop your file at `assets/img/logo.svg` (or change the `<img>` in
  `index.html`). It hides itself gracefully if absent.
- **Fonts** — change the Google Fonts `<link>` in `index.html`, then set
  `--font-sans` / `--font-zh`.
- **Name** — set `ORG_NAME` / `ORG_NAME_ZH` in `config.js`.

Send me the real colours / logo / fonts (or a screenshot of the existing site) and
I'll wire them in exactly.

---

## Data provenance & caveats

Seeded from the three Google Sheets you provided (parsed copies live in `data/`):

- **Ingredients (253)** — the source sheet is a **supplier order list**: it has
  ingredient names (EN + 中文) and suppliers but **no macros and no allergens**.
  So macro fields start **empty** and are yours to fill on the Ingredients page —
  they then roll up automatically into recipes, production and labels. Allergens
  were **auto-tagged by keyword** (milk→Milk, flour→Gluten, …) as a starting point
  (75 ingredients tagged); review them on the Allergens / Ingredients pages.
- **Recipes (147)** — bilingual with ingredient lists. The source only contained
  gram weights for a couple of recipes, so most `grams` are blank; add them per
  recipe and production quantities (portion g × covers) compute instantly.
- **Menu (23 days, July 2026)** + 2 sites + EU-14+Mango allergens come straight
  from the master planning workbook.

`data/*_summary.md` and `data/menu_model.md` document exactly what was found.

---

## Suggested next options (happy to build any)

- **Auth & roles** (kitchen vs admin vs read-only) via Supabase Auth.
- **Cost & purchasing**: ingredient prices → recipe cost → per-supplier shopping
  list with the auto-generated bilingual order messages (your sheet already has the
  pattern for this).
- **Nutrition import**: one-click enrich ingredient macros from a public food
  database (e.g. Taiwan FDA / USDA), joined on name.
- **Production sheet PDF** and **kitchen display** mode.
- **Per-person meal exclusions** auto-flagging which diners can't eat today's dishes.
- **Menu cycle templates** (rotate a 4-week cycle) and copy-week.
- **Waste / served counts** logging per day for forecasting.

---

## Project layout

```
index.html                 app shell + script order
assets/css/theme.css       ← brand tokens (edit me)
assets/css/app.css         layout & components
assets/js/config.js        ← Supabase keys + org name (edit me)
assets/js/i18n.js          EN + 繁體中文 strings
assets/js/seed.js          generated demo data (window.MBL_SEED)
assets/js/data.js          data layer: Supabase | local adapters
assets/js/router.js        hash router + page registry
assets/js/app.js           nav, language toggle, boot
assets/js/pages/*.js       one file per page
supabase/schema.sql        Postgres schema (jsonb relations + RLS)
supabase/seed.sql          generated seed insert
supabase/functions/send-newsletter/index.ts   SMTP edge function
data/                       parsed source sheets + analysis notes
```
