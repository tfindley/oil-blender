import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Purge user blends inactive for 30+ days.
// Protected by Authorization: Bearer <CRON_SECRET>.
//
// Suggested host cron (runs at 03:00 daily):
//   0 3 * * *  curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/purge
//
// Featured and pinned blends are never purged.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const enc = new TextEncoder()
  const a = enc.encode(auth)
  const b = enc.encode(expected)
  let diff = a.length !== b.length ? 1 : 0
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  if (diff !== 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const { count } = await prisma.blend.deleteMany({
    where: {
      isFeatured: false,
      isPinned: false,
      OR: [
        { lastAccessedAt: { lt: cutoff } },
        { lastAccessedAt: null, createdAt: { lt: cutoff } },
      ],
    },
  })

  return NextResponse.json({ deleted: count, message: `Purged ${count} inactive blend(s)` })
}
