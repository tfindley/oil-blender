import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function Home() {
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
                body: 'Every combination is graded A–F. CAUTION and AVOID pairings are flagged with plain-English explanations. Genuinely unsafe combinations are blocked.',
              },
              {
                icon: '📐',
                title: 'Precise Quantities',
                body: 'Choose your batch volume (10–200ml) and dilution rate. Get exact millilitres and drop counts for every oil in your blend.',
              },
              {
                icon: '📄',
                title: 'Printable Recipe Card',
                body: 'Save your blend and download a PDF recipe card with ingredients, benefits, pairing notes, and a shareable URL.',
              },
              {
                icon: '🔗',
                title: 'Shareable Blend Links',
                body: 'Every saved blend gets a permanent URL. Share with clients, friends, or return to it later.',
              },
              {
                icon: '🌿',
                title: '45 Oils in the Library',
                body: '30 essential oils and 15 carrier oils — each with origins, benefits, contraindications, and curated pairing data.',
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
