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

-- catering places (multi-tenant). Each place has its own menus, people,
-- subscribers and menu-builder config; recipes/ingredients/allergens are shared.
create table if not exists places (
  id             text primary key,
  name           text not null,
  name_zh        text,
  covers         int default 0,
  representative text,
  tax_number     text,
  email          text,
  phone          text,
  address        text,
  delivery_site  text
);

create table if not exists ingredients (
  id        text primary key,
  name_en   text not null,
  name_zh   text,
  supplier  text,
  category  text,            -- MEATS | VEGETABLES / FRUITS | DAIRY | ... (from sheet)
  origin    text,            -- country of origin (from sheet col K)
  kcal      numeric,         -- per 100 g (imported from 'full ingredients list' sheet, cols J-S)
  protein   numeric,
  carbs     numeric,
  fat       numeric,
  sugar     numeric,
  added_sugar numeric,
  fiber     numeric,
  sodium    numeric,         -- g per 100 g (source sheet unit)
  calcium   numeric,         -- mg per 100 g
  salt      numeric,         -- derived ≈ sodium × 2.5 (legacy field)
  price_per_kg numeric,        -- ingredient cost per kg (for recipe costing)
  unit_weight  numeric,        -- weight (g) of one purchase unit (from MBL import)
  unit_label   text,           -- purchase unit label (e.g. 公斤 / 包 (500g))
  allergen_ids jsonb default '[]'::jsonb
);

create table if not exists recipes (
  id        text primary key,
  name_en   text not null,
  name_zh   text,
  category  text,
  yield_portions numeric,
  portion_weight numeric,      -- portion weight (g) per cover (from MBL import)
  -- menu-builder tags
  course    text,            -- main | vegetable | carb | dairy | fruit | side
  protein   text,            -- chicken | beef | pork | fish | duck | vegetarian | vegan | other
  cuisine   text,            -- western | asian
  contains_carb boolean default false,
  -- items: [{ ingredient_id, name_en, name_zh, grams }]
  items     jsonb default '[]'::jsonb,
  allergen_ids jsonb default '[]'::jsonb
);

create table if not exists menu_days (
  id        text primary key,
  place_id  text references places(id) on delete cascade,
  date      date not null,
  site      text,
  -- slots: { meat|veg1|veg2|carb|dairy|fruit|side : { name_en, recipe_id } | null }
  slots     jsonb default '{}'::jsonb,
  notes     text
);
create index if not exists menu_days_date_idx on menu_days(date);

create table if not exists people (
  id        text primary key,
  place_id  text references places(id) on delete cascade,
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
  place_id  text references places(id) on delete cascade,
  email      text not null,
  name       text,
  active     boolean default true,
  created_at date default current_date
);

-- app settings (e.g. the menu-builder configuration, id = 'menu_config')
create table if not exists settings (
  id        text primary key,
  place_id  text references places(id) on delete cascade,
  name      text,
  months    jsonb,
  service_days jsonb,
  weekday   jsonb,
  nutrition jsonb,
  rotation_max int,
  rotation_window_days int,
  min_repeat_gap int,
  spread_allergens boolean,
  keep_existing boolean,
  max_cost  numeric,
  updated_at timestamptz default now()
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
  foreach t in array array['allergens','sites','places','ingredients','recipes','menu_days','people','subscribers','settings','newsletter_log']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($p$create policy %1$I on %1$I for all using (true) with check (true);$p$, t);
  end loop;
end $$;
