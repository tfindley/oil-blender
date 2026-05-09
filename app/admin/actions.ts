'use server'

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sortPairingIds } from '@/lib/pairing-utils'
import { enrichOilProfile, ENRICHMENT_MODEL } from '@/lib/oil-enrichment'
import type { PairingRating } from '@/types'

export async function updatePairing(id: string, oilId: string, rating: PairingRating, reason: string) {
  await prisma.oilPairing.update({ where: { id }, data: { rating, reason } })
  revalidatePath(`/admin/oils/${oilId}`)
  return { ok: true }
}

export async function deletePairing(id: string, oilId: string) {
  await prisma.oilPairing.delete({ where: { id } })
  revalidatePath(`/admin/oils/${oilId}`)
  return { ok: true }
}

export async function addPairing(oilAId: string, oilBId: string, rating: PairingRating, reason: string) {
  const [idA, idB] = sortPairingIds(oilAId, oilBId)
  await prisma.oilPairing.upsert({
    where: { oilAId_oilBId: { oilAId: idA, oilBId: idB } },
    create: { oilAId: idA, oilBId: idB, rating, reason },
    update: { rating, reason },
  })
  revalidatePath(`/admin/oils/${oilAId}`)
  return { ok: true }
}

export async function enrichSingleOil(oilId: string): Promise<{ ok: boolean; message: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, message: 'ANTHROPIC_API_KEY is not set' }
  }

  const allOils = await prisma.oil.findMany({ select: { id: true, name: true, type: true } })
  const oil = allOils.find((o) => o.id === oilId)
  if (!oil) return { ok: false, message: 'Oil not found' }

  const allOilNames = allOils.map((o) => o.name)

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const enrichment = await enrichOilProfile(
      anthropic,
      oil.name,
      oil.type as 'ESSENTIAL' | 'CARRIER',
      allOilNames,
    )

    await prisma.oil.update({
      where: { id: oilId },
      data: {
        botanicalName: enrichment.botanicalName,
        origin: enrichment.origin,
        history: enrichment.history,
        description: enrichment.description,
        benefits: enrichment.benefits,
        contraindications: enrichment.contraindications,
        aroma: enrichment.aroma,
        consistency: enrichment.consistency ?? null,
        absorbency: enrichment.absorbency ?? null,
        shelfLifeMonths: enrichment.shelfLifeMonths ?? null,
        dilutionRateMax: enrichment.dilutionRateMax ?? null,
        enrichedAt: new Date(),
        enrichmentModel: ENRICHMENT_MODEL,
      },
    })

    const oilByName = new Map(allOils.map((o) => [o.name, o.id]))
    const upserts = (enrichment.pairings ?? [])
      .map((p) => ({ otherId: oilByName.get(p.name), rating: p.rating, reason: p.reason }))
      .filter((p): p is { otherId: string; rating: typeof p.rating; reason: string } => !!p.otherId && p.otherId !== oilId)
      .map(async ({ otherId, rating, reason }) => {
        const [idA, idB] = sortPairingIds(oilId, otherId)
        try {
          await prisma.oilPairing.upsert({
            where: { oilAId_oilBId: { oilAId: idA, oilBId: idB } },
            create: { oilAId: idA, oilBId: idB, rating, reason },
            update: { rating, reason },
          })
          return true
        } catch (err) {
          console.error(`Pairing upsert failed (${idA} ↔ ${idB}):`, err)
          return false
        }
      })

    const results = await Promise.all(upserts)
    const pairingsUpserted = results.filter(Boolean).length

    revalidatePath(`/admin/oils/${oilId}`)
    revalidatePath('/admin')
    return { ok: true, message: `Enriched — ${pairingsUpserted} pairings updated` }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, message: msg.slice(0, 300) }
  }
}

// `z.string().url()` accepts `javascript:`, `data:`, `vbscript:` schemes — fine
// at protocol level but dangerous when this URL is later rendered as `<a href>`
// or `<img src>`. Restrict to http(s) only.
const httpsOnly = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'Must start with http:// or https://')

const OilSchema = z.object({
  name: z.string().min(1),
  botanicalName: z.string().min(1),
  type: z.enum(['ESSENTIAL', 'CARRIER']),
  origin: z.string().min(1),
  history: z.string().min(1),
  description: z.string().min(1),
  aroma: z.string().min(1),
  benefits: z.string().min(1),
  contraindications: z.string(),
  consistency: z.string().optional(),
  absorbency: z.string().optional(),
  shelfLifeMonths: z.string().optional(),
  dilutionRateMax: z.string().optional(),
  buyUrl: httpsOnly.optional().or(z.literal('')),
  imageUrl: httpsOnly.optional().or(z.literal('')),
  imageAlt: z.string().optional(),
})

function parseOilForm(data: FormData) {
  const raw = Object.fromEntries(data.entries())
  const parsed = OilSchema.parse(raw)
  return {
    name: parsed.name,
    botanicalName: parsed.botanicalName,
    type: parsed.type,
    origin: parsed.origin,
    history: parsed.history,
    description: parsed.description,
    aroma: parsed.aroma,
    benefits: parsed.benefits.split('\n').map(s => s.trim()).filter(Boolean),
    contraindications: parsed.contraindications.split('\n').map(s => s.trim()).filter(Boolean),
    consistency: parsed.consistency || null,
    absorbency: parsed.absorbency || null,
    shelfLifeMonths: parsed.shelfLifeMonths ? parseInt(parsed.shelfLifeMonths, 10) : null,
    dilutionRateMax: parsed.dilutionRateMax ? parseFloat(parsed.dilutionRateMax) : null,
    buyUrl: parsed.buyUrl || null,
    imageUrl: parsed.imageUrl || null,
    imageAlt: parsed.imageAlt || null,
  }
}

export async function createOil(_prev: unknown, data: FormData) {
  try {
    const oil = await prisma.oil.create({ data: parseOilForm(data) })
    revalidatePath('/admin')
    revalidatePath('/oils')
    redirect(`/admin/oils/${oil.id}`)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return { error: e.issues[0]?.message ?? 'Validation error' }
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('NEXT_REDIRECT')) throw e
    return { error: msg }
  }
}

export async function previewEnrichment(
  name: string,
  type: 'ESSENTIAL' | 'CARRIER',
): Promise<import('@/lib/oil-enrichment').OilEnrichment | { error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'ANTHROPIC_API_KEY is not set' }
  }
  const allOils = await prisma.oil.findMany({ select: { name: true } })
  const allOilNames = allOils.map((o) => o.name)
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    return await enrichOilProfile(anthropic, name, type, allOilNames)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg.slice(0, 300) }
  }
}

export async function createEnrichedOil(_prev: unknown, data: FormData) {
  try {
    const oil = await prisma.oil.create({
      data: { ...parseOilForm(data), enrichedAt: new Date(), enrichmentModel: ENRICHMENT_MODEL },
    })

    const pairingsRaw = data.get('pairings')?.toString()
    if (pairingsRaw) {
      const pairings = JSON.parse(pairingsRaw) as Array<{ name: string; rating: string; reason: string }>
      const allOils = await prisma.oil.findMany({ select: { id: true, name: true } })
      const oilByName = new Map(allOils.map((o) => [o.name, o.id]))
      await Promise.all(
        pairings
          .map((p) => ({ otherId: oilByName.get(p.name), rating: p.rating, reason: p.reason }))
          .filter((p): p is { otherId: string; rating: string; reason: string } => !!p.otherId && p.otherId !== oil.id)
          .map(async ({ otherId, rating, reason }) => {
            const [idA, idB] = sortPairingIds(oil.id, otherId)
            try {
              await prisma.oilPairing.upsert({
                where: { oilAId_oilBId: { oilAId: idA, oilBId: idB } },
                create: { oilAId: idA, oilBId: idB, rating: rating as PairingRating, reason },
                update: { rating: rating as PairingRating, reason },
              })
            } catch (err) {
              console.error(`Pairing upsert failed (${idA} ↔ ${idB}):`, err)
            }
          }),
      )
    }

    revalidatePath('/admin')
    revalidatePath('/oils')
    redirect(`/admin/oils/${oil.id}`)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return { error: e.issues[0]?.message ?? 'Validation error' }
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('NEXT_REDIRECT')) throw e
    return { error: msg }
  }
}

export async function updateOil(id: string, _prev: unknown, data: FormData) {
  try {
    await prisma.oil.update({ where: { id }, data: parseOilForm(data) })
    revalidatePath('/admin')
    revalidatePath(`/admin/oils/${id}`)
    revalidatePath(`/oils/${id}`)
    revalidatePath('/oils')
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return { error: e.issues[0]?.message ?? 'Validation error' }
    const msg = e instanceof Error ? e.message : String(e)
    return { error: msg }
  }
  return { success: true }
}

export async function deleteOil(id: string) {
  await prisma.oil.delete({ where: { id } })
  revalidatePath('/admin')
  revalidatePath('/oils')
  redirect('/admin')
}
