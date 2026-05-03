# Changelog

All notable changes to Potions & Lotions are documented here.

## [Unreleased]

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
- `docker-compose.yml` now includes the `app` service pulling `ghcr.io/tfindley/oils:latest`, with a postgres healthcheck dependency
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
- GitHub Actions CI/CD: builds and pushes Docker image to `ghcr.io/tfindley/oils` on `v*.*.*` tag push, creates GitHub Release
- Oil enrichment pipeline (`npm run enrich`) using Claude API for richer AI-generated profiles

[Unreleased]: https://github.com/tfindley/oils/compare/v0.0.5...HEAD
[0.0.5]: https://github.com/tfindley/oils/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/tfindley/oils/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/tfindley/oils/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/tfindley/oils/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/tfindley/oils/releases/tag/v0.0.1
