import Link from 'next/link'
import Image from 'next/image'
import type { OilSummary } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface OilCardProps {
  oil: OilSummary
}

export function OilCard({ oil }: OilCardProps) {
  return (
    <Link
      href={`/oils/${oil.id}`}
      className="group flex flex-col rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-800 dark:hover:border-amber-600"
    >
      {oil.imageUrl && (
        <div className="relative h-36 w-full overflow-hidden rounded-t-xl">
          <Image
            src={oil.imageUrl}
            alt={oil.imageAlt ?? oil.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif font-semibold text-stone-800 group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-400">
              {oil.name}
            </h3>
            <p className="text-xs italic text-stone-400 dark:text-stone-500">{oil.botanicalName}</p>
          </div>
          <Badge variant={oil.type === 'ESSENTIAL' ? 'GOOD' : 'default'} className="shrink-0">
            {oil.type === 'ESSENTIAL' ? 'Essential' : 'Carrier'}
          </Badge>
        </div>
        <p className="mb-3 text-xs text-stone-500 italic dark:text-stone-400">{oil.aroma}</p>
        <ul className="space-y-0.5">
          {oil.benefits.slice(0, 3).map((b, i) => (
            <li key={i} className="text-xs text-stone-600 dark:text-stone-400">
              • {b}
            </li>
          ))}
        </ul>
        {oil.type === 'CARRIER' && oil.consistency && (
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            {oil.consistency} · {oil.absorbency} absorbing
          </p>
        )}
        {oil.type === 'ESSENTIAL' && oil.dilutionRateMax != null && (
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            Max dilution: {(oil.dilutionRateMax * 100).toFixed(0)}%
          </p>
        )}
      </div>
    </Link>
  )
}
