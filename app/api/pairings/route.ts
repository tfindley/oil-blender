import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const oilIdsParam = searchParams.get('oilIds')

  if (!oilIdsParam) return NextResponse.json([])

  const oilIds = oilIdsParam.split(',').filter(Boolean)
  if (oilIds.length < 2) return NextResponse.json([])

  const pairings = await prisma.oilPairing.findMany({
    where: {
      OR: [
        { oilAId: { in: oilIds }, oilBId: { in: oilIds } },
      ],
    },
    include: {
      oilA: { select: { id: true, name: true } },
      oilB: { select: { id: true, name: true } },
    },
  })

  const result = pairings
    .filter((p) => oilIds.includes(p.oilAId) && oilIds.includes(p.oilBId))
    .map((p) => ({
      oilAId: p.oilAId,
      oilAName: p.oilA.name,
      oilBId: p.oilBId,
      oilBName: p.oilB.name,
      rating: p.rating,
      reason: p.reason,
    }))

  return NextResponse.json(result)
}
