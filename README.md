# Oil Blender

**A free, open-source massage oil blend builder with real-time compatibility scoring, safety guidance, and printable recipe cards.**

[![Release](https://img.shields.io/github/v/release/tfindley/oil-blender)](https://github.com/tfindley/oil-blender/releases)
[![Build](https://github.com/tfindley/oil-blender/actions/workflows/release.yml/badge.svg)](https://github.com/tfindley/oil-blender/actions/workflows/release.yml)
[![Docker](https://img.shields.io/badge/ghcr.io-tfindley%2Foil-blender-blue)](https://github.com/tfindley/oil-blender/pkgs/container/oil-blender)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What It Does

Oil Blender lets you:

- **Build a blend** — pick up to 5 carrier oils (jojoba + sweet almond, etc.) and up to 5 essential oils
- **See compatibility live** — every oil pair is rated Excellent / Good / Caution / Avoid / Unsafe
- **Get exact quantities** — carriers in ml, essential oils in drops; additive carrier model (100 ml carrier + 3% EOs = 103 ml final)
- **Download a PDF recipe card** — with ingredients, oil profiles, pairing notes, and a QR code
- **Share your blend** — every saved blend gets a permanent URL
- **Browse curated blends** — featured community blends on the homepage and `/blends`

---

## Features

| Feature | Detail |
|---|---|
| Blend builder | Up to 5 carriers + up to 5 EOs with live compatibility panel; accordion sections, search/browse picker |
| Multi-carrier blending | Mix multiple carriers (e.g. 50 ml jojoba + 50 ml sweet almond); ml-based input with drift warning + "Fit to Volume" rebalance |
| Additive carrier model | Volume = carrier volume target; essential oils add on top (matches aromatherapy practice) |
| Compatibility scoring | A–F grade per blend; EXCELLENT / GOOD / CAUTION / AVOID / UNSAFE per pair; carrier↔carrier, carrier↔EO, and EO↔EO pairings all score equally |
| Safety hard-blocks | UNSAFE combinations cannot be saved (validated client + server) |
| Per-oil dilution check | Warns when any EO exceeds its recommended max dilution at the chosen volume |
| Quantity calculator | ml per carrier, drops per essential oil; "Final mix" hint shows actual total |
| PDF export | Downloadable recipe card with blend data and QR code, generated client-side |
| Shareable URLs | Persistent `/blend/[id]` URL for every saved blend |
| View tracking | Each blend page visit increments a view counter |
| Featured blends | Admin-curated blends shown on homepage and `/blends` listing |
| Auto-purge | Non-featured blends inactive for 30+ days are automatically deleted |
| Oil library | 55 oils (30 essential + 25 carrier) with botanical names, origins, benefits, contraindications |
| Oil catalogue | Searchable, filterable by type (carrier / essential) |
| Oil detail pages | Full profiles with all pairings listed |
| Admin panel | Manage oils and blends without touching the database directly |

---

## Quick Start (Docker)

### 1. Get the compose file

Download `docker-compose.yml` from this repository, or clone the repo:

```bash
git clone https://github.com/tfindley/oil-blender.git
cd oil-blender
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
ADMIN_SECRET=your-strong-admin-password
CRON_SECRET=your-strong-cron-secret
```

### 3. Start

```bash
docker compose up -d
```

### 4. Seed the database

Database migrations run automatically on container startup. To load the built-in oil data:

```bash
docker compose exec app node scripts/seed.js
```

Open [http://localhost:3000](http://localhost:3000).

### Pre-built images

Images are published to the GitHub Container Registry on every tagged release:

```bash
docker pull ghcr.io/tfindley/oil-blender:latest
```

Specific version tags are also available — see [Releases](https://github.com/tfindley/oil-blender/releases).

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NEXT_PUBLIC_BASE_URL` | Yes | — | Public URL of your deployment (used in QR codes and blend share links) |
| `ADMIN_SECRET` | Yes | — | Password for the admin panel at `/admin` |
| `CRON_SECRET` | Yes | — | Bearer token for the auto-purge endpoint |
| `NEXT_PUBLIC_SITE_NAME` | No | `Oil Blender` | Display name shown in the header, footer, page titles, and PDF |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | — | Google Analytics 4 measurement ID (`G-XXXXXXXXXX`); omit to disable |
| `ANTHROPIC_API_KEY` | No | — | Enables AI enrichment via the Admin → Database panel and `node scripts/enrich.js` |

---

## Admin Panel

The admin panel is at `/admin`, protected by `ADMIN_SECRET`.

### Oil management

`/admin` lists all oils. From here you can create new oils or edit existing ones (name, description, benefits, pairings, image URL, buy link, etc.).

### Database tools

`/admin/database` shows current oil, pairing, and blend counts with three sections:

- **Migrations** — shows whether the database schema is up to date; lists any pending migrations with SQL preview; one-click **Apply Pending Migrations** button with manual shell instruction fallback
- **Seed Database** — loads the built-in 55 oils and ~96 pairings; safe to re-run (all operations are upserts)
- **Enrich Oils with AI** — calls the Claude API to generate richer descriptions and a full pairing matrix; only shown when `ANTHROPIC_API_KEY` is set; runs as a background process; by default only processes oils that have never been enriched — use **Force re-enrich all** to override

### Blend management

`/admin/blends` lists all blends with view counts, grade, creation date, and feature flags. From here you can:
- Delete a single blend
- Select multiple blends and delete them in bulk
- Delete all non-featured blends in one action

### Promoting a blend to the showcase

1. Build a blend on the frontend and copy the URL (e.g. `https://your-domain.com/blend/clxxx…`)
2. Go to `/admin/blends/import`
3. Paste the URL or bare blend ID and click **Look up blend**
4. Fill in the author name and description, set the feature flags
5. Click **Promote blend** — the blend now appears on the homepage and `/blends` page

Feature flags:
- **Featured** — appears on the `/blends` listing and homepage carousel
- **Pinned** — sorted to the top of both pages
- **Hidden** — removed from all public pages (useful for drafts or takedowns)

---

## Auto-Purge

Non-featured blends that haven't been visited for 30 days are automatically deleted. Trigger via an authenticated HTTP endpoint.

### Endpoint

```
GET /api/cron/purge
Authorization: Bearer <CRON_SECRET>
```

Returns `{ "deleted": 3, "message": "Purged 3 inactive blend(s)" }`.

### Host cron setup

Add this to the crontab on your host (runs at 03:00 daily):

```cron
0 3 * * *  curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/purge
```

---

## Enriching Oil Data

The container includes a bundled enrichment script that calls the Anthropic Claude API to generate richer oil descriptions and a complete pairing matrix.

Set `ANTHROPIC_API_KEY` in your `.env` file, then trigger enrichment from the **Admin → Database** panel, or run it directly:

```bash
docker compose exec app node scripts/enrich.js
```

**By default the script only processes oils that have not yet been enriched** — this means re-running after a fresh seed is always safe and nearly free. To force re-enrichment of all oils (e.g. after a model upgrade):

```bash
docker compose exec -e FORCE_REENRICH=1 app node scripts/enrich.js
```

Approximate cost: ~$0.05–0.15 USD for a full run of all 55 oils.

---

## Analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to your `G-XXXXXXXXXX` measurement ID to enable Google Analytics 4. Leave it unset or empty to disable — no tracking code is injected.

When enabled, GA collects standard anonymised usage data (pages visited, session duration, browser/device type, approximate location). Blend contents are never transmitted to Google.

---

## Branding Your Deployment

Set `NEXT_PUBLIC_SITE_NAME` to customise the display name shown in the header, footer, page titles, and PDF recipe cards. The About page will show a "Powered by Oil Blender" attribution linking back to this repository.

---

## AI & LLM Transparency

> **The oil data in this application was generated using [Claude](https://anthropic.com) (claude-sonnet-4-6) by Anthropic.**

The enrichment pipeline calls the Claude API to generate botanical descriptions, historical context, benefit profiles, and compatibility ratings.

The application code was also built with AI assistance (Claude Code / Anthropic Claude).

The **UNSAFE pairing list** is hand-curated by the developer and cross-referenced against established aromatherapy safety literature — it is not AI-generated.

⚠️ AI-generated content can contain errors. This information is for general guidance only and does not replace professional aromatherapy or medical advice.

---

## Development

For local development from source, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

---

## Contributing

Issues and PRs welcome at [github.com/tfindley/oil-blender](https://github.com/tfindley/oil-blender/issues).

Safety corrections (incorrect ratings, missing UNSAFE pairs, wrong contraindications) are the highest priority.

---

## Support

☕ [ko-fi.com/tfindley](https://ko-fi.com/tfindley)

---

## Disclaimer

The information on this site is for educational and general wellness purposes only. It is not medical advice. Essential oils are potent — always patch test, keep out of reach of children, and consult a qualified professional if pregnant, nursing, or managing a health condition.

---

## License

MIT — see [LICENSE](LICENSE).
