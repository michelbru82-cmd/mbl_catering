-- ============================================================
-- MBL CRM — optional demo seed (run AFTER schema.sql)
-- Gives a connected Supabase project the same starter data as the
-- local demo. Follow-up/close dates are relative to CURRENT_DATE so
-- the dashboard has live follow-ups. Safe to re-run (on conflict).
-- ============================================================
begin;

insert into companies (id, name, industry, size, website, phone, address, country, description, linkedin) values
  ('co_fbws','FBWS International','Education','51-200','https://www.fbws.tw','+886 2 1234 5678','Taipei, Taiwan','Taiwan','Bilingual school group and long-standing catering client.','https://linkedin.com/company/fbws'),
  ('co_tsmc','Formosa Tech Park','Technology','1000+','https://example-tech.tw','+886 3 555 0000','Hsinchu, Taiwan','Taiwan','Corporate campus — daily staff-canteen catering prospect.',null),
  ('co_greenfarm','GreenFarm Produce Co.','Food & Agriculture','11-50','https://greenfarm.example','+886 4 222 3333','Taichung, Taiwan','Taiwan','Organic vegetable and fruit supplier.',null),
  ('co_lumiere','Lumière Events','Events & Hospitality','11-50','https://lumiere-events.example','+33 1 44 55 66 77','Paris, France','France','Event agency — wedding & gala catering partner.',null)
on conflict (id) do nothing;

insert into contacts (id, first_name, last_name, full_name, job_title, department, company_id,
    email_work, phone_mobile, phone_work, website, line, whatsapp, wechat, linkedin,
    address_work, city, country, where_met, source, tags, owner, status, rating, language, notes,
    last_contacted, next_follow_up)
values
  ('ct_amelie','Amélie','Laurent','Amélie Laurent','Head of Operations','Operations','co_fbws',
    'amelie.laurent@fbws.tw','+886 912 345 678','+886 2 1234 5679','https://www.fbws.tw','amelie.l','+886912345678',null,'https://linkedin.com/in/amelielaurent',
    'Neihu District, Taipei','Taipei','Taiwan','School catering review, on-site','Existing client','["VIP","Decision maker"]','Michel','customer','high','en','Main contact for the daily school menu contract.',
    to_char(current_date - 6,'YYYY-MM-DD'), to_char(current_date - 1,'YYYY-MM-DD')),
  ('ct_chen','Wei','Chen','Chen Wei-Ting','Facilities Manager','Admin','co_tsmc',
    'wt.chen@example-tech.tw','+886 928 111 222',null,null,'chenwt',null,'chen_weiting',null,
    'Hsinchu Science Park','Hsinchu','Taiwan','Food expo, Taipei Nangang','Trade show','["Hot lead"]','Michel','prospect','high','zh','Evaluating a 500-cover daily staff canteen.',
    to_char(current_date - 3,'YYYY-MM-DD'), to_char(current_date,'YYYY-MM-DD')),
  ('ct_lin','Mei','Lin','Lin Mei-Hua','Sales Director','Sales','co_greenfarm',
    'meihua@greenfarm.example','+886 933 444 555','+886 4 222 3334','https://greenfarm.example','greenfarm_mei','+886933444555',null,'https://linkedin.com/in/linmeihua',
    'Taichung Industrial Park','Taichung','Taiwan','Introduced by a supplier','Referral','["Supplier"]','Michel','partner','medium','zh','Supplies organic vegetables.',
    to_char(current_date - 14,'YYYY-MM-DD'), to_char(current_date + 4,'YYYY-MM-DD')),
  ('ct_dubois','Julien','Dubois','Julien Dubois','Managing Director','Management','co_lumiere',
    'j.dubois@lumiere-events.example','+33 6 12 34 56 78','+33 1 44 55 66 77','https://lumiere-events.example',null,'+33612345678',null,'https://linkedin.com/in/juliendubois',
    '8 Rue de Rivoli, Paris','Paris','France','Wedding fair, Paris','Networking event','["Events","International"]','Michel','prospect','medium','en','Interested in gala & wedding catering.',
    to_char(current_date - 20,'YYYY-MM-DD'), to_char(current_date + 7,'YYYY-MM-DD'))
on conflict (id) do nothing;

insert into deals (id, title, company_id, contact_id, value, stage, probability, close_date, owner) values
  ('dl_canteen','Staff canteen — 500 covers/day','co_tsmc','ct_chen',4800000,'proposal',50,to_char(current_date + 25,'YYYY-MM-DD'),'Michel'),
  ('dl_gala','Autumn gala catering (300 guests)','co_lumiere','ct_dubois',950000,'qualified',30,to_char(current_date + 50,'YYYY-MM-DD'),'Michel'),
  ('dl_school','School menu contract renewal','co_fbws','ct_amelie',3600000,'negotiation',80,to_char(current_date + 12,'YYYY-MM-DD'),'Michel'),
  ('dl_supply','Organic produce framework','co_greenfarm','ct_lin',600000,'won',100,to_char(current_date - 8,'YYYY-MM-DD'),'Michel')
on conflict (id) do nothing;

insert into tasks (id, title, kind, contact_id, deal_id, due_date, done) values
  ('tk_1','Send tasting-session proposal','email','ct_chen','dl_canteen',to_char(current_date,'YYYY-MM-DD'),false),
  ('tk_2','Call about contract renewal terms','call','ct_amelie','dl_school',to_char(current_date - 1,'YYYY-MM-DD'),false),
  ('tk_3','Follow up after Paris wedding fair','followup','ct_dubois','dl_gala',to_char(current_date + 7,'YYYY-MM-DD'),false),
  ('tk_4','Confirm July vegetable prices','todo','ct_lin',null,to_char(current_date + 4,'YYYY-MM-DD'),false)
on conflict (id) do nothing;

insert into activities (id, contact_id, kind, note, at) values
  ('av_1','ct_amelie','meeting','On-site menu review — wants more vegetarian options.',to_char(current_date - 6,'YYYY-MM-DD')),
  ('av_2','ct_chen','call','Discussed canteen scope; sending proposal and arranging a tasting.',to_char(current_date - 3,'YYYY-MM-DD')),
  ('av_3','ct_dubois','note','Met at Paris wedding fair. Interested in 2026 gala season.',to_char(current_date - 20,'YYYY-MM-DD'))
on conflict (id) do nothing;

commit;
