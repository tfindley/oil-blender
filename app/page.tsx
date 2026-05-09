import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { BlendCard } from '@/components/blends/BlendCard'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [featuredBlends, carrierCount, essentialCount, pairingCount, communityBlendCount] = await Promise.all([
    prisma.blend.findMany({
      where: { isHidden: false, OR: [{ isFeatured: true }, { isPinned: true }] },
      select: {
        id: true,
        name: true,
        grade: true,
        authorName: true,
        about: true,
        viewCount: true,
        isPinned: true,
        ingredients: {
          where: { oil: { type: 'ESSENTIAL' } },
          include: { oil: { select: { name: true } } },
          take: 3,
        },
      },
      orderBy: [{ isPinned: 'desc' }, { viewCount: 'desc' }],
      take: 6,
    }),
    prisma.oil.count({ where: { type: 'CARRIER' } }),
    prisma.oil.count({ where: { type: 'ESSENTIAL' } }),
    prisma.oilPairing.count(),
    prisma.blend.count({ where: { isHidden: false } }),
  ])

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-stone-50 to-stone-100 px-4 py-20 text-center dark:from-stone-900 dark:via-stone-900 dark:to-stone-800">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 text-5xl">🌿</div>
          <h1 className="mb-4 font-serif text-4xl font-bold text-stone-900 sm:text-5xl dark:text-stone-100">
            Craft Your Perfect <br className="hidden sm:block" />
            Massage Oil Blend
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-stone-600 dark:text-stone-300">
            Combine carrier and essential oils with real-time compatibility scoring, safety guidance, and a downloadable recipe card — all in one place.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/blend">
              <Button size="lg" className="w-full sm:w-auto">
                Build Your Blend
              </Button>
            </Link>
            <Link href="/oils">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Browse Oil Library
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-stone-200 bg-white px-4 py-10 dark:border-stone-700 dark:bg-stone-900">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          <Stat
            number={carrierCount + essentialCount}
            label="Oils in the library"
            sublabel={`${carrierCount} carriers · ${essentialCount} essentials`}
          />
          <Stat
            number={pairingCount}
            label="Curated pairings"
            sublabel="Excellent · Good · Caution · Avoid · Unsafe"
          />
          <Stat
            number={communityBlendCount}
            label="Saved blends"
            sublabel="Built by the community"
          />
          <Stat
            number="A–F"
            label="Blend grading"
            sublabel="Real-time compatibility scoring"
            isText
          />
        </div>
      </section>

      {/* Featured blends */}
      {featuredBlends.length > 0 && (
        <section className="px-4 py-16 bg-stone-50 dark:bg-stone-900/50">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-stone-800 dark:text-stone-200">
                  Featured Blends
                </h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Curated recipes from our community — ready to make.
                </p>
              </div>
              <Link
                href="/blends"
                className="shrink-0 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
              >
                Explore all blends →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBlends.map((b) => (
                <BlendCard
                  key={b.id}
                  id={b.id}
                  name={b.name}
                  grade={b.grade}
                  authorName={b.authorName}
                  about={b.about}
                  viewCount={b.viewCount}
                  isPinned={b.isPinned}
                  topOils={b.ingredients.map((i) => i.oil.name)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center font-serif text-2xl font-semibold text-stone-800 dark:text-stone-200">
            Everything you need to blend with confidence
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '⚗️',
                title: 'Smart Compatibility Scoring',
                body: 'Every combination is graded A–F — carrier↔carrier, carrier↔EO, and EO↔EO pairings all factor in. CAUTION and AVOID pairings are flagged with plain-English explanations. Genuinely unsafe combinations are blocked.',
              },
              {
                icon: '🧪',
                title: 'Multi-Carrier Blending',
                body: 'Mix up to 5 carrier oils — say 50 ml jojoba + 50 ml sweet almond. Each carrier is set in millilitres directly with a drift warning if your sum doesn’t match the target volume.',
              },
              {
                icon: '📐',
                title: 'Precise Quantities',
                body: 'Carriers in millilitres, essential oils in drops. The chosen volume is your carrier volume; EOs add on top, so 100 ml @ 3% dilution gives 100 ml carrier + 3 ml EO = 103 ml final mix.',
              },
              {
                icon: '📄',
                title: 'Printable Recipe Card',
                body: 'Save your blend and download a PDF recipe card with ingredients, benefits, pairing notes, and a QR code linking back to your blend.',
              },
              {
                icon: '🔗',
                title: 'Shareable Blend Links',
                body: 'Every saved blend gets a permanent URL. Share with clients, friends, or return to it later.',
              },
              {
                icon: '🌿',
                title: `${carrierCount + essentialCount} Oils in the Library`,
                body: `${essentialCount} essential oils and ${carrierCount} carrier oils — each with origins, benefits, contraindications, and curated pairing data.`,
              },
              {
                icon: '🛡️',
                title: 'Safety First',
                body: 'Dilution guidance for every oil. Contraindications clearly listed. Incompatible combinations are caught before you mix.',
              },
            ].map((f) => (
              <Card key={f.title}>
                <CardBody>
                  <div className="mb-3 text-3xl">{f.icon}</div>
                  <h3 className="mb-2 font-serif font-semibold text-stone-800 dark:text-stone-200">{f.title}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{f.body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-700 px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 font-serif text-3xl font-bold">Ready to blend?</h2>
          <p className="mb-8 text-amber-100">
            Choose your carrier, pick your essential oils, and see how well they work together — in seconds.
          </p>
          <Link href="/blend">
            <Button size="lg" variant="secondary">
              Start Building
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function Stat({
  number,
  label,
  sublabel,
  isText,
}: {
  number: number | string
  label: string
  sublabel?: string
  isText?: boolean
}) {
  return (
    <div>
      <div
        className={`font-serif font-bold text-stone-900 dark:text-stone-100 ${
          isText ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'
        }`}
      >
        {typeof number === 'number' ? number.toLocaleString() : number}
      </div>
      <div className="mt-1 text-sm font-medium text-stone-700 dark:text-stone-300">{label}</div>
      {sublabel && <div className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{sublabel}</div>}
    </div>
  )
}
