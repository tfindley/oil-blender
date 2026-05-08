import type { CalculatedIngredient } from '@/lib/blend-calculator'

interface QuantityTableProps {
  ingredients: CalculatedIngredient[]
  totalVolumeMl: number
}

export function QuantityTable({ ingredients, totalVolumeMl }: QuantityTableProps) {
  if (ingredients.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 dark:bg-stone-800">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-stone-600 dark:text-stone-300">Oil</th>
            <th className="px-4 py-2 text-right font-medium text-stone-600 dark:text-stone-300">%</th>
            <th className="px-4 py-2 text-right font-medium text-stone-600 dark:text-stone-300">ml</th>
            <th className="px-4 py-2 text-right font-medium text-stone-600 dark:text-stone-300">drops</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
          {ingredients.map((i) => {
            const over = i.overMaxDilution
            const rowClass = over
              ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30'
              : 'hover:bg-stone-50/50 dark:hover:bg-stone-700/30'
            const nameClass = over ? 'text-red-800 dark:text-red-300' : 'text-stone-800 dark:text-stone-100'
            const pctClass = over ? 'text-red-700 dark:text-red-400' : 'text-stone-600 dark:text-stone-300'
            const numClass = over ? 'text-red-800 dark:text-red-300' : 'text-stone-800 dark:text-stone-100'
            return (
              <tr key={i.oilId} className={rowClass}>
                <td className={`px-4 py-2.5 ${nameClass}`}>
                  {i.name}
                  <span className="ml-1.5 text-xs text-stone-400 dark:text-stone-500">{i.type === 'CARRIER' ? 'carrier' : 'EO'}</span>
                </td>
                <td className={`px-4 py-2.5 text-right ${pctClass}`}>
                  {i.type === 'CARRIER'
                    ? '—'
                    : (() => { const pct = Math.round((i.volumeMl / totalVolumeMl) * 100); return pct === 0 ? '<1%' : `${pct}%` })()}
                </td>
                <td className={`px-4 py-2.5 text-right font-mono ${numClass}`}>{i.volumeMl.toFixed(1)}</td>
                <td className={`px-4 py-2.5 text-right font-mono ${numClass}`}>
                  {i.type === 'ESSENTIAL' ? i.drops : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot className="border-t border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800">
          <tr>
            <td className="px-4 py-2 font-medium text-stone-700 dark:text-stone-200">Total</td>
            <td className="px-4 py-2 text-right text-stone-400 dark:text-stone-500">—</td>
            <td className="px-4 py-2 text-right font-mono font-medium text-stone-700 dark:text-stone-200">{ingredients.reduce((s, i) => s + i.volumeMl, 0).toFixed(0)}</td>
            <td className="px-4 py-2 text-right text-stone-400 dark:text-stone-500">—</td>
          </tr>
          <tr>
            <td colSpan={4} className="px-4 py-1.5 text-[11px] text-stone-400 dark:text-stone-500">
              1 ml ≈ 20 drops of essential oil
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
