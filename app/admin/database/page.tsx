import { prisma } from '@/lib/prisma'
import { SeedButton, EnrichButton } from './DatabaseActions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Database' }

export default async function DatabasePage() {
  const [oilCount, blendCount, pairingCount] = await Promise.all([
    prisma.oil.count(),
    prisma.blend.count(),
    prisma.oilPairing.count(),
  ])

  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">Database</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Seed and enrich the oil database</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Oils', value: oilCount },
          { label: 'Pairings', value: pairingCount },
          { label: 'Blends', value: blendCount },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-4 text-center dark:border-stone-700 dark:bg-stone-800">
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Seed */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800">
          <h2 className="mb-1 font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">Seed Database</h2>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            Loads the built-in set of 55 oils and ~96 curated pairings. Safe to re-run — all operations are upserts.
            Use this to populate a fresh database or restore missing base data.
          </p>
          <SeedButton />
        </div>

        {/* Enrich */}
        <div className={`rounded-xl border p-6 ${hasApiKey ? 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800' : 'border-stone-100 bg-stone-50 dark:border-stone-800 dark:bg-stone-900'}`}>
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">Enrich Oils with AI</h2>
            {hasApiKey
              ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">API key set</span>
              : <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-500">No API key</span>
            }
          </div>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            Calls the Claude API to generate richer oil descriptions, botanical context, and a complete pairing matrix.
            Runs as a background process — this takes several minutes. Check server logs for progress.
            Approximate cost: $0.05–0.15 USD. Idempotent — safe to re-run.
          </p>
          {hasApiKey ? (
            <EnrichButton />
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-600">
              Set <code className="rounded bg-stone-100 px-1 font-mono dark:bg-stone-800">ANTHROPIC_API_KEY</code> to enable enrichment.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
