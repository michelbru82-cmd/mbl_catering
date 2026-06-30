# Ingredients Extraction Summary

**Source:** Google Spreadsheet (markdown export) — MBL catering ordering workbook.
**Output:** `ingredients.json` — 253 ingredient rows.

## IMPORTANT data-quality caveat (read first)

This workbook is a **supplier-ordering / shopping-list spreadsheet**, NOT a
nutrition database. After a full scan of every sheet/section there is **no
nutrition data and no allergen data anywhere** in the file:

- No calories/kcal/energy column (English or Chinese: kcal, calorie, 熱量, 大卡).
- No protein / carbohydrate / fat / sugar / fibre columns (蛋白質, 碳水, 脂肪, 糖, 膳食纖維).
- No salt/sodium column (鈉).
- No allergen column or allergen labels (gluten, milk, eggs, nuts, soy, 過敏原, etc.).

Consequently **every** macro field (`kcal`, `protein_g`, `carbs_g`, `fat_g`,
`sugar_g`, `fiber_g`, `salt_g`) is set to `null`, and `allergens` is `[]` for
all rows. These fields were included to match the requested schema, but the
underlying values do not exist in the source. They would have to come from an
external nutrition reference, not this spreadsheet.

## What the spreadsheet actually contains

The "master list of ingredients" is spread across **21 per-supplier order
tables** (one block per supplier). Each block has a header row identifying the
supplier (e.g. `| FRIDAY | TSAITUNG | ... | By unit | ... | Order | ...`)
followed by ingredient rows. The remaining sheets are WhatsApp order-message
tabs and supplier name-mapping tables, which were ignored per instructions.

### Columns that existed in the ingredient tables
Per ingredient row, left-to-right (after a usually-blank leading cell):

1. `name_en` — ingredient name in English
2. `name_zh` — name in Traditional Chinese
3. package/unit weight in grams (e.g. 1000, 3000) — NOT a nutrient
4. unit price / line total (sparse)
5. two columns of `0` (school-menu on/off counters, always 0)
6. order quantity (how many units to order this week)
7. order unit (公斤 / 包 / 罐 / 斤 / 個 ...)
8. order-line text (`ð¢ <zh> (<en>) 數量= ...`) and trailing delivery/payment notes

Only columns 1 (name_en), 2 (name_zh), and the supplier (from the block header)
were extracted as meaningful ingredient master data. Columns 3–8 are
ordering/logistics fields, not nutrition.

## Extraction method
- Located each supplier block by its header row containing a known supplier name
  plus the order-config token `By unit` or `Weight unit`.
- Read every data row until the next separator/header, taking the English and
  Chinese name cells. Supplier taken from the block header.
- Skipped blank rows and noise cells (`#N/A`, `#REF!`, `0`, empty).
- De-duplicated on (name_en lowercased, name_zh, supplier).

## Totals
- **Total ingredient rows:** 253

### Count by supplier
| Supplier | Count |
|---|---|
| TSAITUNG | 50 |
| DINGYAO | 47 |
| LI-FA | 37 |
| CVS | 24 |
| DAYONG | 22 |
| PNP FOOD | 20 |
| FFISH | 11 |
| ONLINE COSTCO | 7 |
| FRESH DELIGHT | 6 |
| CHEZ BIX | 5 |
| TRUFFORMOSA | 4 |
| I-JAH | 4 |
| YU-HO | 4 |
| CHIOSHIN | 3 |
| EAKUP | 3 |
| CHINYI EGG | 2 |
| HUANSHENG | 2 |
| HUANG PING | 1 |
| LEEZEN | 1 |

## Distinct allergen names seen
**None.** The spreadsheet contains no allergen column or allergen labels.

## Other caveats
- A few non-food items appear in the supplier tables and were kept because they
  are genuine rows of the master list: e.g. EAKUP `vacuum bags 1520/2025/2260`
  (packaging) and HUANSHENG `Washing detergent` / `Rinse aid` (cleaning supplies).
- The same ingredient can legitimately appear under more than one supplier
  (e.g. yoghurts, cheeses); such rows are kept separately because supplier is
  part of the identity. Within a single supplier, duplicates were removed.
- Some `name_zh` values embed brand/spec text rather than a pure translation
  (e.g. `Baronia 義大利麵/ Spaghetti 500g`), preserved verbatim from the source.
- Source encoding mojibake (`ð¢`, the bullet glyph) appears only in the ignored
  order-line columns, not in the extracted name fields.
