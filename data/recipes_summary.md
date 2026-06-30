# Recipes dataset — extraction summary

Source: Google Spreadsheet "RECIPES" (markdown export), parsed into
`/home/user/mbl_catering/data/recipes.json`.

## Total recipe count

- **147 recipes** total in `recipes.json`.
  - **117** come from the main recipe table (numbered No. 1–117) and carry full
    bilingual ingredient lists.
  - **30** additional name-only placeholder recipes come from a second
    "New menu processing… / REGULAR MEALS / US RECIPES" backlog table. These have
    a name (EN + ZH) but **no ingredients listed** in the sheet (empty ingredient
    cells, photo URLs only).
- **114** recipes have at least one parsed ingredient. The 33 with empty
  `ingredients` are the 30 placeholders plus 3 main-table recipes whose ingredient
  cell was `#N/A` (`broccolis & blue cheese quiche`,
  `Braised beef chuck, black bean & sesame sauce`, `Irish Beef Ale stew`).

## Source layout

The spreadsheet (as markdown) contains three stacked regions:

### Region A — main recipe table (rows 1–117)
21 columns. Relevant ones (0-indexed cell position after splitting on `|`):

| idx | column | used as |
| --- | --- | --- |
| 0  | (name) English recipe name | `name_en` |
| 1  | KEYWORD (e.g. `VEGAN-1【FRANCE】`) | — (category+number+country code) |
| 2  | MEAL (CHINESE) | `name_zh` |
| 3–10 | DF, GF, VEG, VEGAN, FIT, KETO, PROT, PESC | dietary flags (OK/NO) — not exported |
| 11 | CAT | `category` (lowercased) |
| 12 | COUNTRY (e.g. `【FRANCE】`) | — |
| 13–14 | SPICY, SALTED | chili/salt icons — not exported |
| 15 | No | recipe number (1–117) |
| 16 | IMG | image URL — not exported |
| 17 | KEYWORD (category repeat) | — |
| 18 | **ingredient list** | `ingredients` (see encoding below) |
| 19 | SCHOOL KEYWORD | not exported |
| 20 | country region code (EUR/AME/ASI/ZH) | not exported |

### Region B — "New menu processing…" backlog table
19 columns. Re-lists recipes 1–91 (duplicates of Region A, with cleaner KEYWORD
and SFTP/URL columns) plus a `REGULAR MEALS` / `US RECIPES` subsection of new
recipe names that have **no ingredient data yet**. Only the genuinely new,
not-already-seen names are added to the JSON (as placeholders with empty
ingredients). Duplicates of Region A are skipped.

### Region C — gram quantity mini-tables
36 small 10-column tables, each one row of
`ingredient1 … ingredient5 | grams1 … grams5`, e.g.
`beef sirloin | black beans | sesame seeds | Sesame oil | olive oil (EVOO) | 120 | 20 | 5 | 5 | 2`.
These give per-ingredient gram weights but **carry no recipe name** and appear in
a different order than Region A.

## How ingredient quantities were encoded

- In **Region A**, ingredients are a single comma-separated cell: the 5 English
  ingredient names first, then their 5 Traditional-Chinese names, e.g.
  `couscous, carrots, unsalted almonds, eggs, courgettes, 北非庫斯小米, 胡蘿蔔, 杏仁, 雞蛋, 櫛瓜`.
  The parser splits on top-level commas (respecting parentheses and quotes so that
  names like `beef, loin cut` and additive lists in `(...)` stay intact), then
  partitions items into EN (no CJK) vs ZH (contains CJK) and pairs them by index.
  Region A itself has **no gram weights** — every ingredient there is positional.
- **Gram weights** live only in Region C. They were attached to a recipe **only
  when a Region-C table's set of 5 ingredient names is identical to a recipe's set
  of ingredient EN names** (a confident, exact match). This yields grams for
  **2 recipes** (`vegetarian lasagna`, `Braised beef chuck, bolognaise sauce`).
  For every other recipe `grams` is `null`.

## Caveats

- **Grams are mostly null.** The named recipes (Region A) and the gram mini-tables
  (Region C) use different ingredient-name vocabularies and orderings, and there is
  no key linking them. Only exact ingredient-name-set matches were trusted; fuzzy
  or positional matching was deliberately avoided to prevent assigning wrong
  quantities. If a reliable recipe↔gram-table mapping exists elsewhere, grams could
  be backfilled later.
- **No `yield_portions`** information is present anywhere in the sheet, so it is
  `null` for every recipe.
- **`category`** is the sheet's CAT column, which is a protein/diet keyword
  (`vegan`, `vegetarian`, `beef sirloin`, `filet beef`, `mince beef`, `duck leg`,
  …) rather than a starter/main/side/dessert taxonomy. One Region-A recipe
  (`Bacon wrapped meatloves`, No. 109) has an empty CAT cell, so its category is `""`.
- **Region B duplicates** of Region A recipes are intentionally dropped; only new
  names are kept. Those new names are ingredient-less placeholders.
- Spicy/salted/dairy-free/gluten-free/keto/etc. dietary flags and image/URL columns
  were not carried into the JSON (out of scope for the requested schema).
- Some emoji/encoding artifacts (e.g. mojibake chili/salt icons `ð¶️`) appear in the
  raw sheet's KEYWORD/SPICY columns; these columns are not exported, so the JSON is clean.
