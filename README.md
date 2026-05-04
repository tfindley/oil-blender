# 🌿 Potions & Lotions

**A free, open-source massage oil blend builder with real-time compatibility scoring, safety guidance, and printable recipe cards.**

[![Release](https://img.shields.io/github/v/release/tfindley/oil-blender)](https://github.com/tfindley/oil-blender/releases)
[![Docker](https://img.shields.io/badge/ghcr.io-tfindley%2Foil-blender-blue)](https://github.com/tfindley/oil-blender/pkgs/container/oils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What It Does

Potions & Lotions lets you:

- **Build a blend** — pick a carrier oil and up to 5 essential oils
- **See compatibility live** — every oil pair is rated Excellent / Good / Caution / Avoid / Unsafe
- **Get exact quantities** — ml and drop counts at any volume (10–200ml) and dilution rate (1–5%)
- **Download a PDF recipe card** — with ingredients, oil profiles, pairing notes, and a QR code
- **Share your blend** — every saved blend gets a permanent URL
- **Browse curated blends** — featured community blends on the homepage and `/blends`

The blend builder is the centrepiece; the oil library (30 essential oils + 25 carriers) and featured blends gallery are supporting content.

---

## Features

| Feature | Detail |
|---|---|
| Blend builder | Carrier + up to 5 EOs with live compatibility panel |
| Compatibility scoring | A–F grade per blend; EXCELLENT / GOOD / CAUTION / AVOID / UNSAFE per pair |
| Safety hard-blocks | UNSAFE combinations cannot be saved (validated client + server) |
| Quantity calculator | ml + drops per ingredient at any volume/dilution |
| PDF export | Downloadable recipe card with blend data and QR code, generated client-side |
| Shareable URLs | Persistent `/blend/[id]` URL for every saved blend |
| View tracking | Each blend page visit increments a view counter |
| Featured blends | Admin-curated blends shown on homepage and `/blends` listing |
| Auto-purge | Non-featured blends inactive for 30+ days are automatically deleted |
| Oil library | 55 oils (30 essential + 25 carrier) with botanical names, origins, benefits, contraindications |
| Oil catalog | Searchable, filterable by type (carrier / essential) |
| Oil detail pages | Full profiles with all pairings listed |
| Admin panel | Manage oils and blends without touching the database directly |

---

## Tech Stack

| Technology | Role |
|---|---|
| **Next.js 16** (App Router, TypeScript) | Framework |
| **PostgreSQL 16** | Database |
| **Prisma 7** | ORM + migrations |
| **Tailwind CSS 4** | Styling |
| **@react-pdf/renderer** | Client-side PDF generation |
| **qrcode** | QR code generation for PDF recipe cards |
| **Zod** | API request validation |
| **Anthropic Claude** (`claude-sonnet-4-6`) | Data enrichment (AI) |
| **Google Analytics 4** | Anonymised usage analytics (optional) |
| **GitHub Actions** | CI/CD |
| **GitHub Container Registry** | Docker image hosting |

---

## AI & LLM Transparency

> **The oil data in this application was generated using [Claude](https://anthropic.com) (claude-sonnet-4-6) by Anthropic.**

The enrichment pipeline (`scripts/enrich-oils.ts`) calls the Claude API to generate:
- Botanical descriptions, historical context, and benefit profiles for each oil
- Compatibility ratings and reasons for each oil pair

The application code was also built with AI assistance (Claude Code / Anthropic Claude).

The **UNSAFE pairing list** (`scripts/unsafe-pairs.ts`) is hand-curated by the developer and cross-referenced against established aromatherapy safety literature — it is not AI-generated.

⚠️ AI-generated content can contain errors. This information is for general guidance only and does not replace professional aromatherapy or medical advice.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Docker for local dev)
- An Anthropic API key (only needed to run the enrichment script — the seed script works without one)

### 1. Clone & Install

```bash
git clone https://github.com/tfindley/oil-blender.git
cd oil-blender
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required
DATABASE_URL="postgresql://oils:oils@localhost:5432/oils"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
ADMIN_SECRET="your-strong-admin-password"
CRON_SECRET="your-strong-cron-secret"

# Optional
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"   # omit to disable analytics
ANTHROPIC_API_KEY="sk-ant-..."                  # only needed for npm run enrich
```

### 3. Start PostgreSQL

**With Docker:**
```bash
docker compose up -d
```

**With an existing PostgreSQL install:**
```bash
psql -U postgres -c "CREATE USER oils WITH PASSWORD 'oils' CREATEDB;"
psql -U postgres -c "CREATE DATABASE oils OWNER oils;"
```

### 4. Run Migrations

```bash
node scripts/migrate.js
```

### 5. Seed the Database

**Option A — Quick seed (no API key needed):**
```bash
npm run seed
```
This loads 55 oils and ~96 curated pairings from `scripts/seed.ts`.

**Option B — Full AI enrichment (requires Anthropic API key):**
```bash
npm run enrich
```
This calls Claude to generate richer descriptions and a complete pairing matrix for all oils.
The enrichment is idempotent — safe to re-run.

### 6. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Admin Panel

The admin panel is available at `/admin`. It is protected by a password stored in `ADMIN_SECRET`.

### Oil management

`/admin` lists all oils. From here you can:
- Create a new oil (`+ Add Oil`)
- Edit any existing oil (name, description, benefits, pairings, buy link, image URL, etc.)

### Blend management

`/admin/blends` lists all blends with view counts, grade, creation date, and feature flags. From here you can:
- Delete a single blend
- Select multiple blends and delete them in bulk
- Delete all non-featured blends in one action (useful for clearing test data)

### Promoting a blend to the showcase

1. Build a blend on the frontend and copy the URL (e.g. `https://your-domain.com/blend/clxxx…`)
2. Go to `/admin/blends/import`
3. Paste the URL or bare blend ID and click **Look up blend**
4. Review the preview, fill in the author name and description, and set the feature flags
5. Click **Promote blend** — the blend is now featured on the homepage and `/blends` page

Feature flags:
- **Featured** — appears on the `/blends` listing and homepage carousel
- **Pinned** — sorted to the top of both pages (shown first)
- **Hidden** — removed from all public pages (useful for drafts or takedowns)

---

## Auto-Purge

Non-featured, non-pinned blends that haven't been accessed for 30 days are automatically deleted to keep the database clean. The purge is triggered by an authenticated HTTP endpoint.

### Endpoint

```
GET /api/cron/purge
Authorization: Bearer <CRON_SECRET>
```

Returns `{ "deleted": 3, "message": "Purged 3 inactive blend(s)" }`.

Returns `401` if the secret is missing or wrong, `500` if `CRON_SECRET` is not configured.

### Setting up the host cron

Add this to the crontab on your host or container runner (runs at 03:00 daily):

```cron
0 3 * * *  curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/purge
```

Replace `http://localhost:3000` with your production URL if the cron runs from a different host.

---

## Analytics

Google Analytics 4 is optionally supported. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to your `G-XXXXXXXXXX` measurement ID to enable it. Leave the variable unset or empty to disable analytics entirely — no tracking code is injected.

When enabled, GA collects standard anonymised usage data (pages visited, session duration, browser/device type, approximate location). **Blend contents are never transmitted to Google.**

---

## Enrichment Script Details

`npm run enrich` runs a three-pass pipeline:

| Pass | What it does |
|---|---|
| **Pass 1** | Calls Claude API for each oil — generates full data including pairings |
| **Pass 2** | Resolves pairing oil names → database IDs; upserts pairing records |
| **Pass 3** | Applies UNSAFE overrides from `scripts/unsafe-pairs.ts` (hand-curated) |

- Rate-limited to 3 concurrent API calls (`p-limit`)
- Fully idempotent — safe to re-run after failures
- Approximate cost: ~$0.05–0.15 USD for a full enrichment run

---

## Docker / Production

### Build locally

```bash
docker build -t potions-and-lotions .
```

### Run with Docker Compose (app + database)

```yaml
services:
  app:
    image: ghcr.io/tfindley/oil-blender:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://oils:oils@db:5432/oils
      NEXT_PUBLIC_BASE_URL: https://your-domain.com
      ADMIN_SECRET: your-strong-admin-password
      CRON_SECRET: your-strong-cron-secret
      NEXT_PUBLIC_GA_MEASUREMENT_ID: G-XXXXXXXXXX   # optional
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: oils
      POSTGRES_PASSWORD: oils
      POSTGRES_DB: oils
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U oils"]
      interval: 5s
      retries: 5

volumes:
  pg_data:
```

After starting, run migrations and seed:

```bash
docker compose exec app node scripts/migrate.js
docker compose exec app npx tsx scripts/seed.ts
```

### Pre-built Images

Images are published to the GitHub Container Registry on every tagged release:

```bash
docker pull ghcr.io/tfindley/oil-blender:latest
docker pull ghcr.io/tfindley/oil-blender:v0.0.7
```

---

## CI/CD & Releases

Releases are managed via GitHub Actions (`.github/workflows/release.yml`).

**To create a new release:**

```bash
git tag v1.0.0
git push origin v1.0.0
```

This automatically:
1. Builds the Docker image
2. Pushes `ghcr.io/tfindley/oil-blender:1.0.0` and `ghcr.io/tfindley/oil-blender:latest` to GHCR
3. Creates a GitHub Release with Docker run instructions

---

## Project Structure

```
oil-blender/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage (hero + featured blends + feature grid)
│   ├── blend/              # Blend builder + saved blend detail
│   ├── blends/             # Public featured blends listing
│   ├── oils/               # Oil catalog + individual oil pages
│   ├── about/              # About page (privacy, analytics, tech stack)
│   ├── admin/              # Admin panel (oils + blends management)
│   │   ├── page.tsx        # Oil list
│   │   ├── oils/           # Oil create/edit
│   │   └── blends/         # Blend list, edit, import/promote
│   └── api/                # REST API + cron routes
│       ├── blends/         # Create / fetch blends
│       ├── oils/           # Oil data
│       ├── pairings/       # Pairing queries
│       └── cron/purge/     # Auto-purge endpoint
├── components/
│   ├── analytics/          # GoogleAnalytics component
│   ├── ui/                 # Button, Badge, Card, Input, Alert, CopyButton
│   ├── layout/             # Header, Footer
│   ├── blend/              # BlendBuilder, CompatibilityPanel, QuantityTable…
│   ├── blends/             # BlendCard (public-facing)
│   ├── oils/               # OilCard
│   └── pdf/                # BlendReport (@react-pdf/renderer)
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── blend-calculator.ts # Volume/drop calculations
│   └── blend-scorer.ts     # A–F blend grading
├── scripts/
│   ├── migrate.js          # Lightweight migration runner (uses pg, no Prisma CLI)
│   ├── oil-definitions.ts  # Oil name list
│   ├── unsafe-pairs.ts     # Hand-curated UNSAFE combinations
│   ├── seed.ts             # Seed with built-in oil data (no API key needed)
│   └── enrich-oils.ts      # Claude AI enrichment pipeline
├── types/index.ts          # Shared TypeScript types
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # SQL migration files
├── .env.example            # Environment variable template
├── Dockerfile              # Multi-stage production build
└── .github/workflows/
    └── release.yml         # Tag-triggered build + push + release
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/oils` | List oils — `?type=ESSENTIAL\|CARRIER&q=search` |
| `GET` | `/api/oils/[id]` | Single oil with all pairings |
| `GET` | `/api/pairings` | `?oilIds=id1,id2,id3` — pairings between selected oils |
| `POST` | `/api/blends` | Create blend (validates no UNSAFE pairs server-side) |
| `GET` | `/api/blends/[id]` | Blend detail with ingredients and pairings |
| `GET` | `/api/cron/purge` | Delete inactive blends (requires `Authorization: Bearer <CRON_SECRET>`) |

---

## Compatibility Rating System

| Rating | Description | Behaviour |
|---|---|---|
| **EXCELLENT** | Actively beneficial together | Highlighted in UI |
| **GOOD** | Compatible, no concerns | No note shown |
| **CAUTION** | Mild concern | Amber warning shown — user can proceed |
| **AVOID** | Not recommended | Red warning — user must acknowledge before saving |
| **UNSAFE** | Dangerous combination | Hard block — cannot be saved |

Blend grade is derived from the worst pairing:
- **A** — all GOOD or EXCELLENT
- **B** — at least one CAUTION, no AVOID/UNSAFE
- **C** — at least one AVOID (user must acknowledge)
- **F** — any UNSAFE pair (blocked entirely)

---

## Contributing

Issues and PRs welcome at [github.com/tfindley/oil-blender](https://github.com/tfindley/oil-blender/issues).

If you find an error in the oil data, incorrect safety information, or a missing UNSAFE pair, please open an issue — safety corrections are the highest priority.

---

## Support

If you find this useful, you can support the project on Ko-Fi:

☕ [ko-fi.com/tfindley](https://ko-fi.com/tfindley)

---

## Disclaimer

The information on this site is for educational and general wellness purposes only. It is not medical advice. Essential oils are potent — always patch test, keep out of reach of children, and consult a qualified professional if pregnant, nursing, or managing a health condition.

---

## License

MIT — see [LICENSE](LICENSE).
