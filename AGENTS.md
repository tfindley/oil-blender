<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Where things live

- `app/admin/` — admin panel; auth via `middleware.ts` + `ADMIN_SECRET` cookie. `layout.tsx` provides the shared nav (self-suppresses on `/admin/login` via `usePathname`).
- `components/blend/` — blend builder UI:
  - `BlendBuilder.tsx` — top-level builder; owns all blend state, picker open-section, and save flow
  - `OilPicker.tsx` — shared accordion picker used for both carriers (Section 1) and essential oils (Section 2). Identical highlight-toggle behaviour; props are `oils`, `selectedOils`, `noun`, `maxCount`, etc.
  - `SelectedIngredientRow.tsx` — shared right-column row for an in-blend ingredient (`unit: 'ml' | 'drops'`)
  - `QuantityTable.tsx` — read-only summary table; carriers show `—` in `%` (ml is source of truth there)
  - `BlendScaler.tsx` — saved-blend volume rescaler on the detail page
- `lib/blend-calculator.ts` — pure math + types for `calculateBlend`. Exports `DROPS_PER_ML`, `pctToDrops`, `dropsToPct`. Carrier ingredients pass `volumeMl` directly; the calculator no longer renormalises by `sumCarrierPct`.
- `lib/pairing-utils.ts` — pairing helpers (`sortPairingIds`, `pairingKey`, `buildPairingMap`).
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
- **No test suite.** Verification = `npx tsc --noEmit` plus running the dev server.

# Common commands

- `npx tsc --noEmit` — typecheck
- `npm run dev` / `build` / `seed` / `enrich`
- `docker compose -f docker-compose.yml -f docker-compose.build.yml up --build` — local build with override
- Add migration: edit `prisma/schema.prisma` → `npx prisma migrate dev --name <slug>` → commit the generated SQL file
