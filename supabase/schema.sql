-- ============================================================
-- MBL Catering — Supabase / Postgres schema
-- Run this in the Supabase SQL editor, then run seed.sql.
-- Relations are stored as jsonb so the web app's local-mode and
-- Supabase-mode data shapes are identical.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists allergens (
  id        text primary key,
  name_en   text not null,
  name_zh   text,
  code      int
);

create table if not exists sites (
  id        text primary key,
  name      text not null,
  name_zh   text,
  covers    int default 0
);

create table if not exists ingredients (
  id        text primary key,
  name_en   text not null,
  name_zh   text,
  supplier  text,
  kcal      numeric,         -- per 100 g
  protein   numeric,
  carbs     numeric,
  fat       numeric,
  sugar     numeric,
  fiber     numeric,
  salt      numeric,
  allergen_ids jsonb default '[]'::jsonb
);

create table if not exists recipes (
  id        text primary key,
  name_en   text not null,
  name_zh   text,
  category  text,
  yield_portions numeric,
  -- items: [{ ingredient_id, name_en, name_zh, grams }]
  items     jsonb default '[]'::jsonb,
  allergen_ids jsonb default '[]'::jsonb
);

create table if not exists menu_days (
  id        text primary key,
  date      date not null,
  site      text,
  -- slots: { meat|veg1|veg2|carb|dairy|fruit|side : { name_en, recipe_id } | null }
  slots     jsonb default '{}'::jsonb,
  notes     text
);
create index if not exists menu_days_date_idx on menu_days(date);

create table if not exists people (
  id        text primary key,
  name      text not null,
  kind      text default 'kid',     -- kid | employee | guest
  site_id   text references sites(id) on delete set null,
  date_in   date,
  date_out  date,
  -- up to 3 allergen ids
  allergen_ids jsonb default '[]'::jsonb
);

create table if not exists subscribers (
  id         text primary key,
  email      text not null,
  name       text,
  active     boolean default true,
  created_at date default current_date
);

-- optional log of newsletter sends (written by the edge function)
create table if not exists newsletter_log (
  id         uuid primary key default gen_random_uuid(),
  sent_at    timestamptz default now(),
  menu_date  date,
  recipients int,
  ok         boolean,
  detail     jsonb
);

-- ------------------------------------------------------------
-- Row Level Security
-- Catering staff app: enable RLS and add policies that match how
-- you authenticate. Below is a permissive starting point for a
-- single-tenant staff tool using the anon key. TIGHTEN before
-- exposing publicly (e.g. require auth.role() = 'authenticated').
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['allergens','sites','ingredients','recipes','menu_days','people','subscribers','newsletter_log']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($p$create policy %1$I on %1$I for all using (true) with check (true);$p$, t);
  end loop;
end $$;
