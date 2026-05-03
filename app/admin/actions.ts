'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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
  buyUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
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
