import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const oil = await prisma.oil.findUnique({
    where: { id },
    include: {
      pairsWithA: { include: { oilB: { select: { id: true, name: true } } } },
      pairsWithB: { include: { oilA: { select: { id: true, name: true } } } },
    },
  })

  if (!oil) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pairings = [
    ...oil.pairsWithA.map((p) => ({
      oilId: p.oilB.id,
      oilName: p.oilB.name,
      rating: p.rating,
      reason: p.reason,
    })),
    ...oil.pairsWithB.map((p) => ({
      oilId: p.oilA.id,
      oilName: p.oilA.name,
      rating: p.rating,
      reason: p.reason,
    })),
  ].sort((a, b) => a.oilName.localeCompare(b.oilName))

  const { pairsWithA: _a, pairsWithB: _b, ...oilData } = oil

  return NextResponse.json({ ...oilData, pairings })
}
