<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Where things live

- `app/admin/` — admin panel; auth via `middleware.ts` + `ADMIN_SECRET` cookie. `layout.tsx` provides the shared nav (self-suppresses on `/admin/login` via `usePathname`).
- `components/blend/` — blend builder UI:
  - `BlendBuilder.tsx` — top-level builder; owns all blend state, the active tab (`Carriers / Essentials / Quantities / Save`), hydration from localStorage, and save flow.
  - `OilPicker.tsx` — shared body-only picker used for both carriers (Tab 1) and essential oils (Tab 2). Identical highlight-toggle behaviour; props are `oils`, `selectedOils`, `noun`, `maxCount`, etc. No card shell or accordion header — the parent tab provides title/subtitle.
  - `NumberStepper.tsx` — `[−] [N] [+]` widget (36 px touch targets) used for ml (carriers) and drops (EOs) on the Quantities tab; supports an `over` red palette for over-max-dilution rows.
  - `SelectedOilsCard.tsx` — "In Your Blend" right-column summary; vertical list with per-row ✕ and the Reset button in the card header.
  - `QuantityTable.tsx` — read-only summary table on Tab 4; carriers show `—` in `%` (ml is source of truth there).
  - `BlendScaler.tsx` — saved-blend volume rescaler on the detail page.
  - `BlendCart.tsx` — header widget. Reads `loadDraft()`, renders the flask icon + two-tone count badge + dropdown panel; computes/persists the A–F grade by fetching `/api/pairings` (skipped on `/blend` to avoid double-fetching the builder's own grade).
- `lib/blend-calculator.ts` — pure math + types for `calculateBlend`. Exports `DROPS_PER_ML`, `pctToDrops`, `dropsToPct`. Carrier ingredients pass `volumeMl` directly; the calculator no longer renormalises by `sumCarrierPct`.
- `lib/blend-scorer.ts` — pure scoring; exports `BlendGrade`, `ScoredPairing`, `scoreBlend()`.
- `lib/blend-storage.ts` — localStorage helpers for the in-progress blend draft (schema `v: 2`); fires the `oil-blender:draft-changed` custom event so same-tab listeners stay in sync.
- `lib/compare-storage.ts` — localStorage helpers for the two compare slots (schema `v: 2`); `pushToCompare` returns `'A' | 'B' | 'full' | 'already'` so callers can show the named-slot Replace popover.
- `lib/grade-styles.ts` — shared `Record<BlendGrade, string>` of badge classes; consumed by `BlendCart` and `BlendCard`.
- `lib/pairing-utils.ts` — pairing helpers (`sortPairingIds`, `pairingKey`, `buildPairingMap`).
- `lib/use-drag-scroll.ts` — Pointer-event drag-to-scroll hook (used by `<CompatibilityMatrix>`); skips drag when the pointer-down target is a button/link/input.
- `lib/oil-enrichment.ts` — Claude-backed enrichment helper (prompt caching + truncation retry baked in); exports `ENRICHMENT_MODEL`.
- `lib/format-time.ts` — `relativeTime(date)` helper used across admin pages.
- `scripts/migrate.js` — lightweight `pg`-only migration runner. The Prisma CLI is NOT in the runner image.
- `scripts/seed.ts`, `scripts/enrich-oils.ts` — esbuilt to `.js` for the runner; locally run via `tsx`.
- `docs/DATABASE.md` — full schema reference (models, relationships, enum semantics, migration history).
- `docs/DEVELOPMENT.md` — local dev setup. `README.md` — deployment.

# Gotchas

- **OilPairing is bidirectional, stored once.** Sort IDs with `sortPairingIds()` before insert/upsert; look up with `pairingKey()`. Querying with unsorted IDs misses half the rows.
- **TS files import siblings with `.js` suffix** (TS ESM convention). Both `tsx` and `esbuild --bundle` resolve `.js` → `.ts` automatically.
- **Migrations run at container start** via `scripts/migrate.js` — don't expect `prisma migrate deploy` in production.
- **DB-backed pages need `export const dynamic = 'force-dynamic'`** — `next build` runs without a database.
- **`revalidatePath('/admin/oils/[id]')` does NOT expand `[id]`.** Pass the resolved path: `` revalidatePath(`/admin/oils/${id}`) ``.
- **Anthropic prompt caching:** `cache_control: { type: 'ephemeral' }` goes on the LAST cacheable text block; the dynamic suffix follows it uncached.
- **Blend volume model is additive** — `totalVolumeMl` (the user's "Volume" input) is the **carrier volume target**, not the final mix volume. EOs add on top: `finalVolumeMl = carrierVolumeMl + totalVolumeMl × dilutionRate`. The carrier is locked at the chosen volume; this matches aromatherapy practice.
- **Carrier ingredients use `volumeMl` directly** — `BlendIngredient.volumeMl` is the source of truth for carriers (not derived from `percentagePct`). EO ingredients still use `percentagePct` (drops are derived via `pctToDrops`). When loading saved blends into the builder, pass `volumeMl` through unchanged.
- **`@@unique([blendId, oilId])`** on `BlendIngredient` blocks the same oil appearing twice in one blend — that's intentional. Multiple *different* carriers (or EOs) are fine.
- **The blend draft persists across pages via localStorage** (`lib/blend-storage.ts`). `BlendBuilder` is the source of truth on `/blend` and writes the grade itself; `BlendCart` computes/writes the grade on every other page. If you add a new field to `BlendDraft`, bump the schema version and handle the migration — `loadDraft` returns `null` on version mismatch and silently drops old data.
- **localStorage helpers fire same-tab change events.** `oil-blender:draft-changed` (blend) and `oil-blender:compare-changed` (compare slots) are dispatched on every write. Listeners must subscribe to both `'storage'` (cross-tab) and the custom event (same-tab) — see `BlendCart`'s `useEffect` for the pattern.
- **No test suite.** Verification = `npx tsc --noEmit` plus running the dev server.

# Common commands

- `npx tsc --noEmit` — typecheck
- `npm run dev` / `build` / `seed` / `enrich`
- `docker compose -f docker-compose.yml -f docker-compose.build.yml up --build` — local build with override
- Add migration: edit `prisma/schema.prisma` → `npx prisma migrate dev --name <slug>` → commit the generated SQL file
