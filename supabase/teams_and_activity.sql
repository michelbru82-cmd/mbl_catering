-- ============================================================
-- MBL Catering — Teams (shared workspace) + Activity log
-- ------------------------------------------------------------
-- 1) TEAMS: several email logins can share ONE workspace's data.
--    profiles.account_id = the PRIMARY account this login belongs to
--    (null = the login is its own primary). Row Level Security now grants
--    access to any row whose owner belongs to the SAME account, so a member
--    sees & edits the primary's menus/recipes/people/etc.
--    A login with no account_id behaves EXACTLY as before (account = itself).
--
-- 2) ACTIVITY LOG: every data change / login / menu generation is recorded
--    with the time and the acting email. Kept for 3 months.
--
-- Run AFTER multiuser_schema.sql. Idempotent / re-runnable.
-- ============================================================

-- ---- 1. team membership -----------------------------------------------------
alter table public.profiles add column if not exists account_id uuid references auth.users(id) on delete set null;

-- primary_of(u): the account a given user belongs to (itself if no account_id).
create or replace function public.primary_of(u uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce((select account_id from public.profiles where id = u), u);
$$;

-- my_account(): the account of the caller.
create or replace function public.my_account()
returns uuid language sql stable security definer set search_path = public as $$
  select public.primary_of(auth.uid());
$$;

-- ---- 2. re-point RLS to the account (shared workspace) ----------------------
do $$
declare t text;
begin
  -- Private, per-account tables: visible/editable to everyone in the account.
  foreach t in array array['sites','places','menu_days','people','subscribers','settings','newsletter_log']
  loop
    execute format('drop policy if exists %I on public.%I;', t || '_owner', t);
    execute format($f$create policy %I on public.%I for all
      using (public.primary_of(owner_id) = public.my_account())
      with check (public.primary_of(owner_id) = public.my_account());$f$, t || '_owner', t);
  end loop;

  -- Shared reference library: read the owner-less originals + the account's own
  -- items; write your own items (or admin).
  foreach t in array array['allergens','ingredients','recipes']
  loop
    execute format('drop policy if exists %I on public.%I;', t || '_read', t);
    execute format('drop policy if exists %I on public.%I;', t || '_write', t);
    execute format($f$create policy %I on public.%I for select
      using (owner_id is null or public.primary_of(owner_id) = public.my_account() or public.is_admin());$f$, t || '_read', t);
    execute format($f$create policy %I on public.%I for all
      using (owner_id = auth.uid() or public.is_admin())
      with check (owner_id = auth.uid() or public.is_admin());$f$, t || '_write', t);
  end loop;
end $$;

-- ---- 3. activity log --------------------------------------------------------
create table if not exists public.activity_log (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  account_id  uuid        not null default public.my_account(),   -- workspace the action belongs to
  actor_id    uuid        references auth.users(id) on delete set null,
  actor_email text,                                               -- kept even if the login is later removed
  action      text        not null,   -- 'create' | 'update' | 'delete' | 'login' | 'generate_menu'
  entity      text,                    -- collection / object type (e.g. 'menu_days')
  entity_id   text,
  label       text                     -- human summary (e.g. the item name)
);
alter table public.activity_log alter column actor_id set default auth.uid();
create index if not exists activity_log_account_time on public.activity_log(account_id, occurred_at desc);
create index if not exists activity_log_actor_time   on public.activity_log(actor_id, occurred_at desc);

alter table public.activity_log enable row level security;
drop policy if exists activity_log_read on public.activity_log;
create policy activity_log_read on public.activity_log for select
  using (account_id = public.my_account() or public.is_admin());
drop policy if exists activity_log_insert on public.activity_log;
create policy activity_log_insert on public.activity_log for insert
  with check (actor_id = auth.uid());

-- 3-month retention. Call from the app (admin) or schedule with pg_cron.
create or replace function public.prune_activity_log()
returns void language sql security definer set search_path = public as $$
  delete from public.activity_log where occurred_at < now() - interval '3 months';
$$;
