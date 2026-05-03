import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateBlendSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  totalVolumeMl: z.number().positive(),
  dilutionRate: z.number().min(0.001).max(0.1),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  grade: z.enum(['A', 'B', 'C', 'F']),
  ingredients: z
    .array(
      z.object({
        oilId: z.string(),
        percentagePct: z.number().min(0),
        volumeMl: z.number().min(0),
      })
    )
    .min(2),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateBlendSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Server-side UNSAFE check
  const oilIds = data.ingredients.map((i) => i.oilId)
  const unsafePairings = await prisma.oilPairing.findMany({
    where: {
      rating: 'UNSAFE',
      oilAId: { in: oilIds },
      oilBId: { in: oilIds },
    },
  })

  const actualUnsafe = unsafePairings.filter(
    (p) => oilIds.includes(p.oilAId) && oilIds.includes(p.oilBId)
  )

  if (actualUnsafe.length > 0) {
    return NextResponse.json(
      { error: 'Blend contains unsafe oil combinations and cannot be saved.' },
      { status: 422 }
    )
  }

  const blend = await prisma.blend.create({
    data: {
      name: data.name,
      description: data.description,
      totalVolumeMl: data.totalVolumeMl,
      dilutionRate: data.dilutionRate,
      purpose: data.purpose,
      notes: data.notes,
      grade: data.grade,
      ingredients: {
        create: data.ingredients.map((i) => ({
          oilId: i.oilId,
          percentagePct: i.percentagePct,
          volumeMl: i.volumeMl,
        })),
      },
    },
  })

  return NextResponse.json({ id: blend.id }, { status: 201 })
}
