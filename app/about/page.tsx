import Link from 'next/link'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export const metadata = {
  title: 'About — Potions & Lotions',
  description: 'About Potions & Lotions — an open-source massage oil blend builder.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <div className="mb-3 text-4xl">🌿</div>
        <h1 className="font-serif text-4xl font-bold text-stone-900">About Potions &amp; Lotions</h1>
        <p className="mt-3 text-lg text-stone-600">
          A free, open-source tool for building custom massage oil blends with real-time compatibility scoring, safety guidance, and printable recipe cards.
        </p>
      </div>

      {/* Purpose */}
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-stone-800">What Is This?</h2>
        <div className="prose prose-stone max-w-none text-stone-700">
          <p>
            Potions &amp; Lotions was built to make aromatherapy blending accessible, safe, and informed. Whether
            you&apos;re a professional massage therapist formulating client blends, or someone creating a relaxing oil
            for personal use, the tool walks you through choosing a carrier oil, adding essential oils, and understanding
            how they interact — all before you mix a single drop.
          </p>
          <p className="mt-3">
            The compatibility scoring system rates each oil pair as <strong>Excellent</strong>, <strong>Good</strong>,{' '}
            <strong>Caution</strong>, <strong>Avoid</strong>, or <strong>Unsafe</strong>, giving you the context
            you need to blend with confidence. Genuinely dangerous combinations are hard-blocked. Everything else is
            informative, not restrictive.
          </p>
          <p className="mt-3">
            Every blend gets a permanent shareable URL and a downloadable PDF recipe card with exact quantities,
            oil profiles, and pairing notes — useful for both personal records and client handouts.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-stone-800">Features</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            'Blend builder with live compatibility scoring',
            'A–F compatibility grade for every blend',
            'EXCELLENT / GOOD / CAUTION / AVOID / UNSAFE pairing system',
            'Hard blocks for genuinely dangerous combinations',
            '30 essential oils + 15 carrier oils in the library',
            'Accurate quantity calculator (ml + drops)',
            'Dilution rate guidance (1–5%)',
            'Batch volume presets (10–200ml)',
            'Persistent shareable blend URLs',
            'PDF recipe card download',
            'Per-oil profiles: benefits, origins, contraindications',
            'Searchable, filterable oil catalog',
          ].map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-0.5 shrink-0 text-amber-600">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      {/* AI Transparency */}
      <Card className="mb-10 border-amber-200 bg-amber-50">
        <CardHeader>
          <h2 className="font-serif text-xl font-semibold text-amber-900">AI &amp; LLM Transparency</h2>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-amber-900">
          <p>
            <strong>The oil data in this application was generated using Claude (claude-sonnet-4-6), Anthropic&apos;s AI
            assistant.</strong> This includes botanical descriptions, historical context, benefit profiles,
            contraindications, and pairing compatibility ratings.
          </p>
          <p>
            While Claude&apos;s knowledge of aromatherapy is drawn from reputable sources, <strong>AI-generated content
            can contain errors</strong>. The compatibility ratings and safety information are for general guidance only
            and should not replace consultation with a qualified aromatherapist or healthcare professional.
          </p>
          <p>
            The <strong>UNSAFE pairing list</strong> is hand-curated by the developer and cross-referenced against
            established aromatherapy safety literature — it is not AI-generated.
          </p>
          <p>
            Additionally, <strong>the application itself was built with AI assistance</strong> (Claude Code / Anthropic
            Claude) for code generation, architecture, and development.
          </p>
          <p className="font-medium">
            Always patch test. Always consult a professional for therapeutic use. Not medical advice.
          </p>
        </CardBody>
      </Card>

      {/* Tech Stack */}
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-stone-800">Tech Stack</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { name: 'Next.js 16', role: 'Framework (App Router, TypeScript)', url: 'https://nextjs.org' },
            { name: 'PostgreSQL 16', role: 'Database', url: 'https://postgresql.org' },
            { name: 'Prisma 7', role: 'ORM and database migrations', url: 'https://prisma.io' },
            { name: 'Tailwind CSS 4', role: 'Styling', url: 'https://tailwindcss.com' },
            { name: '@react-pdf/renderer', role: 'Client-side PDF generation', url: 'https://react-pdf.org' },
            { name: 'Zod', role: 'API validation', url: 'https://zod.dev' },
            { name: 'Anthropic Claude', role: 'Data enrichment (AI)', url: 'https://anthropic.com' },
            { name: 'GitHub Actions', role: 'CI/CD + container registry', url: 'https://github.com/features/actions' },
          ].map((t) => (
            <div key={t.name} className="rounded-lg border border-stone-200 bg-white p-3">
              <p className="font-semibold text-stone-800">{t.name}</p>
              <p className="text-sm text-stone-500">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-stone-800">Links</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="https://github.com/tfindley/oils"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-800 transition-colors hover:border-amber-400 hover:bg-amber-50"
          >
            <span>⭐</span> View Source Code on GitHub
          </a>
          <a
            href="https://github.com/tfindley/oils/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-800 transition-colors hover:border-amber-400 hover:bg-amber-50"
          >
            <span>🐛</span> Report an Issue
          </a>
          <a
            href="https://ko-fi.com/potionsandlotions"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
          >
            <span>☕</span> Support on Ko-Fi
          </a>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
        <h3 className="mb-2 font-semibold text-stone-800">Disclaimer</h3>
        <p>
          The information provided on this site is for educational and general wellness purposes only. It is not
          intended as medical advice and should not replace professional healthcare consultation. Essential oils
          are potent substances — always conduct a patch test before applying to skin, and keep out of reach of
          children. If you are pregnant, nursing, or have a medical condition, consult a qualified professional
          before using any essential oil blend.
        </p>
        <p className="mt-2">
          Oil compatibility data is generated with AI assistance and curated by the developer. While care is
          taken to ensure accuracy, we make no guarantees. <strong>Use at your own risk.</strong>
        </p>
      </div>
    </div>
  )
}
