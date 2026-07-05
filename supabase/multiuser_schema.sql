-- ============================================================
-- MBL Catering — Multi-user schema (separate data per user + roles)
-- ------------------------------------------------------------
-- Turns the app into a proper multi-tenant tool:
--   • Every row belongs to an OWNER (owner_id = auth.uid()). Row Level
--     Security makes each signed-in user see ONLY their own data — no
--     user can read or write another user's menus, recipes, people, etc.
--   • profiles.role  = 'admin' | 'user'. Admins may invite users and
--     choose which app sections each user can access.
--   • profiles.sections = jsonb array of page keys the user may open
--     (null = all sections). This is FEATURE-gating only; data safety
--     is enforced by owner_id RLS regardless of the client.
--
-- Run order in the Supabase SQL editor:
--   1. schema.sql
--   2. voucher_schema.sql   (creates profiles + the new-user trigger)
--   3. THIS FILE
-- Then deploy the admin-invite Edge Function (supabase/functions/admin-invite).
--
-- Re-runnable: every statement is idempotent (add column if not exists,
-- drop policy if exists, create or replace).
-- ============================================================

-- ---- 1. profiles: role + per-user section access ---------------------------
alter table public.profiles add column if not exists role     text    not null default 'user';   -- 'admin' | 'user'
alter table public.profiles add column if not exists sections jsonb;                              -- null = all sections; else array of page keys
alter table public.profiles add column if not exists active   boolean not null default true;      -- false = login blocked by the app
alter table public.profiles add column if not exists invited_by uuid references auth.users(id) on delete set null;

-- is_admin(): SECURITY DEFINER so profiles policies can call it WITHOUT
-- recursing through profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- profiles policies: a user reads their OWN row; admins read ALL rows.
-- Only admins may write profiles (role/sections/active) — a normal user
-- must NOT be able to grant themselves sections or the admin role.
drop policy if exists "profiles_select_own"          on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());
-- (No client insert: profile rows are created by the new-user trigger below.
--  Entitlements/voucher writes still go through the service-role Edge Functions.)

-- ---- 2. Per-user data isolation: owner_id + owner-scoped RLS ----------------
-- owner_id defaults to auth.uid(), so a signed-in client's inserts are
-- auto-stamped with the owner. Service-role writes (Edge Functions) must set
-- owner_id explicitly (auth.uid() is null under the service role).
do $$
declare t text;
begin
  foreach t in array array['allergens','sites','places','ingredients','recipes','menu_days','people','subscribers','settings','newsletter_log']
  loop
    execute format(
      'alter table public.%I add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;', t);
    -- Replace the permissive starter policy from schema.sql (named after the table).
    execute format('drop policy if exists %I on public.%I;', t, t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t || '_owner', t);
  end loop;
end $$;

-- ---- 3. Adopt existing (pre-migration) rows so nothing is orphaned ---------
-- Any rows that existed before this migration have owner_id = null and would
-- become invisible. Assign them to the admin account so its current data stays.
-- Change the email below if the owner account is different.
do $$
declare admin_id uuid; t text;
begin
  select id into admin_id from auth.users where lower(email) = lower('michel.bru82@gmail.com') limit 1;
  if admin_id is not null then
    update public.profiles set role = 'admin' where id = admin_id;
    foreach t in array array['allergens','sites','places','ingredients','recipes','menu_days','people','subscribers','settings','newsletter_log']
    loop
      execute format('update public.%I set owner_id = %L where owner_id is null;', t, admin_id);
    end loop;
  end if;
end $$;

-- ---- 4. New-user bootstrap: profile row + a starter catering place ---------
-- Runs as SECURITY DEFINER (bypasses RLS) whenever an auth user is created
-- (self sign-up OR admin invite). Gives the new user their OWN empty dataset
-- with one place so the app is immediately usable.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare pid text;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  pid := 'place_' || replace(new.id::text, '-', '');
  insert into public.places (id, owner_id, name, type, covers, use_by_days, food_cost_pct)
  values (pid, new.id, 'My catering', 'catering', 100, 2, 30)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
