import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import pLimit from 'p-limit'
import { OIL_DEFINITIONS, ALL_OIL_NAMES } from './oil-definitions.js'
import { UNSAFE_PAIRS } from './unsafe-pairs.js'
import { sortPairingIds } from '../lib/pairing-utils.js'
import { enrichOilProfile, ENRICHMENT_MODEL, type OilEnrichment } from '../lib/oil-enrichment.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://oils:oils@localhost:5432/oils' })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const limit = pLimit(8)

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
      enrichedAt: new Date(),
      enrichmentModel: ENRICHMENT_MODEL,
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
      enrichedAt: new Date(),
      enrichmentModel: ENRICHMENT_MODEL,
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
  const [idA, idB] = sortPairingIds(oilAId, oilBId)
  await prisma.oilPairing.upsert({
    where: { oilAId_oilBId: { oilAId: idA, oilBId: idB } },
    create: { oilAId: idA, oilBId: idB, rating, reason },
    update: { rating, reason },
  })
}

async function main() {
  const force = process.env.FORCE_REENRICH === '1'
  const enriched = await prisma.oil.findMany({
    where: { enrichedAt: { not: null } },
    select: { name: true },
  })
  const enrichedNames = new Set(enriched.map((o) => o.name))
  const todo = force ? OIL_DEFINITIONS : OIL_DEFINITIONS.filter((o) => !enrichedNames.has(o.name))

  console.log(
    force
      ? `FORCE_REENRICH=1 → enriching all ${todo.length} oils`
      : `${todo.length} of ${OIL_DEFINITIONS.length} oils need enrichment`,
  )

  if (todo.length === 0) {
    console.log('Nothing to enrich. Use FORCE_REENRICH=1 to override.')
    await prisma.$disconnect()
    await pool.end()
    return
  }

  console.log('\nPass 1: Enriching oil records...')

  const enrichments = new Map<string, OilEnrichment>()

  await Promise.all(
    todo.map(({ name, type }) =>
      limit(async () => {
        console.log(`Enriching: ${name}`)
        try {
          const enrichment = await enrichOilProfile(anthropic, name, type, ALL_OIL_NAMES)
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
