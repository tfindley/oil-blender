import Link from 'next/link'
import type { OilSummary } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface OilCardProps {
  oil: OilSummary
}

export function OilCard({ oil }: OilCardProps) {
  return (
    <Link
      href={`/oils/${oil.id}`}
      className="group flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-serif font-semibold text-stone-800 group-hover:text-amber-800">
          {oil.name}
        </h3>
        <Badge variant={oil.type === 'ESSENTIAL' ? 'GOOD' : 'default'} className="shrink-0">
          {oil.type === 'ESSENTIAL' ? 'Essential' : 'Carrier'}
        </Badge>
      </div>
      <p className="mb-3 text-xs text-stone-500 italic">{oil.aroma}</p>
      <ul className="space-y-0.5">
        {oil.benefits.slice(0, 3).map((b, i) => (
          <li key={i} className="text-xs text-stone-600">
            • {b}
          </li>
        ))}
      </ul>
      {oil.type === 'CARRIER' && oil.consistency && (
        <p className="mt-2 text-xs text-stone-400">
          {oil.consistency} · {oil.absorbency} absorbing
        </p>
      )}
      {oil.type === 'ESSENTIAL' && oil.dilutionRateMax != null && (
        <p className="mt-2 text-xs text-stone-400">
          Max dilution: {(oil.dilutionRateMax * 100).toFixed(0)}%
        </p>
      )}
    </Link>
  )
}
