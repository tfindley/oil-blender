import { prisma } from '@/lib/prisma'
import { relativeTime } from '@/lib/format-time'
import { SeedButton, EnrichButton, MigrationApplyButton } from './DatabaseActions'
import { getMigrationStatus } from './migrations'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Database' }

export default async function DatabasePage() {
  const [oilCount, blendCount, pairingCount, unenrichedCount, migrationStatus] = await Promise.all([
    prisma.oil.count(),
    prisma.blend.count(),
    prisma.oilPairing.count(),
    prisma.oil.count({ where: { enrichedAt: null } }),
    getMigrationStatus(),
  ])

  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY)
  const { pending: pendingMigrations, latest } = migrationStatus

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
        {/* Migrations */}
        <div className={`rounded-xl border p-6 ${pendingMigrations.length > 0 ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800'}`}>
          <h2 className="mb-1 font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">Migrations</h2>
          {pendingMigrations.length === 0 ? (
            <>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">✓ All migrations applied — schema up to date</p>
              {latest?.appliedAt && (
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Latest: <code className="rounded bg-stone-100 px-1 font-mono dark:bg-stone-700">{latest.name}</code> applied {relativeTime(latest.appliedAt)}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-amber-700 dark:text-amber-400">
                ⚠ {pendingMigrations.length} migration{pendingMigrations.length === 1 ? '' : 's'} pending
              </p>
              <ul className="mb-4 space-y-2">
                {pendingMigrations.map((m) => (
                  <li key={m.name}>
                    <code className="rounded bg-stone-100 px-1 font-mono text-sm dark:bg-stone-700">{m.name}</code>
                    {m.sql && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">view SQL</summary>
                        <pre className="mt-1 overflow-x-auto rounded bg-stone-100 p-3 text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-300">{m.sql}</pre>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
              <MigrationApplyButton />
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">Manual application instructions</summary>
                <div className="mt-3 space-y-4 text-sm text-stone-600 dark:text-stone-400">
                  <div>
                    <p className="mb-1 font-medium text-stone-800 dark:text-stone-200">Option 1 — Restart the container (cleanest)</p>
                    <pre className="overflow-x-auto rounded bg-stone-100 p-3 text-xs dark:bg-stone-900">docker compose restart app</pre>
                    <p className="mt-1 text-xs text-stone-500">Migrations auto-apply on startup via docker-entrypoint.sh.</p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-stone-800 dark:text-stone-200">Option 2 — Run migrate.js inside the running container</p>
                    <pre className="overflow-x-auto rounded bg-stone-100 p-3 text-xs dark:bg-stone-900">docker compose exec app node scripts/migrate.js</pre>
                  </div>
                  {pendingMigrations.length === 1 && (
                    <div>
                      <p className="mb-1 font-medium text-stone-800 dark:text-stone-200">Option 3 — Apply raw SQL (advanced; leaves _prisma_migrations out of sync)</p>
                      <pre className="overflow-x-auto rounded bg-stone-100 p-3 text-xs dark:bg-stone-900">{`docker compose exec -T postgres psql -U oils -d oils \\\n  < prisma/migrations/${pendingMigrations[0].name}/migration.sql`}</pre>
                    </div>
                  )}
                </div>
              </details>
            </>
          )}
        </div>

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
          <p className="mb-1 text-sm text-stone-600 dark:text-stone-400">
            Calls the Claude API to generate richer oil descriptions, botanical context, and a complete pairing matrix.
            Runs as a background process — this takes several minutes. Check server logs for progress.
          </p>
          <p className="mb-4 text-sm text-stone-500 dark:text-stone-500">
            Only oils that haven&apos;t been enriched yet are processed. Use <strong>Force re-enrich all</strong> to override.
            {unenrichedCount > 0
              ? <> <span className="text-amber-600 dark:text-amber-400">{unenrichedCount} oil{unenrichedCount === 1 ? '' : 's'} need enrichment.</span></>
              : <> <span className="text-emerald-600 dark:text-emerald-400">All oils enriched ✓</span></>
            }
          </p>
          {hasApiKey ? (
            <EnrichButton unenrichedCount={unenrichedCount} />
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
