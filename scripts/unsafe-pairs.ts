// Hand-curated UNSAFE pairs — combinations that are genuinely dangerous
// and must be hard-blocked regardless of what the enrichment script produces.
// Each entry is bidirectional; the script stores [sorted(a,b)].

export interface UnsafePair {
  oilA: string
  oilB: string
  reason: string
}

export const UNSAFE_PAIRS: UnsafePair[] = [
  {
    oilA: 'Clove Bud',
    oilB: 'Rosehip Seed',
    reason:
      'Clove Bud contains high eugenol content (80–90%) which can cause severe sensitisation when combined with the linoleic acid in Rosehip Seed on damaged or sensitive skin. Risk of chemical burns on broken skin.',
  },
  {
    oilA: 'Clove Bud',
    oilB: 'Evening Primrose',
    reason:
      'Eugenol in Clove Bud reacts adversely with the high GLA content in Evening Primrose, increasing skin sensitisation risk to unacceptable levels.',
  },
  {
    oilA: 'Clove Bud',
    oilB: 'Tamanu',
    reason:
      'Eugenol in Clove Bud combined with calophyllolide in Tamanu significantly raises the risk of severe skin sensitisation and allergic reaction.',
  },
  {
    oilA: 'Peppermint',
    oilB: 'Castor',
    reason:
      'The high menthol content in Peppermint is intensified by Castor\'s occlusive nature, creating a delivery system that can cause cold-burn sensations and skin irritation, particularly on sensitive areas.',
  },
  {
    oilA: 'Eucalyptus',
    oilB: 'Peppermint',
    reason:
      'Both oils are high in 1,8-cineole and menthol respectively. Combined at massage dilutions, they can cause respiratory distress and skin sensitisation, particularly around the face and neck. Not safe for use on children under 10.',
  },
]
