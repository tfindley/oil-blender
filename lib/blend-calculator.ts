export interface IngredientInput {
  oilId: string
  name: string
  type: 'ESSENTIAL' | 'CARRIER'
  percentagePct: number
  volumeMl?: number
  dilutionRateMax?: number | null
}

export interface CalculatedIngredient extends IngredientInput {
  volumeMl: number
  drops: number
}

export interface BlendCalculation {
  totalVolumeMl: number
  finalVolumeMl: number
  dilutionRate: number
  essentialOilTotalMl: number
  carrierVolumeMl: number
  ingredients: CalculatedIngredient[]
  warnings: string[]
}

// 1 ml ≈ 20 drops for essential oils
export const DROPS_PER_ML = 20

export function pctToDrops(percentagePct: number, totalVolumeMl: number): number {
  return Math.round((percentagePct / 100) * totalVolumeMl * DROPS_PER_ML)
}

export function dropsToPct(drops: number, totalVolumeMl: number): number {
  return (drops / DROPS_PER_ML / totalVolumeMl) * 100
}

export function calculateBlend(
  totalVolumeMl: number,
  dilutionRate: number,
  ingredients: IngredientInput[]
): BlendCalculation {
  const essentials = ingredients.filter((i) => i.type === 'ESSENTIAL')
  const carriers = ingredients.filter((i) => i.type === 'CARRIER')

  const essentialOilTotalMl = totalVolumeMl * dilutionRate

  const sumPct = essentials.reduce((s, i) => s + i.percentagePct, 0)

  const calculated: CalculatedIngredient[] = []
  const warnings: string[] = []

  let carrierVolumeMl = 0
  for (const c of carriers) {
    const volumeMl = c.volumeMl ?? totalVolumeMl / carriers.length
    carrierVolumeMl += volumeMl
    calculated.push({ ...c, volumeMl, drops: 0 })
  }

  const finalVolumeMl = carrierVolumeMl + essentialOilTotalMl

  // Essential oil volumes proportional to their percentage allocation
  for (const e of essentials) {
    const fraction = sumPct > 0 ? e.percentagePct / sumPct : 0
    const volumeMl = essentialOilTotalMl * fraction
    const drops = Math.round(volumeMl * DROPS_PER_ML)
    calculated.push({ ...e, volumeMl, drops })

    if (e.dilutionRateMax != null && e.dilutionRateMax > 0) {
      const effectivePct = volumeMl / totalVolumeMl
      if (effectivePct > e.dilutionRateMax) {
        warnings.push(
          `${e.name} exceeds its recommended max dilution of ${(e.dilutionRateMax * 100).toFixed(1)}% (currently ${(effectivePct * 100).toFixed(1)}%).`
        )
      }
    }
  }

  if (essentials.length > 0 && Math.abs(sumPct - dilutionRate * 100) > 0.1) {
    warnings.push(
      `Essential oil percentages sum to ${sumPct.toFixed(1)}%, but your dilution rate is ${(dilutionRate * 100).toFixed(1)}%. Adjust percentages to match.`
    )
  }

  return {
    totalVolumeMl,
    finalVolumeMl,
    dilutionRate,
    essentialOilTotalMl,
    carrierVolumeMl,
    ingredients: calculated,
    warnings,
  }
}
