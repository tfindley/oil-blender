export interface IngredientInput {
  oilId: string
  name: string
  type: 'ESSENTIAL' | 'CARRIER'
  percentagePct: number
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
const DROPS_PER_ML = 20

export function calculateBlend(
  totalVolumeMl: number,
  dilutionRate: number,
  ingredients: IngredientInput[]
): BlendCalculation {
  const essentials = ingredients.filter((i) => i.type === 'ESSENTIAL')
  const carriers = ingredients.filter((i) => i.type === 'CARRIER')

  const carrierVolumeMl = totalVolumeMl
  const essentialOilTotalMl = totalVolumeMl * dilutionRate
  const finalVolumeMl = carrierVolumeMl + essentialOilTotalMl

  const sumPct = essentials.reduce((s, i) => s + i.percentagePct, 0)
  const sumCarrierPct = carriers.reduce((s, c) => s + c.percentagePct, 0)

  const calculated: CalculatedIngredient[] = []
  const warnings: string[] = []

  for (const c of carriers) {
    const fraction = sumCarrierPct > 0 ? c.percentagePct / sumCarrierPct : 1 / carriers.length
    calculated.push({ ...c, volumeMl: carrierVolumeMl * fraction, drops: 0 })
  }

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
