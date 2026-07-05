# MBL Catering — Multi-user setup (separate data per user + admin-managed logins)

This turns the app into a proper multi-tenant tool:

- **Every user has their own private data.** Menus, recipes, ingredients,
  people, subscribers, settings and places are isolated per account by
  Postgres **Row Level Security** (`owner_id = auth.uid()`). No user can read
  or write another user's data — enforced in the database, not just the UI.
- **You (admin) invite users by email** and choose which **sections** each one
  may open. Section access is convenience/feature-gating; the real data
  boundary is `owner_id` RLS.

The app keeps working **before** you apply these steps — it just behaves as a
single-owner app (you see everything). Do the steps below to enable logins for
other people.

---

## 1. Run the SQL (Supabase → SQL editor)

Run these files **in order** (skip any you've already run):

1. `schema.sql`
2. `voucher_schema.sql`
3. `multiuser_schema.sql`   ← new

`multiuser_schema.sql` is safe to re-run. It:

- adds `owner_id` to every data table and replaces the wide-open policy with an
  owner-scoped one;
- adds `role`, `sections`, `active` to `profiles`;
- makes **your** account (`michel.bru82@gmail.com`) an admin and assigns all
  existing rows to you so nothing disappears — *edit that email in the file if
  the owner account is different*;
- seeds a starter "My catering" place for every new user so their app isn't
  empty.

## 2. Deploy the invite Edge Function

```bash
supabase functions deploy admin-invite
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided
to Edge Functions automatically. Optionally, to treat extra emails as admins
even before their profile role is set:

```bash
supabase secrets set ADMIN_EMAILS=michel.bru82@gmail.com
```

## 3. Configure Auth emails (Supabase → Authentication)

- **URL Configuration → Site URL / Redirect URLs:** add the app's URL, e.g.
  `https://fbws.tw/mbl_catering` (and any staging URL). The invite link returns
  the user here; the app then shows a "Set your password" screen.
- **Email templates → Invite user:** the default works. It sends the invite
  link the app expects.

## 4. Use it

In the app, sign in as the admin and open **Admin → Users**:

- **Invite user** — enter an email and tick the sections they may use. They get
  an email, set a password, and land in their **own empty** catering workspace.
- **Edit a user** — change their sections, promote to admin, or **deactivate**
  them (deactivated users are blocked at login).

---

### Notes & limits

- **Auth is required.** Multi-user isolation depends on `auth.uid()`, so keep
  `REQUIRE_AUTH: true` in `assets/js/config.js`. With auth off, RLS would hide
  all data.
- **Deleting a user's login** fully (from `auth.users`) still needs the Supabase
  dashboard or a service-role call; the app offers **deactivate** instead, which
  blocks access immediately.
- Admins always see every section. The per-section choices apply to non-admin
  users only.
- `newsletter_log` rows written by the send-newsletter function use the service
  role; if you want them owner-scoped, set `owner_id` in that function.
