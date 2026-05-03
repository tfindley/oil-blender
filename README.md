# 🌿 Potions & Lotions

**A free, open-source massage oil blend builder with real-time compatibility scoring, safety guidance, and printable recipe cards.**

[![Release](https://img.shields.io/github/v/release/tfindley/oils)](https://github.com/tfindley/oils/releases)
[![Docker](https://img.shields.io/badge/ghcr.io-tfindley%2Foils-blue)](https://github.com/tfindley/oils/pkgs/container/oils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What It Does

Potions & Lotions lets you:

- **Build a blend** — pick a carrier oil and up to 5 essential oils
- **See compatibility live** — every oil pair is rated Excellent / Good / Caution / Avoid / Unsafe
- **Get exact quantities** — ml and drop counts at any volume (10–200ml) and dilution rate (1–5%)
- **Download a PDF recipe card** — with ingredients, oil profiles, and pairing notes
- **Share your blend** — every saved blend gets a permanent URL

The blend builder is the centrepiece; the oil library (30 essential oils + 15 carriers) is supporting content.

---

## Features

| Feature | Detail |
|---|---|
| Blend builder | Carrier + up to 5 EOs with live compatibility panel |
| Compatibility scoring | A–F grade per blend; EXCELLENT / GOOD / CAUTION / AVOID / UNSAFE per pair |
| Safety hard-blocks | UNSAFE combinations cannot be saved (validated client + server) |
| Quantity calculator | ml + drops per ingredient at any volume/dilution |
| PDF export | Downloadable recipe card with all blend data, generated client-side |
| Shareable URLs | Persistent `/blend/[id]` URL for every saved blend |
| QR code in PDF | Blend URL embedded in PDF for easy sharing |
| Oil library | 45 oils with botanical names, origins, history, benefits, contraindications |
| Oil catalog | Searchable, filterable by type (carrier / essential) |
| Oil detail pages | Full profiles with all pairings listed |

---

## Tech Stack

| Technology | Role |
|---|---|
| **Next.js 16** (App Router, TypeScript) | Framework |
| **PostgreSQL 16** | Database |
| **Prisma 7** | ORM + migrations |
| **Tailwind CSS 4** | Styling |
| **@react-pdf/renderer** | Client-side PDF generation |
| **Zod** | API request validation |
| **Anthropic Claude** (`claude-sonnet-4-6`) | Data enrichment (AI) |
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
git clone https://github.com/tfindley/oils.git
cd oils
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://oils:oils@localhost:5432/oils"
ANTHROPIC_API_KEY="sk-ant-..."        # only needed for npm run enrich
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Start PostgreSQL

**With Docker:**
```bash
docker compose up -d
```

**With an existing PostgreSQL install:**
```bash
# Create user and database
psql -U postgres -c "CREATE USER oils WITH PASSWORD 'oils' CREATEDB;"
psql -U postgres -c "CREATE DATABASE oils OWNER oils;"
```

### 4. Run Migrations

```bash
npx prisma migrate deploy
```

### 5. Seed the Database

**Option A — Quick seed (no API key needed):**
```bash
npm run seed
```
This loads 45 oils and ~50 curated pairings from `scripts/seed.ts`.

**Option B — Full AI enrichment (requires Anthropic API key):**
```bash
npm run enrich
```
This calls Claude to generate richer descriptions and a complete pairing matrix for all 45 oils.
The enrichment is idempotent — safe to re-run.

### 6. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the blend builder is the home page.

---

## Enrichment Script Details

`npm run enrich` runs a three-pass pipeline:

| Pass | What it does |
|---|---|
| **Pass 1** | Calls Claude API for each of 45 oils — generates full data including pairings |
| **Pass 2** | Resolves pairing oil names → database IDs; upserts pairing records |
| **Pass 3** | Applies UNSAFE overrides from `scripts/unsafe-pairs.ts` (hand-curated) |

- Rate-limited to 3 concurrent API calls (`p-limit`)
- Fully idempotent — safe to re-run after failures
- Approximate cost: ~$0.05–0.15 USD for a full 45-oil enrichment

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
    image: ghcr.io/tfindley/oils:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://oils:oils@db:5432/oils
      NEXT_PUBLIC_BASE_URL: https://your-domain.com
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
docker compose exec app npx prisma migrate deploy
docker compose exec app npx tsx scripts/seed.ts
```

### Pre-built Images

Images are published to the GitHub Container Registry on every tagged release:

```bash
docker pull ghcr.io/tfindley/oils:latest
docker pull ghcr.io/tfindley/oils:0.0.1
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
2. Pushes `ghcr.io/tfindley/oils:1.0.0` and `ghcr.io/tfindley/oils:latest` to GHCR
3. Creates a GitHub Release with Docker run instructions

---

## Project Structure

```
oils/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── blend/              # Blend builder + saved blend detail
│   ├── oils/               # Oil catalog + individual oil pages
│   ├── about/              # About page
│   └── api/                # REST API routes
├── components/
│   ├── ui/                 # Button, Badge, Card, Input, Alert, CopyButton
│   ├── layout/             # Header, Footer
│   ├── blend/              # BlendBuilder, CompatibilityPanel, QuantityTable…
│   ├── oils/               # OilCard
│   └── pdf/                # BlendReport (@react-pdf/renderer)
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── blend-calculator.ts # Volume/drop calculations
│   └── blend-scorer.ts     # A–F blend grading
├── scripts/
│   ├── oil-definitions.ts  # Oil name list
│   ├── unsafe-pairs.ts     # Hand-curated UNSAFE combinations
│   ├── seed.ts             # Seed with built-in oil data (no API key needed)
│   └── enrich-oils.ts      # Claude AI enrichment pipeline
├── types/index.ts          # Shared TypeScript types
├── prisma/schema.prisma    # Database schema
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

Issues and PRs welcome at [github.com/tfindley/oils](https://github.com/tfindley/oils/issues).

If you find an error in the oil data, incorrect safety information, or a missing UNSAFE pair, please open an issue — safety corrections are the highest priority.

---

## Support

If you find this useful, you can support the project on Ko-Fi:

☕ [ko-fi.com/potionsandlotions](https://ko-fi.com/potionsandlotions)

---

## Disclaimer

The information on this site is for educational and general wellness purposes only. It is not medical advice. Essential oils are potent — always patch test, keep out of reach of children, and consult a qualified professional if pregnant, nursing, or managing a health condition.

---

## License

MIT — see [LICENSE](LICENSE).
