import Link from 'next/link'

export const metadata = {
  title: 'Aromatherapy Glossary',
  description: 'Plain-language definitions of common aromatherapy and massage oil terms — therapeutic properties, carrier oil qualities, fatty acids, and blending concepts.',
}

interface Term {
  term: string
  definition: string
  caution?: string
}

interface Section {
  id: string
  title: string
  description: string
  terms: Term[]
}

const SECTIONS: Section[] = [
  {
    id: 'therapeutic',
    title: 'Therapeutic Properties',
    description: 'Words that describe what an oil does when applied to the body. You\'ll see these in oil benefit and contraindication lists.',
    terms: [
      { term: 'Analgesic', definition: 'Pain-relieving. Reduces the sensation of pain when applied topically; useful in massage for sore muscles and joints.' },
      { term: 'Antibacterial', definition: 'Inhibits or kills bacteria on the skin\'s surface. Relevant for acne-prone or broken skin.' },
      { term: 'Anti-inflammatory', definition: 'Reduces inflammation, swelling, and associated redness or heat in skin and underlying tissue.' },
      { term: 'Antioxidant', definition: 'Neutralises free radicals — unstable molecules that cause oxidative stress and cellular damage. Antioxidant-rich oils protect the skin from premature ageing and environmental damage.' },
      { term: 'Antiseptic', definition: 'Prevents infection by inhibiting the growth of microorganisms on the skin or in wounds.' },
      { term: 'Antispasmodic', definition: 'Relieves involuntary muscle contractions, cramps, and spasms. Useful in abdominal and sports massage.' },
      { term: 'Antiviral', definition: 'Inhibits the replication or activity of viruses on or near the skin surface.' },
      { term: 'Anxiolytic', definition: 'Reduces anxiety and promotes calm. Many essential oils with anxiolytic properties act through the olfactory system, influencing the limbic (emotional) brain.' },
      { term: 'Astringent', definition: 'Tightens and tones skin tissue. Reduces oiliness and the visible appearance of pores. Common in oils used for oily or combination skin.' },
      { term: 'Carminative', definition: 'Relieves gas and digestive discomfort. Often used in gentle abdominal massage to ease bloating.' },
      { term: 'Cicatrisant', definition: 'Promotes the formation of scar tissue and supports wound healing. Oils with this property are often used to reduce the appearance of scars.' },
      { term: 'Cytophylactic', definition: 'Stimulates cell regeneration and renewal. Beneficial for ageing skin and slow-healing wounds.' },
      { term: 'Decongestant', definition: 'Helps relieve nasal and chest congestion by reducing inflammation in mucous membranes. Most effective when inhaled rather than applied.' },
      { term: 'Emmenagogue', definition: 'Stimulates or increases menstrual flow.', caution: 'Avoid during pregnancy — emmenagogue properties can stimulate uterine contractions.' },
      { term: 'Emollient', definition: 'Softens and soothes the skin, forming a protective layer that prevents moisture loss. Both carrier oils and some essential oils have emollient properties.' },
      { term: 'Expectorant', definition: 'Loosens and helps clear mucus from the respiratory tract. Most effective through steam inhalation or chest massage.' },
      { term: 'Hepatic', definition: 'Supports liver function and bile production. Generally more relevant to internal herbal use, but noted in some oil profiles.' },
      { term: 'Hypotensive', definition: 'Lowers blood pressure. Relevant in relaxation massage; take care with clients already on blood pressure medication.' },
      { term: 'Immunostimulant', definition: 'Supports or boosts immune system activity, helping the body defend against infection.' },
      { term: 'Nervine', definition: 'Calms and supports the nervous system. Useful for stress, anxiety, and nervous tension; often described as grounding.' },
      { term: 'Rubefacient', definition: 'Warms the skin and increases local blood circulation, causing a flushing or reddening effect. Used in warming massage for muscle relief.' },
      { term: 'Sedative', definition: 'Calming to the nervous system; promotes relaxation and sleep. Common in evening or stress-relief blends.' },
      { term: 'Tonic', definition: 'Generally invigorates and strengthens. The specific system affected (skin, nervous, circulatory) depends on the individual oil.' },
      { term: 'Vulnerary', definition: 'Promotes healing of wounds, cuts, and skin lesions by supporting tissue repair.' },
    ],
  },
  {
    id: 'carrier',
    title: 'Carrier Oil Properties',
    description: 'Terms specific to the base oils used to dilute essential oils. These properties help you choose the right carrier for a blend\'s purpose and the client\'s skin type.',
    terms: [
      { term: 'Absorbency', definition: 'How quickly a carrier oil penetrates the skin. Fast-absorbing oils (e.g. grapeseed, sweet almond) leave little residue and suit everyday massage; slow-absorbing oils (e.g. castor, neem) sit on the skin longer, providing extended slip and occlusion.' },
      { term: 'Comedogenic', definition: 'Tending to clog pores and promote blackheads or acne. Comedogenicity is rated on a scale of 0 (non-comedogenic) to 5 (highly comedogenic). Choose ratings of 0–2 for acne-prone or facial skin.' },
      { term: 'Consistency', definition: 'The texture and viscosity of a carrier oil — light, medium, or heavy. Lighter oils spread easily and feel less greasy; heavier oils provide more lubrication and are better for dry or mature skin.' },
      { term: 'Fixed oil', definition: 'Another name for a carrier oil. "Fixed" distinguishes it from an essential (volatile) oil — fixed oils do not evaporate at room temperature and contain fatty acids, whereas essential oils do not.' },
      { term: 'Oxidation', definition: 'The chemical process by which oils go rancid when exposed to oxygen, heat, or light. Oils high in polyunsaturated fatty acids oxidise more quickly. Store all carrier oils in dark, cool conditions and discard if they smell off.' },
      { term: 'Shelf life', definition: 'How long a carrier oil remains stable before oxidation causes it to degrade. Ranges from 6 months (rosehip, hemp seed) to several years (jojoba, coconut). Vitamin E (tocopherol) content naturally extends shelf life.' },
    ],
  },
  {
    id: 'chemistry',
    title: 'Fatty Acids & Chemistry',
    description: 'The molecular building blocks behind the properties you read about. You don\'t need to memorise these, but recognising them makes oil descriptions much more meaningful.',
    terms: [
      { term: 'Fatty acid', definition: 'Organic acids that are the primary building blocks of vegetable oils. The fatty acid profile of a carrier oil — how much of each type it contains — determines its texture, absorption rate, skin benefits, and shelf life.' },
      { term: 'Lauric acid', definition: 'A saturated fatty acid found abundantly in coconut oil. Strongly antimicrobial and antifungal; contributes to coconut oil\'s solid texture at room temperature.' },
      { term: 'Linoleic acid (Omega-6)', definition: 'A polyunsaturated essential fatty acid. Anti-inflammatory and essential for maintaining the skin\'s moisture barrier. Found in high concentrations in rosehip, hemp seed, and evening primrose oils. Skin cannot synthesise it — it must be applied or ingested.' },
      { term: 'Oleic acid (Omega-9)', definition: 'A monounsaturated fatty acid. Deeply moisturising and helps other compounds penetrate the skin. Dominant in olive, sweet almond, and argan oils. Makes oils feel rich and nourishing.' },
      { term: 'Palmitic acid', definition: 'A saturated fatty acid. Contributes to a heavier, more occlusive texture and a longer shelf life, but can feel slightly greasier on skin.' },
      { term: 'Polyphenol', definition: 'A large family of antioxidant plant compounds. Found in cold-pressed carrier oils and associated with anti-ageing and anti-inflammatory skin benefits. Proanthocyanidins are a well-known subgroup.' },
      { term: 'Proanthocyanidins', definition: 'A class of polyphenolic antioxidant compounds particularly abundant in grape seed and rosehip oils. Especially effective at neutralising free radicals, supporting collagen integrity, and protecting against UV-related skin damage.' },
      { term: 'Tocopherol (Vitamin E)', definition: 'A fat-soluble antioxidant present naturally in many carrier oils. Protects the oil itself from oxidising (going rancid) and provides antioxidant benefits to skin. Sometimes added to blends to extend shelf life.' },
      { term: 'Volatile', definition: 'Evaporates readily at room temperature. Essential oils are volatile compounds — this is why you can smell them without heating them, and why they do not leave an oily residue on skin after massage. Carrier oils are non-volatile.' },
    ],
  },
  {
    id: 'blending',
    title: 'Blending & Safety',
    description: 'Terms about how oils are combined, measured, and used safely.',
    terms: [
      { term: 'Base note', definition: 'The heaviest, lowest, and most persistent layer of a blend\'s fragrance. Base notes anchor and fix the lighter components. Examples: frankincense, sandalwood, patchouli, vetiver. They are often the last to be detected but the longest lasting.' },
      { term: 'Carrier oil', definition: 'A vegetable, nut, or seed oil used to dilute essential oils to a safe concentration for skin application. Unlike essential oils, carrier oils do not evaporate, are not strongly aromatic, and are applied directly to skin.' },
      { term: 'Contraindication', definition: 'A condition, circumstance, or concurrent product that makes use of an oil inadvisable. Common contraindications include pregnancy, epilepsy, high blood pressure, certain medications, and specific skin conditions.' },
      { term: 'Dilution rate', definition: 'The percentage of essential oils relative to the total blend volume. Standard guidelines: 1% for sensitive, elderly, or child skin; 2% for daily use; 3% for therapeutic massage; 5% for targeted spot treatment. Higher concentrations increase both effect and the risk of sensitisation.' },
      { term: 'Essential oil', definition: 'A concentrated, volatile, aromatic extract obtained from plant material by steam distillation or cold pressing. Despite the name, essential oils are not true oils — they contain no fatty acids and do not leave an oily residue. They must be diluted in a carrier before skin application.' },
      { term: 'Heart note', definition: 'Another term for middle note — the core of a blend\'s fragrance, emerging after the top notes fade. Examples: lavender, geranium, ylang ylang, rose.' },
      { term: 'Middle note', definition: 'The body and character of a blend\'s scent. Balanced in volatility — not as fleeting as top notes, not as persistent as base notes. Examples: lavender, rosemary, geranium, chamomile.' },
      { term: 'Patch test', definition: 'Applying a small amount of diluted oil to a discrete area of skin (typically the inner forearm) and waiting 24 hours to check for any adverse reaction before broader use. Recommended for any new oil or blend.' },
      { term: 'Phototoxicity', definition: 'A reaction in which certain compounds — particularly furanocoumarins in cold-pressed citrus peel oils — become reactive when exposed to UV light, causing skin discolouration or burning.', caution: 'Avoid sun exposure for at least 12 hours after applying phototoxic oils. Bergamot FCF (furanocoumarin-free) is a safer processed alternative.' },
      { term: 'Sensitisation', definition: 'An immune reaction triggered by repeated or high-concentration exposure to certain essential oil compounds. Once sensitised, a person may react severely to even trace amounts of that compound — and unlike simple irritation, sensitisation is irreversible.' },
      { term: 'Synergy', definition: 'The principle that a combination of compatible oils can produce a combined effect greater than the sum of their individual contributions. Well-designed blends exploit synergy to enhance therapeutic outcomes.' },
      { term: 'Top note', definition: 'The first and most immediate impression of a blend — light, fresh, and highly volatile, but the shortest-lived component. Examples: bergamot, lemon, eucalyptus, peppermint.' },
    ],
  },
]

function GlossaryTerm({ term, definition, caution }: Term) {
  return (
    <div className="border-b border-stone-100 py-4 last:border-0 dark:border-stone-700">
      <dt className="mb-1 font-semibold text-stone-900 dark:text-stone-100">{term}</dt>
      <dd className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{definition}</dd>
      {caution && (
        <dd className="mt-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
          Caution: {caution}
        </dd>
      )}
    </div>
  )
}

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-3">
        <Link
          href="/about"
          className="text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        >
          ← About
        </Link>
      </div>

      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold text-stone-900 dark:text-stone-100">Aromatherapy Glossary</h1>
        <p className="mt-3 text-lg text-stone-600 dark:text-stone-400">
          Plain-language definitions for the terms you&apos;ll encounter in oil profiles, blend notes, and aromatherapy literature.
        </p>
      </div>

      {/* Jump nav */}
      <nav className="mb-10 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-600 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-amber-600 dark:hover:text-amber-400"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-14">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="mb-1 font-serif text-2xl font-semibold text-stone-800 dark:text-stone-200">
              {section.title}
            </h2>
            <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">{section.description}</p>
            <dl className="rounded-xl border border-stone-200 bg-white px-6 dark:border-stone-700 dark:bg-stone-800">
              {section.terms.map((t) => (
                <GlossaryTerm key={t.term} {...t} />
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400">
        <p>
          Definitions are intended as a practical reference for blend building, not a clinical resource.
          For therapeutic use, consult a qualified aromatherapist. Oil compatibility data in this application
          is AI-assisted — see the{' '}
          <Link href="/about#ai" className="font-medium text-amber-700 hover:underline dark:text-amber-500">
            AI transparency notice
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
