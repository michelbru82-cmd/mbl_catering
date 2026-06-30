# Michel Bru Catering — Master Planning / Menu / Production Workbook: Domain Model

Reverse-engineered from the "logical example" Google Spreadsheet (a single tab-less markdown
export of ~1982 rows, multiple logical sheets concatenated). This documents how the pieces
relate so the system can be rebuilt as a database + app. Row numbers below refer to the
markdown export.

The operator is **MICHEL BRU LAB** (michelbru.com.tw), a B2B school / corporate-group catering
business in Taiwan. Content is bilingual **English + Traditional Chinese** (every dish and
ingredient carries a Chinese translation). New menus go live the **20th of each month**
("每個月 20 號，全新菜單正式登場 / MENU OF THE MONTH").

---

## 0. High-level structure (logical sheets inside the workbook)

| Rows | Block | Purpose |
|------|-------|---------|
| 1–6 | **Monthly summary / picnic header** | Per-date row: PICNIC TYPE, MENU x3, SPECIAL x2, LG, YC, DATE/TIME/PLACE. Dates 2026-07-01 → 07-05. |
| 8–13 | **TODAY – ALLERGENS** | Allergen alert banner for the day, per campus. |
| 15–25 | **TODAY production** | Dish-by-dish quantities to prepare today (LIU-GONG + YONGCHUN). |
| 27–36 | **NEXT DAY (TOMORROW) production** | Same layout, next service day. |
| 38–246 | **PROTEINS LIST** (recipe catalog) | Master recipe list with bilingual name, ingredient string, portion grams, and nutrition. |
| 248–456 | **PROTEINS LIST (copy)** | Duplicate / second-sitting copy of the recipe catalog. |
| 458–624 | **PICNIC / EVENT calendar** | One row per calendar date with operating status; occasional special picnic/sandwich orders. Dates 2025-08-25 → 2026-02-05. |
| 626–699 | **SCHOOL roster (head counts)** | One row per diner (teacher/student) with site + 3 meal-service flags. Source of head counts. |
| 700–725 | **Production totals** | KG (COOKED) and per-service TOTAL head-count rollups (e.g. `146`). |
| 727–732 | **WESTERN MENU / MENU OF THE DAY** | Compact "today vs tomorrow" course card (Side / Main / Veggies / Starch / Dairy / Fruit / Cake). |
| 734–795 | **Recipe → Ingredient explosion** | `Category | Ingredients | Total Weight (Raw) | Raw weight / Unit` plus per-site columns. The shopping/production bridge. |
| 482–846 | **Shopping list by SUPPLIER** | One block per vendor (TSAITUNG, I-JAH, DINGYAO …) with ingredient, pack size, computed 斤/個/包 quantity, and an auto-generated order message. |
| 847–895 | **MENU OF THE MONTH grid** | THE canonical daily-menu table. One row per service date with Meat / Veg1 / Veg2 / Carb / Dairy / Dessert / Side dish + full ingredient string + allergens + nutrition. Dates 2026.07.01 → 2026.07.31. |
| 897–1885 | **Category dropdown catalogs** | Per-category dish option lists (Meat, Vegetable, Carbohydrates, Dairy, Fruits, Dessert, Side dish) that feed the menu grid's data-validation dropdowns. |
| 1886+ | **Footer / Useful Links** | Marketing footer, dietitian contact. |

---

## 1. The MENU — how a day's menu is composed

### 1a. Canonical source: "MENU OF THE MONTH" grid (rows 847–895)

This is the master daily menu. Column order (English header row 847, separator 848,
then alternating **English row / Chinese row** per date):

```
| Date | MEAT (肉類) | Vegetable (蔬菜) | Vegetable (蔬菜) | Carbohydrates (澱粉) |
  Dairy (乳製品) | Dessert (甜點) | Side dish (配菜) | Ingredients (食材, full string) | Allergens (過敏原) |
  [+ nutrition: Calories/Proteins/Lipids/Carbs/Sugar/Added Sugar/Sodium/Calcium] |
```

So a **day's menu = 7 dish slots** (the user's "meat, veg1, veg2, carb, dairy, fruit/cake"
plus a **Side dish** course):

1. **Meat** (main course / protein) — e.g. `Three hours Pork belly`
2. **Vegetable 1 (green)** — e.g. `spinach, garlic & butter`
3. **Vegetable 2** — e.g. `Roast carrots & red onions`
4. **Carbohydrate / starch** — e.g. `Steamed rice`
5. **Dairy** — e.g. `fresh delight yoghurt`
6. **Dessert / Fruit / Cake** — e.g. `Dragon Fruits` (or `Chocolate Cake`, or `Not Applicable`)
7. **Side dish** — e.g. `Tomatoes & Mustard Dressing sauce` (often eggs, tofu, slaw, raw veg)

Each slot stores the **dish name only**; the **Ingredients** column is an auto-concatenated
string of all the chosen dishes' ingredients (English + Chinese), and the **Allergens** column
is the auto-union of those dishes' allergens. Below each English row, a Chinese-only row gives
the localized dish names.

**Verbatim example — 2026.07.01 (row 849):**
```
| 2026.07.01 | Three hours Pork belly | spinach, garlic & butter | Roast carrots & red onions |
  Steamed rice | fresh delight yoghurt | Dragon Fruits | Tomatoes & Mustard Dressing sauce |
  pork belly, soy sauce (5L), fresh basil, peeled garlic, Sesame oil, 豬五花 … |
  Milk, Mustard, Sulphur dioxide & sulphites (>10 mg/kg or 10 mg/L), Sesame seeds |
| | 三小時慢燉豬五花 | 奶油蒜炒菠菜 | 烤紅蘿蔔與紅洋蔥 | 白飯 | 福樂無糖優格 | 火龍果 | 番茄芥末醬汁 | | |
```

**Verbatim example — 2026.07.03 (fish day, with dessert + edamame side, row 853):**
```
| 2026.07.03 | Salmon pave, curry sauce | Broccolis, Tofu & Sweet peppers stir-fried |
  Sweet Potato Cubes with Rosemary | Risotto with mushrooms and confit onions |
  Not Applicable | Chocolate Cake | Lightly Seasoned Edamame | salmon, curry madras … |
  Milk, Soybeans, Sulphur dioxide & sulphites (>10 mg/kg or 10 mg/L), Fish |
```

### 1b. Month view & date range

- **Yes, there is a month view.** The MENU OF THE MONTH grid is one operating month
  (here **July 2026**). The header cell is tagged `…/2026/7`. New menu published on the 20th.
- Menu grid covers **2026.07.01 → 2026.07.31**, **service (weekday) days only** —
  weekends are skipped (no 07-04/05, 07-11/12, etc.). **23 daily menus** present.
- A separate **operating-day calendar** (rows 458–624) spans **2025-08-25 → 2026-02-05**,
  one row per calendar date with a `STATUS` of `NORMAL OPE`, `WEEKEND`, `NO SCHOOL`.
- The top summary block (rows 1–6) and TODAY/TOMORROW blocks are anchored at **2026-07-01**.

### 1c. Category option catalogs (rows 897–1885)

Per-category lists that act as the **dropdown source** for each menu slot. Each category
(Meat, Vegetable, Carbohydrates, Dairy, Fruits, Dessert, Side dish) is a long list of allowed
dish names (e.g. veg options `roast vegetables mix`, `Mix of green veggies`, `stir-fried
vegetables`, `Broccolis, butter, garlic`; dairy `Emmentaler Grand'Or`, `Kirkland Fresh
Mozarella`, `Dry tofu & soy sauce`; fruit `Mandarins`, `Apples`, `Pineapple`). These are the
domain enumerations for each slot.

---

## 2. The PRODUCTION view (rows 15–36, and the explosion at 734–795)

### 2a. TODAY / NEXT-DAY production card (rows 15–25 / 27–36)

Header row (row 15): `| 2026-07-01 | | | G | LIU-GONG | | | | YONGCHUN | | | | |`
— two site columns (**LIU-GONG** and **YONGCHUN**), each with a head-count and a total.

One row per course. Columns (observed): **course label (bilingual) | dish | _ | grams/portion
| LG head-count | _ | LG total g | _ | YC head-count | _ | YC total g | _ | grand total g**.

**Verbatim production rows (2026-07-01):**
```
| 前菜  Side dish        | Tomatoes & Mustard Dressing sauce |  | 25  | 66 |  | 1650 |  | 80 |  | 2000  |  | 3650  |
| 主餐  Main-course      | Three hours Pork belly            |  | 150 | 66 |  | 9900 |  | 80 |  | 12000 |  | 21900 |
| 綠色蔬菜 Green vegetable | spinach, garlic & butter          |  | 50  | 66 |  | 3300 |  | 80 |  | 4000  |  | 7300  |
| 蔬菜2  Vegetables      | Roast carrots & red onions        |  | 50  | 66 |  | 3300 |  | 80 |  | 4000  |  | 7300  |
| 澱粉 Starch           | Steamed rice                      |  | 100 | 66 |  | 6600 |  | 80 |  | 8000  |  | 14600 |
| 乳製品 Dairy           | fresh delight yoghurt             |  | 75  | 66 |  | 4950 |  | 80 |  | 6000  |  | 10950 |
| 水果 Fruits           | Dragon Fruits                     |  |     | 66 |  | 0    |  | 80 |  | 0     |  | 0     |
| 蛋糕 Cakes            |                                   |  |     | 66 |  |      |  | 80 |  |       |  | 146   |
```

**Quantity / grams computation (the core formula):**
```
per-site total grams (for a course) = grams_per_portion × site_head_count
grand total grams                   = Σ over sites (grams_per_portion × head_count)
```
e.g. Pork belly: 150 g × 66 (LIU-GONG) = 9900; 150 g × 80 (YONGCHUN) = 12000; total 21900 g.
The bottom `146` = total head count across both sites (66 + 80). Note the standard
side-dish / main-course gram weights: side ≈ 25 g, main ≈ 150 g, each veg ≈ 50 g,
starch ≈ 100 g, dairy ≈ 75 g.

### 2b. Recipe → Ingredient explosion / per-site batch sheet (rows 734–795)

This bridges menu → purchasing. Header (row 737):
`| Category | Ingredients | Total Weight (Raw) | Raw weight / Unit | | LIU-GONG S-1 + TEACHERS |
 LIU-GONG S-2 | LIU-GONG S-3 | LIU-GONG TEACHERS | YONGCHUN |`

For each course (MEAT, VEGETABLES (GREEN), VEGETABLES, STARCHES, DAIRY PRODUCT, SIDE DISH
PRODUCT, DESSERTS), it lists every ingredient with **raw grams per portion** and **total raw
weight** for the day, plus per-sitting head counts.

**Verbatim (MEAT, 2026-07-01):**
```
| MEAT | pork belly   | 14600 | 100 |  | 22 | 22 | 22 |  | 80 |
|      | soy sauce (5L)| 730  | 5   |
|      | fresh basil  | 1460  | 10  |
|      | peeled garlic| 2920  | 20  |
|      | Sesame oil   | 730   | 5   |
```
`Total Weight (Raw) = Raw weight/Unit × total covers`. The 22/22/22 are LIU-GONG sittings
S-1/S-2/S-3; 80 is YONGCHUN. (A duplicated site header at rows 780/785/790 reads
`LIFT S-1 + TEACHERS … ACTON` — a template label later relabelled to LIU-GONG/YONGCHUN.)
Starch rows are expressed in **KG (COOKED)** (e.g. `2200 KG (COOKED)`), reflecting a raw→cooked
yield factor.

### 2c. Shopping lists by supplier (rows 482–846)

Production demand is rolled up into **per-vendor purchase orders**. Each supplier block (e.g.
TSAITUNG, I-JAH, FFISH, DINGYAO, CHINYI EGG, LI-FA, PNP FOOD, CVS, FRESH DELIGHT …) lists
ingredient (EN + 中文), pack size, computed order quantity in Taiwanese units (**斤 catty / 個
piece / 包 pack / 公斤 kg / 桶 drum**), and an auto-generated bilingual order message
("您好, … 請送星期三早晨, 請告訴我多少錢。我們會轉帳付款。感謝 …"). Email-dispatch rows
(no_reply@/contact@michelbru.com.tw, MON–SUN) automate sending these.

---

## 3. ALLERGENS (rows 8–13 banner; per-menu column)

Two representations:

1. **Per-menu allergen union** — last data column of the MENU OF THE MONTH grid, a
   comma-separated list auto-derived from the day's chosen dishes, e.g.
   `Milk, Mustard, Sulphur dioxide & sulphites (>10 mg/kg or 10 mg/L), Sesame seeds`.
   Religion/diet tags also appear, e.g. `Beef (Religion)`, `Mango and products thereof`.

2. **TODAY allergen alert banner** (rows 8–13), keyed by date + campus, formatted:
   `TODAY - ALLERGENS / LIU-GONG CAMPUS / ALERT ALLERGEN : Milk, Mustard, Sulphur dioxide &
   sulphites (>10 mg/kg or 10 mg/L), Sesame seeds`.
   This is the same union surfaced as a daily alert per site (for the "menu of the day" email).

3. **Allergen master list (15 codes)** embedded in the menu-grid header (row 847): the EU/Taiwan
   14 + 1 set — Cereals containing gluten, Crustaceans, Eggs, Fish, Peanuts, Soybeans,
   Milk (incl. lactose), Tree nuts, Celery, Mustard, Sesame seeds, Sulphur dioxide & sulphites
   (≥10 mg/kg or 10 mg/L), Lupin, Molluscs, **Mangos** (Taiwan-specific). Each recipe declares a
   subset; the day's banner = union over the day's dishes.

---

## 4. Sites / campuses, meal sittings, head counts

### Sites / campuses (the delivery/production sites)
- **LIU-GONG** (a.k.a. **LIU-GONG CAMPUS**) — primary campus. Head count **66**
  (= 22 + 22 + 22 across three sittings) plus teachers.
- **YONGCHUN** (a.k.a. **YONGCHUN CAMPUS / YONGCHUN ONSITE / YONGCHUN PICNIC**) — head count **80**.
- Combined daily total **146** (= 66 + 80).
- `LIFT … / ACTON` appear as a leftover template header in the batch sheet (not active sites).

### Meal sittings / services
- Three sittings per campus: **SERVICE 1 / SERVICE 2 / SERVICE 3** (a.k.a. **S-1 + TEACHERS,
  S-2, S-3, TEACHERS**). In the batch sheet each LIU-GONG sitting = 22 covers; YONGCHUN served
  as one block of 80.

### Head counts — source of truth (SCHOOL roster, rows 626–699)
One row per diner: `| SCHOOL | STATUS | NAME | ENTRY DATE | EXIT DATE | SERVICE 1 | SERVICE 2 | SERVICE 3 |`
- `SCHOOL` = site (LIU-GONG …), `STATUS` = TEACHER / STUDENT,
  `ENTRY/EXIT DATE` = enrollment window (e.g. 26-01-2026 → 18-06-2026),
  `SERVICE 1/2/3` = TRUE/FALSE flags assigning the diner to a sitting.
- Roster footer: `| TOTAL SCHOOL | | | | | 22 | 22 | 22 |` → counts per service drive the
  production multipliers. A diner is counted only between ENTRY and EXIT dates (active roster).

---

## 5. How MENU → RECIPE → INGREDIENT connects (the linking logic)

```
SITE (LIU-GONG / YONGCHUN)
   └── ROSTER (diners, STATUS, ENTRY/EXIT, SERVICE 1/2/3 flags)
          └── HEAD COUNT per site per sitting  (Σ active TRUE flags)  →  66, 80 …

DAILY MENU  (one row per service date, MENU OF THE MONTH grid)
   ├── slot: Meat        ─┐
   ├── slot: Vegetable 1  │
   ├── slot: Vegetable 2  │   each slot value is a DISH NAME chosen from a
   ├── slot: Carbohydrate │   per-category OPTION CATALOG (rows 897–1885)
   ├── slot: Dairy        │
   ├── slot: Dessert/Fruit│
   └── slot: Side dish   ─┘
            │
            ▼  (dish name → recipe lookup)
RECIPE  (PROTEINS LIST etc., rows 38–456):
   name_en | name_zh | ingredient string | portion grams | nutrition (kcal, protein, fat,
   carbs, sugar, added sugar, sodium, additives) | allergen subset
            │
            ▼  (recipe → ingredient explosion, rows 734–795)
INGREDIENT LINE: ingredient_en | ingredient_zh | raw_g_per_portion | total_raw_weight
            │   total_raw_weight = raw_g_per_portion × covers
            ▼  (aggregate ingredients across the day's dishes, group by supplier)
SHOPPING LIST per SUPPLIER (rows 482–846):
   ingredient | pack size | order qty (斤/個/包/公斤) | bilingual order email

PRODUCTION CARD (rows 15–36):  per course → grams_per_portion × Σ site head counts
ALLERGEN BANNER (rows 8–13):   union of the day's dishes' allergens, per site
```

### Derived entities for a database schema
- **Site** (id, name, aliases)
- **Diner / RosterEntry** (site, status, name, entry_date, exit_date, service1, service2, service3)
- **Service / Sitting** (site, sitting_no) — head count = COUNT(active roster with flag TRUE)
- **Dish / Recipe** (name_en, name_zh, category[Meat|Veg|Carb|Dairy|Dessert|Side],
  portion_g, nutrition…, allergen_codes[])
- **RecipeIngredient** (recipe, ingredient, raw_g_per_portion, unit, supplier)
- **Ingredient** (name_en, name_zh, pack_size, unit, default_supplier)
- **Supplier** (name, delivery_day, payment_method, order_template)
- **DailyMenu** (date, site_scope) → **MenuSlot** (daily_menu, slot[meat|veg1|veg2|carb|dairy|
  dessert|side], dish_id)
- **ProductionLine** (daily_menu, site, dish, grams_per_portion, head_count, total_grams)
- **AllergenAlert** (date, site, allergen_codes[]) — computed
- **CalendarDay** (date, status[NORMAL OPE|WEEKEND|NO SCHOOL], picnic_type, special_request)

---

## Key facts (quick reference)
- **Operator:** Michel Bru Lab (Taiwan, B2B school/corporate catering), bilingual EN/中文.
- **Menu cadence:** new menu the 20th of each month; documented month = **July 2026**.
- **Menu grid date range:** 2026-07-01 → 2026-07-31 (23 weekday service days).
- **Operating calendar range:** 2025-08-25 → 2026-02-05.
- **Sites:** LIU-GONG (CAMPUS), head count 66; YONGCHUN, head count 80; total 146.
- **Sittings:** Service 1 / 2 / 3 (22 each at LIU-GONG) + Teachers.
- **Menu slots:** Meat, Vegetable 1, Vegetable 2, Carbohydrate, Dairy, Dessert/Fruit/Cake, Side dish.
- **Allergen set:** 14 EU + Mango (Taiwan) = 15 codes; per-day banner = union of dishes.
- **Production formula:** total grams = portion grams × Σ(site head counts); starches in KG cooked.
