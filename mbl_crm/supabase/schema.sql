-- ============================================================
-- MBL CRM — Supabase / Postgres schema
-- Run this in the Supabase SQL editor, then (optionally) seed.sql.
-- Column shapes match the web app's local-mode objects exactly, so
-- the LocalAdapter and SupabaseAdapter are interchangeable.
--
-- Access model: a private, team-shared CRM. Row Level Security is
-- ON and every table grants full access to signed-in (authenticated)
-- users. Anonymous visitors get nothing.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- companies ----------
create table if not exists companies (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  industry    text,
  size        text,
  website     text,
  phone       text,
  address     text,
  country     text,
  description text,
  linkedin    text,
  created_at  text,
  inserted_at timestamptz default now()
);

-- ---------- contacts ----------
create table if not exists contacts (
  id            text primary key default gen_random_uuid()::text,
  first_name    text,
  last_name     text,
  full_name     text,
  job_title     text,
  department    text,
  company_id    text references companies(id) on delete set null,
  photo         text,
  email_work    text,
  email_home    text,
  phone_mobile  text,
  phone_work    text,
  website       text,
  line          text,
  whatsapp      text,
  wechat        text,
  telegram      text,
  linkedin      text,
  facebook      text,
  instagram     text,
  x             text,
  address_work  text,
  address_home  text,
  city          text,
  country       text,
  where_met     text,
  source        text,
  tags          jsonb default '[]'::jsonb,
  owner         text,
  status        text default 'lead',   -- lead | prospect | customer | partner | lost
  rating        text default 'medium', -- low | medium | high
  language      text,
  notes         text,
  last_contacted text,
  next_follow_up text,
  created_at    text,
  inserted_at   timestamptz default now()
);
create index if not exists contacts_company_idx on contacts(company_id);
create index if not exists contacts_followup_idx on contacts(next_follow_up);

-- ---------- deals ----------
create table if not exists deals (
  id          text primary key default gen_random_uuid()::text,
  title       text not null,
  company_id  text references companies(id) on delete set null,
  contact_id  text references contacts(id) on delete set null,
  value       numeric,
  stage       text default 'new',   -- new | qualified | proposal | negotiation | won | lost
  probability int,
  close_date  text,
  owner       text,
  notes       text,
  created_at  text,
  inserted_at timestamptz default now()
);

-- ---------- tasks / follow-ups ----------
create table if not exists tasks (
  id          text primary key default gen_random_uuid()::text,
  title       text not null,
  kind        text default 'followup', -- followup | call | email | meeting | todo
  contact_id  text references contacts(id) on delete cascade,
  deal_id     text references deals(id) on delete set null,
  due_date    text,
  done        boolean default false,
  created_at  text,
  inserted_at timestamptz default now()
);
create index if not exists tasks_contact_idx on tasks(contact_id);
create index if not exists tasks_due_idx on tasks(due_date);

-- ---------- activities (interaction timeline) ----------
create table if not exists activities (
  id          text primary key default gen_random_uuid()::text,
  contact_id  text references contacts(id) on delete cascade,
  kind        text default 'note',  -- note | call | email | meeting | created | card
  note        text,
  at          text,
  created_at  text,
  inserted_at timestamptz default now()
);
create index if not exists activities_contact_idx on activities(contact_id);

-- ============================================================
-- Row Level Security — signed-in team members only
-- ============================================================
alter table companies  enable row level security;
alter table contacts   enable row level security;
alter table deals      enable row level security;
alter table tasks      enable row level security;
alter table activities enable row level security;

do $$
declare tbl text;
begin
  foreach tbl in array array['companies','contacts','deals','tasks','activities'] loop
    execute format('drop policy if exists "team_all" on %I;', tbl);
    execute format($f$create policy "team_all" on %I
      for all to authenticated using (true) with check (true);$f$, tbl);
  end loop;
end $$;
