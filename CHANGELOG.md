# Changelog

All notable changes to Potions & Lotions are documented here.

## [Unreleased]

## [0.1.0] — 2026-05-06

### Added
- **Oil Compare tool** (`/oils/compare`) — side-by-side comparison of any two oils: full profiles on each side, compatibility verdict in the centre column with a coloured rating dot and reason text; swap button (⇄); searchable combobox selectors
- **"Compare" nav link** added to the main header (desktop and mobile)
- **Compatibility matrix row/column highlighting** — click any column header to highlight that column; click any row label to highlight the row; intersection cell gets a stronger tint to pinpoint the exact pairing
- **Compatibility matrix axis search** — independent search inputs filter which oils appear on the row axis and column axis; Reset button clears all filters and highlights
- **Blend notes** — optional freeform notes textarea on the blend save form; displayed as a sidebar card on the blend detail page and printed in the PDF recipe card
- **Author and about on blend detail and PDF** — `authorName` shown as "by …" under the blend title; `about` shown as the blend description (takes precedence over `description`); both printed in the PDF header
- **Mobile hamburger navigation** — responsive hamburger menu for screens narrower than `md` (768 px); outside-click or link navigation closes the menu; ThemeToggle included in the mobile bar
- **PWA support** — web app manifest (`/manifest.json`), generated favicons at 32 × 32 and 180 × 180 px, `standalone` display mode, `appleWebApp` metadata; "Add to Home Screen" installation guide added to the About page
- **Dark mode FOUC prevention** — synchronous inline `<script>` in `<head>` reads `localStorage` and applies the `dark` class before first paint; `suppressHydrationWarning` on `<html>` suppresses the inevitable React mismatch
- **Per-oil enrichment tracking** — `enrichedAt` (timestamp) and `enrichmentModel` (string) fields added to the `Oil` schema; stamped on every successful enrichment (bulk and per-oil); a migration backfills existing rows so re-running enrichment on a live instance is a no-op
- **Bulk enrichment skips already-enriched oils by default** — only unenriched oils are processed; set `FORCE_REENRICH=1` in the environment to override and re-enrich all; see [Enriching Oil Data](README.md#enriching-oil-data)
- **Migration management UI** — new Migrations card at the top of `/admin/database` shows which migrations are applied/pending, renders a SQL preview for each pending migration, provides a one-click **Apply Pending Migrations** button, and includes collapsible manual shell instructions (restart container / exec migrate.js / raw SQL)
- **"Unenriched" badge** on admin oil list — amber chip shown on any row where `enrichedAt` is null
- **Enrichment status caption** on per-oil edit page — "Enriched N days ago, model" or "Not enriched yet" shown next to the Enrich button

### Changed
- **Enrich button is now tri-state** — `Enrich N oil(s)` (active), `All oils enriched` (disabled), or `Starting…` (pending); a **Force re-enrich all** secondary action appears when all oils are already enriched
- **iOS input auto-zoom fix** — inputs on Oil Compare and Compatibility Matrix use `text-base` (16 px) on mobile to prevent Safari's auto-zoom on focus
- Compatibility matrix Quick Compare panel removed and replaced by the dedicated `/oils/compare` page

## [0.0.13] — 2026-05-05

### Fixed
- Container seed/enrich scripts failed with `Cannot find module 'postgres-array'` — copy the full `pg` transitive dependency tree into the runner image (`pg-protocol`, `pg-types`, `pg-connection-string`, `pg-int8`, `pg-cloudflare`, `pgpass`, `postgres-array`, `postgres-bytea`, `postgres-date`, `postgres-interval`)
- `ANTHROPIC_API_KEY` not forwarded to the app container in `docker-compose.yml`; the Enrich button in the admin panel now works when the key is set in the host environment or `.env`
- `docker-compose.yml`: removed host port binding on the postgres service (database is internal-only); added explicit `backend` bridge network so the two containers communicate without exposing the database port to the host

## [0.0.12] — 2026-05-04

### Added
- **Admin Database panel** at `/admin/database` — seed the database or run AI enrichment directly from the browser without SSH or CLI access
- Seed action runs synchronously and reports oils/pairings upserted; enrichment spawns as a background process (takes several minutes — check server logs)
- Enrich button is only shown when `ANTHROPIC_API_KEY` is set on the server; shows a disabled state with instructions otherwise
- Live stats card showing current oil, pairing, and blend counts
- Database nav link added to Oils and Blends admin pages

### Changed
- README: added CI/CD pipeline status badge; specific version pinned in Docker pull example replaced with a link to Releases page

## [0.0.11] — 2026-05-04

### Added
- `scripts/enrich.js` bundled into Docker image (compiled from `scripts/enrich-oils.ts` via esbuild) so the enrichment pipeline can run inside the container: `docker compose exec -e ANTHROPIC_API_KEY=... app node scripts/enrich.js`
- `docs/DEVELOPMENT.md` — dedicated local development guide covering setup, schema changes, enrichment pipeline, project structure, and release process

### Changed
- Default `NEXT_PUBLIC_SITE_NAME` changed from `Potions & Lotions` to `Oil Blender`
- README rewritten as a deployment/operations guide (Docker quickstart, env vars, admin, auto-purge, enrichment); development content moved to `docs/DEVELOPMENT.md`
- All references to "Potions & Lotions" updated to "Oil Blender" throughout README, About page, and env defaults

## [0.0.10] — 2026-05-04

### Added
- Seed script compiled to `scripts/seed.js` during Docker build so the database can be seeded from inside the container without cloning the repo or installing tsx: `docker compose exec app node scripts/seed.js`

### Fixed
- README Getting Started: added missing `npx prisma generate` step after `npm install` (omitting it causes `Cannot find module '.prisma/client/default'` when running seed or enrich)
- README Docker section: corrected container seed command from `npx tsx scripts/seed.ts` (tsx not available in runner) to `node scripts/seed.js`

## [0.0.9] — 2026-05-04

### Added
- **`NEXT_PUBLIC_SITE_NAME`** env var — sets the deployment display name shown in the header, footer, page titles, and PDF; defaults to `"Potions & Lotions"`; About page shows a "Powered by Potions & Lotions" attribution when a custom name is set

### Fixed
- `ADMIN_SECRET` and `CRON_SECRET` were not forwarded to the app container in `docker-compose.yml`, causing the admin panel to be accessible without a password
- `NEXT_PUBLIC_SITE_NAME` added to `docker-compose.yml` environment block
- Renamed `package.json` package name from `oils` to `oil-blender` (eliminates grype false positive GHSA-v279-v2xm-whq9)
- Dockerfile runner stage now runs `apk upgrade` to pick up patched BusyBox (CVE-2025-60876)
- Renamed `middleware.ts` → `proxy.ts` and exported function `middleware` → `proxy` (Next.js 16 deprecation)
- Added `data-scroll-behavior="smooth"` to `<html>` element (Next.js 16 scroll behaviour change)

## [0.0.8] — 2026-05-04

### Changed
- Repository renamed from `oils` to `oil-blender` (`github.com/tfindley/oil-blender`)
- All internal references, Docker image paths, documentation, and About page links updated to match

## [0.0.7] — 2026-05-04

### Added
- **Google Analytics 4** — optional analytics via `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var; omit to disable entirely; no tracking code injected when unset
- **View tracking** — every blend page visit increments `viewCount` and updates `lastAccessedAt` (fire-and-forget, does not slow page load)
- **Auto-purge endpoint** — `GET /api/cron/purge` (authenticated with `CRON_SECRET`) deletes non-featured blends inactive for 30+ days; host-side cron setup documented in README
- **Admin blend management** — `/admin/blends` lists all blends with view count, grade, last accessed date, and feature flags; supports single, multi-select, and all-non-featured bulk delete
- **Admin blend edit** — `/admin/blends/[id]` allows editing author name, about text, and isFeatured / isPinned / isHidden flags; shows read-only ingredient list and stats
- **Admin blend promote flow** — `/admin/blends/import` accepts a blend URL or bare ID, shows a preview, and saves author metadata and feature flags to promote a user-built blend to the curated showcase
- **Featured blends on homepage** — pinned and featured blends shown in a `BlendCard` grid between the hero and the feature grid; section hidden when no featured blends exist
- **Public `/blends` listing page** — shows all non-hidden featured and popular (≥ 5 views) blends, sorted pinned → featured → viewCount
- **`BlendCard` component** — public-facing card with grade badge, author byline, about excerpt, top 3 essential oils, view count, and pin indicator
- **"Blends" nav link** added to the header (between Build a Blend and Oil Library)
- **Privacy & analytics disclosures** on the About page — explains what blend data is stored, the 30-day auto-purge policy, and how Google Analytics is used with opt-out instructions
- **10 additional carrier oils** — Walnut, St John's Wort, Wheat Germ, Comfrey, Neem, Macadamia, Calendula, Borage Seed, Arnica, Olive; 37 new pairings seeded (library now 55 oils, 96+ pairings)
- **`.env.example`** — documents all required and optional environment variables
- **PDF QR code** — blend share URL embedded as a QR code image in the downloadable recipe card

### Changed
- Blend schema extended with 7 new fields: `viewCount`, `lastAccessedAt`, `authorName`, `about`, `isFeatured`, `isPinned`, `isHidden`
- `BlendDetail` TypeScript type updated with the 7 new fields
- Homepage is now a dynamic server component fetching featured blends from the database
- Feature grid on homepage updated: oil count corrected to 55, PDF description updated to mention QR code

## [0.0.5] — 2026-05-04

### Added
- Dark mode with system-preference detection and manual toggle (persisted in localStorage)
- Admin panel at `/admin` — list, create, edit, and delete oils without touching the database directly
- Oil images: `imageUrl` + `imageAlt` fields on the Oil model; displayed as hero on detail pages and thumbnail on cards
- Buy/sponsor links: optional `buyUrl` per oil renders a "Buy this oil" button on the detail page
- Botanical names shown on oil cards and searchable alongside common names
- Search reset ("Clear") button on the Oil Library page
- Replaced developer-facing "run npm run enrich" empty-state message with a user-friendly alternative

### Changed
- Oil Library search now matches against both common name and botanical name
- `OilSummary` type now includes `botanicalName`, `imageUrl`, `imageAlt`, and `buyUrl`

### Fixed
- Empty search state now offers a "clear filter" link instead of referencing a CLI command

## [0.0.4] — 2026-05-04

### Fixed
- Container startup failure: replaced Prisma CLI migration runner (which required a large transitive dep tree not present in the lean runner image) with a lightweight `scripts/migrate.js` that uses only the `pg` package already bundled in the image

## [0.0.3] — 2026-05-04

### Added
- `docker-compose.yml` now includes the `app` service pulling `ghcr.io/tfindley/oil-blender:latest`, with a postgres healthcheck dependency
- `docker-compose.build.yml` override file for building the image locally
- `docker-compose.external-db.yml` for running against an existing database (reads from `.env.local`)
- `docker-entrypoint.sh` runs database migrations automatically on container startup before starting the server
- Prisma CLI + config copied into runner image to support the startup migration step

## [0.0.2] — 2026-05-04

### Fixed
- Docker image build failure: `/blend`, `/blend/[id]`, `/oils`, and `/oils/[id]` pages were being statically pre-rendered at build time, causing a database connection error (`ECONNREFUSED`) since no database is available in the build environment. Added `export const dynamic = 'force-dynamic'` to each page.

## [0.0.1] — 2026-05-01

### Added
- Initial application: blend builder, oil library, saved blend pages
- 45 oils seeded (15 carriers, 30 essential oils) with full profiles, benefits, and contraindications
- 62 curated oil pairings with EXCELLENT / GOOD / CAUTION / AVOID / UNSAFE ratings
- 5 hard-blocked UNSAFE combinations
- A–F blend compatibility scoring
- Blend quantity calculator (ml + drops per oil)
- Shareable blend URLs (`/blend/[id]`)
- PDF recipe card download (client-side, via `@react-pdf/renderer`)
- About page with AI/LLM transparency, tech stack, GitHub, Ko-Fi links
- Multi-stage Dockerfile with standalone Next.js output
- GitHub Actions CI/CD: builds and pushes Docker image to `ghcr.io/tfindley/oil-blender` on `v*.*.*` tag push, creates GitHub Release
- Oil enrichment pipeline (`npm run enrich`) using Claude API for richer AI-generated profiles

[Unreleased]: https://github.com/tfindley/oil-blender/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tfindley/oil-blender/compare/v0.0.13...v0.1.0
[0.0.13]: https://github.com/tfindley/oil-blender/compare/v0.0.12...v0.0.13
[0.0.12]: https://github.com/tfindley/oil-blender/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/tfindley/oil-blender/compare/v0.0.10...v0.0.11
[0.0.10]: https://github.com/tfindley/oil-blender/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/tfindley/oil-blender/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/tfindley/oil-blender/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/tfindley/oil-blender/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/tfindley/oil-blender/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/tfindley/oil-blender/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/tfindley/oil-blender/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/tfindley/oil-blender/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/tfindley/oil-blender/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/tfindley/oil-blender/releases/tag/v0.0.1
