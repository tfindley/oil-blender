import { Card, CardBody, CardHeader } from '@/components/ui/Card'

interface SelectedOilsCardProps {
  carriers: Array<{ id: string; name: string }>
  essentials: Array<{ id: string; name: string }>
  onRemoveCarrier: (id: string) => void
  onRemoveEO: (id: string) => void
  onReset?: () => void
}

export function SelectedOilsCard({ carriers, essentials, onRemoveCarrier, onRemoveEO, onReset }: SelectedOilsCardProps) {
  const hasAnyOil = carriers.length > 0 || essentials.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">In Your Blend</h2>
          {hasAnyOil && onReset && (
            <button
              onClick={onReset}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-700 dark:border-stone-600 dark:text-stone-300 dark:hover:border-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-4 text-sm">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Carriers ({carriers.length})
          </p>
          {carriers.length === 0 ? (
            <p className="text-sm italic text-stone-400 dark:text-stone-500">None yet</p>
          ) : (
            <ul className="space-y-0.5">
              {carriers.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-stone-50 dark:hover:bg-stone-700/50">
                  <span className="truncate text-stone-700 dark:text-stone-200">{c.name}</span>
                  <button
                    onClick={() => onRemoveCarrier(c.id)}
                    aria-label={`Remove ${c.name}`}
                    className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Essentials ({essentials.length})
          </p>
          {essentials.length === 0 ? (
            <p className="text-sm italic text-stone-400 dark:text-stone-500">None yet</p>
          ) : (
            <ul className="space-y-0.5">
              {essentials.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-stone-50 dark:hover:bg-stone-700/50">
                  <span className="truncate text-stone-700 dark:text-stone-200">{e.name}</span>
                  <button
                    onClick={() => onRemoveEO(e.id)}
                    aria-label={`Remove ${e.name}`}
                    className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
