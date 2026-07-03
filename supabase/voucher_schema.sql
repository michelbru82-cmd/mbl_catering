-- ============================================================
-- MBL Catering — Voucher + entitlement schema
-- ------------------------------------------------------------
-- Adds "full access" entitlements and voucher redemption, used by
-- the demo-mode gate in the web app.
--
--   • profiles.full_access_until  — while in the future, the account
--     has full (editable) access; otherwise it is limited to the demo
--     (read-only seed data).
--   • voucher_redemptions          — one row per successful redemption.
--     Unique constraints enforce ONE redemption of a code per ACCOUNT
--     and per IP. Rows are written ONLY by the redeem-voucher Edge
--     Function (service role); clients can read their own.
--
-- Run this in the Supabase SQL editor AFTER schema.sql, then deploy the
-- redeem-voucher Edge Function (supabase/functions/redeem-voucher).
-- ============================================================

-- ---- profiles (entitlement per user) ----------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  full_access_until timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read (only) their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- No client insert/update/delete: the Edge Function uses the service role,
-- which bypasses RLS. (Absence of a permissive policy denies client writes.)

-- Give every new auth user a profile row automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- voucher_redemptions ----------------------------------------------------
create table if not exists public.voucher_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code        text        not null,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  ip          text,
  redeemed_at timestamptz not null default now(),
  -- one redemption of a given code per account …
  constraint voucher_redemptions_code_user_uniq unique (code, user_id)
);

-- … and one per IP (only when an IP was captured).
create unique index if not exists voucher_redemptions_code_ip_uidx
  on public.voucher_redemptions (code, ip)
  where ip is not null;

alter table public.voucher_redemptions enable row level security;

-- A user can read (only) their own redemptions.
drop policy if exists "voucher_redemptions_select_own" on public.voucher_redemptions;
create policy "voucher_redemptions_select_own" on public.voucher_redemptions
  for select using (auth.uid() = user_id);

-- No client writes: redemptions are inserted only by the Edge Function.
