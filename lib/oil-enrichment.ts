import type Anthropic from '@anthropic-ai/sdk'

export interface OilEnrichment {
  botanicalName: string
  origin: string
  history: string
  description: string
  benefits: string[]
  contraindications: string[]
  aroma: string
  consistency?: string
  absorbency?: string
  shelfLifeMonths?: number
  dilutionRateMax?: number
  pairings: Array<{
    name: string
    rating: 'EXCELLENT' | 'GOOD' | 'CAUTION' | 'AVOID'
    reason: string
  }>
}

interface CachedTextBlock {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}

export const ENRICHMENT_MODEL = 'claude-sonnet-4-6'
const MODEL = ENRICHMENT_MODEL
const INITIAL_MAX_TOKENS = 8192
const RETRY_MAX_TOKENS = 16384

function buildEnrichmentMessage(
  name: string,
  type: 'ESSENTIAL' | 'CARRIER',
  allOilNames: string[],
): CachedTextBlock[] {
  const isCarrier = type === 'CARRIER'
  const sortedNames = [...allOilNames].sort()

  const cached = `You are an expert aromatherapist and massage therapist. You will be given the name of a ${isCarrier ? 'carrier' : 'essential'} oil and asked to provide professional information about it for use in massage blending.

Respond with a single JSON object (no markdown, no explanation) matching this exact shape:

{
  "botanicalName": "string — Latin botanical name",
  "origin": "string — primary country/region of origin",
  "history": "string — 2–3 sentences on historical use and cultural context",
  "description": "string — 2–3 sentences on the oil's character, texture, and typical massage applications",
  "benefits": ["array of 4–6 concise benefit strings"],
  "contraindications": ["array of 2–4 contraindication strings, or empty array if none significant"],
  "aroma": "string — brief aroma description (e.g. 'warm, spicy, woody')",
  ${isCarrier ? `"consistency": "light|medium|heavy",
  "absorbency": "fast|medium|slow",
  "shelfLifeMonths": number,` : `"dilutionRateMax": number between 0.01 and 0.05 (e.g. 0.02 for 2%),`}
  "pairings": [
    {
      "name": "exact oil name from the list below",
      "rating": "EXCELLENT|GOOD|CAUTION|AVOID",
      "reason": "1 sentence explanation shown to user"
    }
  ]
}

The pairings array must rate EACH of the following oils EXCEPT the target oil itself:
${sortedNames.join(', ')}

Use exactly these ratings:
- EXCELLENT = actively beneficial together, enhances effects
- GOOD = compatible, no issues
- CAUTION = mild concern (e.g. competing scents, mild sensitisation risk) — user should be informed
- AVOID = not recommended (therapeutic conflict, sensitisation, or aroma clash) — user must acknowledge
Do NOT use UNSAFE — that is reserved for hand-curated safety overrides.`

  const dynamic = `Now respond for the ${isCarrier ? 'carrier' : 'essential'} oil: ${name}`

  return [
    { type: 'text', text: cached, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamic },
  ]
}

export function parseEnrichmentResponse(raw: string): OilEnrichment {
  const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '')
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0]) as OilEnrichment
}

export async function enrichOilProfile(
  anthropic: Anthropic,
  name: string,
  type: 'ESSENTIAL' | 'CARRIER',
  allOilNames: string[],
): Promise<OilEnrichment> {
  const content = buildEnrichmentMessage(name, type, allOilNames)
  let maxTokens = INITIAL_MAX_TOKENS

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: content as any }],
    })

    if (response.stop_reason === 'max_tokens' && attempt === 0) {
      console.warn(`  ⚠ Response for ${name} truncated at ${maxTokens} tokens — retrying with ${RETRY_MAX_TOKENS}`)
      maxTokens = RETRY_MAX_TOKENS
      continue
    }

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    return parseEnrichmentResponse(raw)
  }

  throw new Error(`Response for ${name} truncated even at ${RETRY_MAX_TOKENS} tokens`)
}
