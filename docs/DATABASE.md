# Database

Oil Blender uses **PostgreSQL** managed through **Prisma ORM** (`@prisma/adapter-pg` with a raw `pg` connection pool). The schema lives in [`prisma/schema.prisma`](../prisma/schema.prisma) and migrations are plain SQL files in [`prisma/migrations/`](../prisma/migrations/).

---

## Entity Overview

```
Oil ──< OilPairing >── Oil
 │
 └──< BlendIngredient >── Blend
```

| Table | Rows (seeded) | Purpose |
|-------|--------------|---------|
| `Oil` | ~55 | Master oil library — essential and carrier oils |
| `OilPairing` | ~800+ | Compatibility ratings between any two oils |
| `Blend` | varies | User-created blends (saved, shared, public) |
| `BlendIngredient` | varies | Line items linking a Blend to its Oils |

---

## Models

### `Oil`

The master record for every oil in the library. Each oil is either an **essential oil** or a **carrier oil** — the type drives which fields are populated and how the blend calculator applies it.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `TEXT` (cuid) | Primary key |
| `name` | `TEXT UNIQUE` | Common English name, e.g. `"Lavender"` |
| `botanicalName` | `TEXT` | Latin name, e.g. `"Lavandula angustifolia"` |
| `type` | `OilType` enum | `ESSENTIAL` or `CARRIER` |
| `origin` | `TEXT` | Primary country/region of origin |
| `history` | `TEXT` | 2–3 sentences of historical context |
| `description` | `TEXT` | Character, texture, and massage applications |
| `benefits` | `TEXT[]` | Array of 4–6 benefit strings |
| `contraindications` | `TEXT[]` | Array of cautions/warnings (may be empty) |
| `aroma` | `TEXT` | Brief aroma description |
| `consistency` | `TEXT?` | Carrier only: `light`, `medium`, or `heavy` |
| `absorbency` | `TEXT?` | Carrier only: `fast`, `medium`, or `slow` |
| `shelfLifeMonths` | `INT?` | Carrier only: typical shelf life in months |
| `dilutionRateMax` | `FLOAT?` | Essential only: max safe dilution (e.g. `0.02` = 2%) |
| `buyUrl` | `TEXT?` | Optional affiliate/purchase link |
| `imageUrl` | `TEXT?` | Optional hero image URL |
| `imageAlt` | `TEXT?` | Alt text for the image |
| `createdAt` / `updatedAt` | `TIMESTAMP` | Managed by Prisma |

**Relations:**
- `pairsWithA` / `pairsWithB` — two sides of the `OilPairing` join (see below)
- `blendIngredients` — all `BlendIngredient` rows that reference this oil

---

### `OilPairing`

Records the compatibility verdict between two specific oils. Pairings are **bidirectional but stored once** — the lower cuid always goes in `oilAId` and the higher in `oilBId` (sorted lexicographically before every write). This is enforced by the `@@unique([oilAId, oilBId])` constraint and the `pairingKey()` helper in [`lib/pairing-utils.ts`](../lib/pairing-utils.ts).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `TEXT` (cuid) | Primary key |
| `oilAId` | `TEXT` | FK → `Oil.id` (sorted lower of the two IDs) |
| `oilBId` | `TEXT` | FK → `Oil.id` (sorted higher of the two IDs) |
| `rating` | `PairingRating` enum | See rating table below |
| `reason` | `TEXT` | One-sentence explanation shown to the user |

**Cascade:** deleting either referenced oil cascades to delete all its pairings.

**Lookup pattern:** to find the pairing for oils `x` and `y`, always call `pairingKey(x, y)` which returns `min:max` — then do a single map lookup. Never query with `oilAId=x AND oilBId=y`; it will miss half the cases.

#### `PairingRating` enum

| Value | Meaning | Shown to user as |
|-------|---------|-----------------|
| `EXCELLENT` | Actively beneficial together, enhances effects | Excellent |
| `GOOD` | Compatible, no issues | Compatible |
| `CAUTION` | Mild concern (competing scents, mild sensitisation risk) | Caution |
| `AVOID` | Not recommended (therapeutic conflict, sensitisation, aroma clash) | Avoid |
| `UNSAFE` | Hand-curated safety override — must not be combined | Unsafe |

`UNSAFE` is never emitted by AI enrichment; it is only applied by the hand-curated list in [`scripts/unsafe-pairs.ts`](../scripts/unsafe-pairs.ts).

---

### `Blend`

A user-created blend formula. Blends are created via the blend builder and given a share URL. They are not tied to any user account.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `TEXT` (cuid) | Primary key, used in the share URL `/blend/:id` |
| `name` | `TEXT` | User-supplied blend name |
| `description` | `TEXT?` | Optional free-text description |
| `about` | `TEXT?` | Admin-added editorial description (takes precedence over `description` on the detail page) |
| `authorName` | `TEXT?` | Display name of the blend's creator |
| `totalVolumeMl` | `FLOAT` | Total volume of the finished blend in ml |
| `dilutionRate` | `FLOAT` | Overall dilution ratio, e.g. `0.02` = 2% |
| `purpose` | `TEXT?` | Optional intended use (relaxation, pain relief, etc.) |
| `notes` | `TEXT?` | User's own freeform notes |
| `grade` | `TEXT` | Compatibility grade: `A`, `B`, `C`, or `F` (stored as string, not enum) |
| `viewCount` | `INT` | Incremented fire-and-forget on every detail page view |
| `lastAccessedAt` | `TIMESTAMP?` | Updated on every detail page view |
| `isFeatured` | `BOOLEAN` | Admin flag — shown in the public featured blends section |
| `isPinned` | `BOOLEAN` | Admin flag — always appears first in listings |
| `isHidden` | `BOOLEAN` | Admin flag — excluded from all public listings |
| `createdAt` / `updatedAt` | `TIMESTAMP` | Managed by Prisma |

**Grade** is computed by the blend builder at save time based on the worst pairing rating across all ingredient combinations:
- `A` — all pairings EXCELLENT or GOOD
- `B` — worst is CAUTION
- `C` — worst is AVOID
- `F` — any UNSAFE pairing present

**Auto-purge:** the `/api/cron/purge` endpoint deletes non-featured, non-pinned blends whose `lastAccessedAt` (or `createdAt`) is older than 30 days.

---

### `BlendIngredient`

Join table between `Blend` and `Oil`, carrying the computed quantity data for each oil in the formula.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `TEXT` (cuid) | Primary key |
| `blendId` | `TEXT` | FK → `Blend.id` |
| `oilId` | `TEXT` | FK → `Oil.id` |
| `percentagePct` | `FLOAT` | Percentage of this oil in the blend (0–100) |
| `volumeMl` | `FLOAT` | Absolute volume in ml |

**Cascade:** deleting a blend cascades to delete all its ingredients.  
**Restrict:** deleting an oil is blocked if it exists in any `BlendIngredient` row — you must remove the ingredient references first.

`@@unique([blendId, oilId])` — an oil can appear at most once per blend.

---

## Relationships

```
Oil
 ├── pairsWithA ──► OilPairing.oilAId  ─┐
 └── pairsWithB ──► OilPairing.oilBId  ─┘  (one row per pair, IDs sorted)

Oil
 └── blendIngredients ──► BlendIngredient.oilId
                                │
Blend ◄── BlendIngredient.blendId
```

---

## Migration History

| Migration | What changed |
|-----------|-------------|
| `20260501232508_init` | Initial schema: `Oil`, `OilPairing`, `Blend`, `BlendIngredient`; both enums |
| `20260504000000_add_oil_image` | Added `Oil.imageUrl`, `Oil.imageAlt` |
| `20260504000002_blend_stats_featured` | Added `Blend.viewCount`, `lastAccessedAt`, `authorName`, `about`, `isFeatured`, `isPinned`, `isHidden` |

Migrations are applied automatically at container startup via [`scripts/migrate.js`](../scripts/migrate.js), which uses the `pg` package directly (no Prisma CLI required in the runtime image).

---

## Seeding and Enrichment

**Seed** (`scripts/seed.ts` / `seed.js`) — upserts ~55 oils from [`scripts/oil-definitions.ts`](../scripts/oil-definitions.ts) and ~96 hand-curated EXCELLENT/CAUTION/UNSAFE pairings. Safe to re-run at any time.

**Enrich** (`scripts/enrich-oils.ts` / `enrich.js`) — calls the Claude API to generate richer oil data (botanical context, origin, history, full descriptions) and a complete AI-generated pairing matrix for every oil. Runs in two passes:
1. Upsert all oil fields
2. Upsert all AI pairings, then apply the UNSAFE overrides from `unsafe-pairs.ts`

Both scripts can be triggered from the Admin → Database panel in the web UI.
