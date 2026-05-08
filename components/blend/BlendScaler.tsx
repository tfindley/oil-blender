'use client'

import { useState } from 'react'
import { calculateBlend, type IngredientInput } from '@/lib/blend-calculator'
import { QuantityTable } from './QuantityTable'

const VOLUME_PRESETS = [10, 30, 50, 100, 200]

interface ScalerIngredient {
  oilId: string
  name: string
  type: 'ESSENTIAL' | 'CARRIER'
  percentagePct: number
  volumeMl?: number
}

interface BlendScalerProps {
  originalVolumeMl: number
  dilutionRate: number
  ingredients: ScalerIngredient[]
}

export function BlendScaler({ originalVolumeMl, dilutionRate, ingredients }: BlendScalerProps) {
  const [viewVolumeMl, setViewVolumeMl] = useState(originalVolumeMl)

  const scale = originalVolumeMl > 0 ? viewVolumeMl / originalVolumeMl : 1
  const inputs: IngredientInput[] = ingredients.map((i) => ({
    ...i,
    volumeMl: i.volumeMl != null ? i.volumeMl * scale : undefined,
    dilutionRateMax: null,
  }))
  const calc = calculateBlend(viewVolumeMl, dilutionRate, inputs)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Volume</span>
        {VOLUME_PRESETS.map((v) => (
          <button
            key={v}
            onClick={() => setViewVolumeMl(v)}
            className={`rounded border px-3 py-2 text-sm transition-all ${
              viewVolumeMl === v
                ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                : 'border-stone-200 text-stone-500 hover:border-amber-300 dark:border-stone-600 dark:text-stone-400 dark:hover:border-amber-500'
            }`}
          >
            {v} ml
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={500}
          value={viewVolumeMl}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v) && v > 0) setViewVolumeMl(v)
          }}
          className="w-20 rounded border border-stone-200 bg-white px-2 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
        />
      </div>
      <QuantityTable ingredients={calc.ingredients} totalVolumeMl={viewVolumeMl} />
    </div>
  )
}
