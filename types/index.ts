export type OilType = 'ESSENTIAL' | 'CARRIER'
export type PairingRating = 'EXCELLENT' | 'GOOD' | 'CAUTION' | 'AVOID' | 'UNSAFE'
export type BlendGrade = 'A' | 'B' | 'C' | 'F'

export interface OilSummary {
  id: string
  name: string
  type: OilType
  aroma: string
  benefits: string[]
  description: string
  consistency?: string | null
  absorbency?: string | null
  dilutionRateMax?: number | null
}

export interface OilDetail extends OilSummary {
  botanicalName: string
  origin: string
  history: string
  contraindications: string[]
  shelfLifeMonths?: number | null
  pairings: PairingSummary[]
}

export interface PairingSummary {
  oilId: string
  oilName: string
  rating: PairingRating
  reason: string
}

export interface BlendIngredientSummary {
  oilId: string
  oilName: string
  oilType: OilType
  percentagePct: number
  volumeMl: number
  drops: number
  benefits: string[]
  contraindications: string[]
  aroma: string
}

export interface BlendDetail {
  id: string
  name: string
  description?: string | null
  totalVolumeMl: number
  dilutionRate: number
  purpose?: string | null
  notes?: string | null
  grade: BlendGrade
  createdAt: string
  ingredients: BlendIngredientSummary[]
  pairings: Array<{
    oilAId: string
    oilAName: string
    oilBId: string
    oilBName: string
    rating: PairingRating
    reason: string
  }>
}

export interface CreateBlendInput {
  name: string
  description?: string
  totalVolumeMl: number
  dilutionRate: number
  purpose?: string
  notes?: string
  grade: BlendGrade
  ingredients: Array<{
    oilId: string
    percentagePct: number
    volumeMl: number
  }>
}
