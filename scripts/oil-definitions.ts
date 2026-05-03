export type OilType = 'ESSENTIAL' | 'CARRIER'

export interface OilDefinition {
  name: string
  type: OilType
}

export const OIL_DEFINITIONS: OilDefinition[] = [
  // Essential oils
  { name: 'Lavender', type: 'ESSENTIAL' },
  { name: 'Peppermint', type: 'ESSENTIAL' },
  { name: 'Eucalyptus', type: 'ESSENTIAL' },
  { name: 'Tea Tree', type: 'ESSENTIAL' },
  { name: 'Rosemary', type: 'ESSENTIAL' },
  { name: 'Frankincense', type: 'ESSENTIAL' },
  { name: 'Roman Chamomile', type: 'ESSENTIAL' },
  { name: 'Ylang Ylang', type: 'ESSENTIAL' },
  { name: 'Bergamot', type: 'ESSENTIAL' },
  { name: 'Geranium', type: 'ESSENTIAL' },
  { name: 'Clary Sage', type: 'ESSENTIAL' },
  { name: 'Lemongrass', type: 'ESSENTIAL' },
  { name: 'Clove Bud', type: 'ESSENTIAL' },
  { name: 'Ginger', type: 'ESSENTIAL' },
  { name: 'Black Pepper', type: 'ESSENTIAL' },
  { name: 'Vetiver', type: 'ESSENTIAL' },
  { name: 'Sandalwood', type: 'ESSENTIAL' },
  { name: 'Cedarwood', type: 'ESSENTIAL' },
  { name: 'Jasmine Absolute', type: 'ESSENTIAL' },
  { name: 'Rose Otto', type: 'ESSENTIAL' },
  { name: 'Sweet Marjoram', type: 'ESSENTIAL' },
  { name: 'Helichrysum', type: 'ESSENTIAL' },
  { name: 'Neroli', type: 'ESSENTIAL' },
  { name: 'Cypress', type: 'ESSENTIAL' },
  { name: 'Juniper Berry', type: 'ESSENTIAL' },
  { name: 'Patchouli', type: 'ESSENTIAL' },
  { name: 'Cardamom', type: 'ESSENTIAL' },
  { name: 'Copaiba', type: 'ESSENTIAL' },
  { name: 'Ho Wood', type: 'ESSENTIAL' },
  { name: 'Spearmint', type: 'ESSENTIAL' },

  // Carrier oils
  { name: 'Sweet Almond', type: 'CARRIER' },
  { name: 'Jojoba', type: 'CARRIER' },
  { name: 'Fractionated Coconut', type: 'CARRIER' },
  { name: 'Grapeseed', type: 'CARRIER' },
  { name: 'Argan', type: 'CARRIER' },
  { name: 'Rosehip Seed', type: 'CARRIER' },
  { name: 'Apricot Kernel', type: 'CARRIER' },
  { name: 'Avocado', type: 'CARRIER' },
  { name: 'Sunflower Seed', type: 'CARRIER' },
  { name: 'Hemp Seed', type: 'CARRIER' },
  { name: 'Castor', type: 'CARRIER' },
  { name: 'Marula', type: 'CARRIER' },
  { name: 'Tamanu', type: 'CARRIER' },
  { name: 'Pomegranate Seed', type: 'CARRIER' },
  { name: 'Evening Primrose', type: 'CARRIER' },
]

export const ALL_OIL_NAMES = OIL_DEFINITIONS.map((o) => o.name)
export const ESSENTIAL_OIL_NAMES = OIL_DEFINITIONS.filter((o) => o.type === 'ESSENTIAL').map((o) => o.name)
export const CARRIER_OIL_NAMES = OIL_DEFINITIONS.filter((o) => o.type === 'CARRIER').map((o) => o.name)
