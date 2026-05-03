import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import pLimit from 'p-limit'
import { OIL_DEFINITIONS, ALL_OIL_NAMES } from './oil-definitions.js'
import { UNSAFE_PAIRS } from './unsafe-pairs.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://oils:oils@localhost:5432/oils' })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const limit = pLimit(3)

interface OilEnrichment {
  botanicalName: string
  origin: string
  history: string
  description: string
  benefits: string[]
  contraindications: string[]
  aroma: string
  consistency?: string
  absorbency?: string
  shelfLifeMonths?: number
  dilutionRateMax?: number
  pairings: Array<{
    name: string
    rating: 'EXCELLENT' | 'GOOD' | 'CAUTION' | 'AVOID'
    reason: string
  }>
}

async function enrichOil(name: string, type: 'ESSENTIAL' | 'CARRIER'): Promise<OilEnrichment> {
  const isCarrier = type === 'CARRIER'
  const otherOilNames = ALL_OIL_NAMES.filter((n) => n !== name)

  const prompt = `You are an expert aromatherapist and massage therapist. Provide accurate, professional information about ${name} ${isCarrier ? 'carrier oil' : 'essential oil'} for use in massage blending.

Respond with a single JSON object (no markdown, no explanation) matching this exact shape:

{
  "botanicalName": "string — Latin botanical name",
  "origin": "string — primary country/region of origin",
  "history": "string — 2–3 sentences on historical use and cultural context",
  "description": "string — 2–3 sentences on the oil's character, texture, and typical massage applications",
  "benefits": ["array of 4–6 concise benefit strings"],
  "contraindications": ["array of 2–4 contraindication strings, or empty array if none significant"],
  "aroma": "string — brief aroma description (e.g. 'warm, spicy, woody')",
  ${isCarrier ? `"consistency": "light|medium|heavy",
  "absorbency": "fast|medium|slow",
  "shelfLifeMonths": number,` : `"dilutionRateMax": number between 0.01 and 0.05 (e.g. 0.02 for 2%),`}
  "pairings": [
    // Rate EACH of the following oils when combined with ${name} in a massage blend.
    // Rate ALL of: ${otherOilNames.slice(0, 20).join(', ')}
    // Then also rate: ${otherOilNames.slice(20).join(', ')}
    // Use exactly these ratings:
    // EXCELLENT = actively beneficial together, enhances effects
    // GOOD = compatible, no issues
    // CAUTION = mild concern (e.g. competing scents, mild sensitisation risk) — user should be informed
    // AVOID = not recommended (therapeutic conflict, sensitisation, or aroma clash) — user must acknowledge
    // Do NOT use UNSAFE here — that is reserved for hand-curated safety overrides
    {
      "name": "exact oil name from the list above",
      "rating": "EXCELLENT|GOOD|CAUTION|AVOID",
      "reason": "1 sentence explanation shown to user"
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON found in response for ${name}`)

  return JSON.parse(jsonMatch[0]) as OilEnrichment
}

async function upsertOil(name: string, type: 'ESSENTIAL' | 'CARRIER', enrichment: OilEnrichment) {
  await prisma.oil.upsert({
    where: { name },
    create: {
      name,
      type,
      botanicalName: enrichment.botanicalName,
      origin: enrichment.origin,
      history: enrichment.history,
      description: enrichment.description,
      benefits: enrichment.benefits,
      contraindications: enrichment.contraindications,
      aroma: enrichment.aroma,
      consistency: enrichment.consistency,
      absorbency: enrichment.absorbency,
      shelfLifeMonths: enrichment.shelfLifeMonths,
      dilutionRateMax: enrichment.dilutionRateMax,
    },
    update: {
      botanicalName: enrichment.botanicalName,
      origin: enrichment.origin,
      history: enrichment.history,
      description: enrichment.description,
      benefits: enrichment.benefits,
      contraindications: enrichment.contraindications,
      aroma: enrichment.aroma,
      consistency: enrichment.consistency,
      absorbency: enrichment.absorbency,
      shelfLifeMonths: enrichment.shelfLifeMonths,
      dilutionRateMax: enrichment.dilutionRateMax,
    },
  })
  console.log(`  ✓ Upserted oil: ${name}`)
}

async function upsertPairing(
  oilAId: string,
  oilBId: string,
  rating: 'EXCELLENT' | 'GOOD' | 'CAUTION' | 'AVOID' | 'UNSAFE',
  reason: string
) {
  const [idA, idB] = [oilAId, oilBId].sort()
  await prisma.oilPairing.upsert({
    where: { oilAId_oilBId: { oilAId: idA, oilBId: idB } },
    create: { oilAId: idA, oilBId: idB, rating, reason },
    update: { rating, reason },
  })
}

async function main() {
  console.log('Pass 1: Enriching oil records...')

  const enrichments = new Map<string, OilEnrichment>()

  await Promise.all(
    OIL_DEFINITIONS.map(({ name, type }) =>
      limit(async () => {
        console.log(`Enriching: ${name}`)
        try {
          const enrichment = await enrichOil(name, type)
          enrichments.set(name, enrichment)
          await upsertOil(name, type, enrichment)
        } catch (err) {
          console.error(`  ✗ Failed for ${name}:`, err)
        }
      })
    )
  )

  console.log('\nPass 2: Upserting pairings...')

  const allOils = await prisma.oil.findMany({ select: { id: true, name: true } })
  const oilByName = new Map(allOils.map((o) => [o.name, o.id]))

  for (const [oilName, enrichment] of enrichments.entries()) {
    const oilAId = oilByName.get(oilName)
    if (!oilAId) continue

    for (const pairing of enrichment.pairings) {
      const oilBId = oilByName.get(pairing.name)
      if (!oilBId) {
        console.warn(`  Skipping unknown oil in pairings: "${pairing.name}"`)
        continue
      }
      if (oilAId === oilBId) continue

      try {
        await upsertPairing(oilAId, oilBId, pairing.rating, pairing.reason)
      } catch (err) {
        console.error(`  ✗ Pairing ${oilName} ↔ ${pairing.name}:`, err)
      }
    }
  }

  console.log('\nPass 3: Applying UNSAFE overrides...')

  for (const { oilA, oilB, reason } of UNSAFE_PAIRS) {
    const idA = oilByName.get(oilA)
    const idB = oilByName.get(oilB)
    if (!idA || !idB) {
      console.warn(`  Skipping UNSAFE pair — oil not found: ${oilA} or ${oilB}`)
      continue
    }
    await upsertPairing(idA, idB, 'UNSAFE', reason)
    console.log(`  ✓ UNSAFE: ${oilA} ↔ ${oilB}`)
  }

  console.log('\nEnrichment complete.')
  const oilCount = await prisma.oil.count()
  const pairingCount = await prisma.oilPairing.count()
  console.log(`  Oils: ${oilCount}`)
  console.log(`  Pairings: ${pairingCount}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
