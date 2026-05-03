import type { CalculatedIngredient } from '@/lib/blend-calculator'

interface QuantityTableProps {
  ingredients: CalculatedIngredient[]
  totalVolumeMl: number
}

export function QuantityTable({ ingredients, totalVolumeMl }: QuantityTableProps) {
  if (ingredients.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200">
      <table className="w-full text-sm">
        <thead className="bg-stone-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-stone-600">Oil</th>
            <th className="px-4 py-2 text-right font-medium text-stone-600">%</th>
            <th className="px-4 py-2 text-right font-medium text-stone-600">ml</th>
            <th className="px-4 py-2 text-right font-medium text-stone-600">drops</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {ingredients.map((i) => (
            <tr key={i.oilId} className="hover:bg-stone-50/50">
              <td className="px-4 py-2.5 text-stone-800">
                {i.name}
                <span className="ml-1.5 text-xs text-stone-400">{i.type === 'CARRIER' ? 'carrier' : 'EO'}</span>
              </td>
              <td className="px-4 py-2.5 text-right text-stone-600">
                {((i.volumeMl / totalVolumeMl) * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-stone-800">{i.volumeMl.toFixed(2)}</td>
              <td className="px-4 py-2.5 text-right font-mono text-stone-800">
                {i.type === 'ESSENTIAL' ? i.drops : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-stone-200 bg-stone-50">
          <tr>
            <td className="px-4 py-2 font-medium text-stone-700">Total</td>
            <td className="px-4 py-2 text-right font-medium text-stone-700">100%</td>
            <td className="px-4 py-2 text-right font-mono font-medium text-stone-700">{totalVolumeMl.toFixed(0)}</td>
            <td className="px-4 py-2 text-right text-stone-400">—</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
