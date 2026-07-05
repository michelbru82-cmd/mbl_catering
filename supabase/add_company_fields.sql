-- MBL Catering — add company legal-identity fields to user profiles.
-- Admin fills these when creating a user; the user sees them read-only on the
-- "My company infos" page. Safe to re-run.
alter table public.profiles add column if not exists company_official text;   -- official / registered company name
alter table public.profiles add column if not exists company_trading  text;   -- trading (doing-business-as) name
alter table public.profiles add column if not exists company_rep      text;   -- legal representative name
alter table public.profiles add column if not exists company_tax      text;   -- tax / VAT number
