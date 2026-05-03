import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const q = searchParams.get('q')

  const oils = await prisma.oil.findMany({
    where: {
      ...(type === 'ESSENTIAL' || type === 'CARRIER' ? { type } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { botanicalName: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    select: {
      id: true,
      name: true,
      botanicalName: true,
      type: true,
      aroma: true,
      benefits: true,
      description: true,
      consistency: true,
      absorbency: true,
      dilutionRateMax: true,
      imageUrl: true,
      imageAlt: true,
      buyUrl: true,
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(oils)
}
