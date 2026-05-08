'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { OilSummary, PairingRating, BlendGrade } from '@/types'
import { calculateBlend, dropsToPct, pctToDrops } from '@/lib/blend-calculator'
import { scoreBlend } from '@/lib/blend-scorer'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { CompatibilityPanel } from './CompatibilityPanel'
import { QuantityTable } from './QuantityTable'
import { OilPicker } from './OilPicker'
import { SelectedIngredientRow } from './SelectedIngredientRow'

const VOLUME_PRESETS = [10, 30, 50, 100, 200]
const DILUTION_PRESETS = [
  { label: '1%', sublabel: 'sensitive', value: 0.01 },
  { label: '2%', sublabel: 'daily', value: 0.02 },
  { label: '3%', sublabel: 'therapeutic', value: 0.03 },
  { label: '5%', sublabel: 'targeted', value: 0.05 },
]
const MAX_CARRIERS = 5
const MAX_EOS = 5
const MIN_DILUTION_RATE = 0.001  // 0.1% — floor for displayed/saved dilution

function dilutionFromEOs(eos: { percentagePct: number }[]): number {
  return Math.max(MIN_DILUTION_RATE, eos.reduce((s, e) => s + e.percentagePct, 0) / 100)
}

interface SelectedEO {
  oil: OilSummary
  percentagePct: number
}

interface SelectedCarrier {
  oil: OilSummary
  volumeMl: number
}

interface Pairing {
  oilAId: string
  oilAName: string
  oilBId: string
  oilBName: string
  rating: PairingRating
  reason: string
}

interface BlendBuilderProps {
  carriers: OilSummary[]
  essentials: OilSummary[]
  initialBlend?: {
    carriers: Array<{ oil: OilSummary; volumeMl: number }>
    essentials: Array<{ oil: OilSummary; percentagePct: number }>
    totalVolumeMl: number
    dilutionRate: number
  }
}

export function BlendBuilder({ carriers, essentials, initialBlend }: BlendBuilderProps) {
  const router = useRouter()

  const [selectedCarriers, setSelectedCarriers] = useState<SelectedCarrier[]>(initialBlend?.carriers ?? [])
  const [selectedEOs, setSelectedEOs] = useState<SelectedEO[]>(initialBlend?.essentials ?? [])
  const [totalVolumeMl, setTotalVolumeMl] = useState(initialBlend?.totalVolumeMl ?? 50)
  const [customVolume, setCustomVolume] = useState('')
  const [dilutionRate, setDilutionRate] = useState(initialBlend?.dilutionRate ?? 0.02)
  const [pairings, setPairings] = useState<Pairing[]>([])
  const [blendName, setBlendName] = useState('')
  const [blendNotes, setBlendNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [eoSearch, setEoSearch] = useState('')
  const [eoMode, setEoMode] = useState<'search' | 'browse'>('search')
  const [carrierSearch, setCarrierSearch] = useState('')
  const [carrierMode, setCarrierMode] = useState<'search' | 'browse'>('search')
  const [openSection, setOpenSection] = useState<1 | 2>(initialBlend?.carriers && initialBlend.carriers.length > 0 ? 2 : 1)
  const [avoidAcknowledged, setAvoidAcknowledged] = useState(false)

  const fetchPairings = useCallback(async (ids: string[]) => {
    if (ids.length < 2) { setPairings([]); return }
    try {
      const res = await fetch(`/api/pairings?oilIds=${ids.join(',')}`)
      if (res.ok) setPairings(await res.json())
    } catch { /* silently skip */ }
  }, [])

  useEffect(() => {
    fetchPairings([...selectedCarriers.map((c) => c.oil.id), ...selectedEOs.map((e) => e.oil.id)])
  }, [selectedCarriers.map((c) => c.oil.id).join(','), selectedEOs.map((e) => e.oil.id).join(',')]) // eslint-disable-line

  const score = scoreBlend(pairings)
  const hasBlend = selectedCarriers.length > 0 && selectedEOs.length > 0

  function handleReset() {
    setSelectedCarriers([])
    setSelectedEOs([])
    setTotalVolumeMl(50)
    setCustomVolume('')
    setDilutionRate(0.02)
    setPairings([])
    setBlendName('')
    setBlendNotes('')
    setSaveError('')
    setAvoidAcknowledged(false)
    setEoSearch('')
    setEoMode('search')
    setCarrierSearch('')
    setCarrierMode('search')
    setOpenSection(1)
  }

  const ingredientInputs = [
    ...selectedCarriers.map((c) => ({
      oilId: c.oil.id,
      name: c.oil.name,
      type: 'CARRIER' as const,
      percentagePct: 0,
      volumeMl: c.volumeMl,
    })),
    ...selectedEOs.map((e) => ({
      oilId: e.oil.id,
      name: e.oil.name,
      type: 'ESSENTIAL' as const,
      percentagePct: e.percentagePct,
      dilutionRateMax: e.oil.dilutionRateMax,
    })),
  ]

  const calc = selectedCarriers.length > 0
    ? calculateBlend(totalVolumeMl, dilutionRate, ingredientInputs)
    : { totalVolumeMl, finalVolumeMl: totalVolumeMl, dilutionRate, essentialOilTotalMl: 0, carrierVolumeMl: 0, ingredients: [], warnings: [] }

  const unsafePairings = pairings.filter((p) => p.rating === 'UNSAFE')
  const avoidPairings = pairings.filter((p) => p.rating === 'AVOID')

  const carrierSum = selectedCarriers.reduce((s, c) => s + c.volumeMl, 0)
  const carrierDrift = carrierSum - totalVolumeMl

  const calcByOilId = new Map(calc.ingredients.map((i) => [i.oilId, i]))

  function addCarrier(oil: OilSummary) {
    if (selectedCarriers.some((c) => c.oil.id === oil.id)) return
    if (selectedCarriers.length >= MAX_CARRIERS) return
    setCarrierSearch('')
    setAvoidAcknowledged(false)
    const next = [...selectedCarriers, { oil, volumeMl: 0 }]
    const even = totalVolumeMl / next.length
    setSelectedCarriers(next.map((c) => ({ ...c, volumeMl: even })))
  }

  function removeCarrier(id: string) {
    setAvoidAcknowledged(false)
    setSelectedCarriers(selectedCarriers.filter((c) => c.oil.id !== id))
  }

  function updateCarrierMl(id: string, ml: number) {
    setSelectedCarriers(selectedCarriers.map((c) =>
      c.oil.id === id ? { ...c, volumeMl: Math.max(0, ml) } : c
    ))
  }

  function fitCarriersToVolume() {
    if (selectedCarriers.length === 0) return
    if (carrierSum <= 0) {
      const even = totalVolumeMl / selectedCarriers.length
      setSelectedCarriers(selectedCarriers.map((c) => ({ ...c, volumeMl: even })))
    } else {
      const scale = totalVolumeMl / carrierSum
      setSelectedCarriers(selectedCarriers.map((c) => ({ ...c, volumeMl: c.volumeMl * scale })))
    }
  }

  function changeVolume(newVolume: number) {
    if (selectedCarriers.length > 0 && carrierSum > 0) {
      const scale = newVolume / carrierSum
      setSelectedCarriers(selectedCarriers.map((c) => ({ ...c, volumeMl: c.volumeMl * scale })))
    }
    setTotalVolumeMl(newVolume)
  }

  function addEO(oil: OilSummary) {
    if (selectedEOs.some((e) => e.oil.id === oil.id)) return
    if (selectedEOs.length >= MAX_EOS) return
    setEoSearch('')
    setAvoidAcknowledged(false)
    const newEOs = [...selectedEOs, { oil, percentagePct: dropsToPct(1, totalVolumeMl) }]
    setSelectedEOs(newEOs)
    setDilutionRate(dilutionFromEOs(newEOs))
  }

  function removeEO(id: string) {
    setAvoidAcknowledged(false)
    const next = selectedEOs.filter((e) => e.oil.id !== id)
    setSelectedEOs(next)
    setDilutionRate(dilutionFromEOs(next))
  }

  function updateDrops(id: string, drops: number) {
    const pct = dropsToPct(Math.max(1, drops), totalVolumeMl)
    const newEOs = selectedEOs.map((e) => (e.oil.id === id ? { ...e, percentagePct: pct } : e))
    setSelectedEOs(newEOs)
    setDilutionRate(dilutionFromEOs(newEOs))
  }

  const selectedIds = new Set([
    ...selectedCarriers.map((c) => c.oil.id),
    ...selectedEOs.map((e) => e.oil.id),
  ])
  const unsafePartner = new Map<string, Pairing>()
  for (const p of pairings) {
    if (p.rating !== 'UNSAFE') continue
    if (selectedIds.has(p.oilAId) && !unsafePartner.has(p.oilBId)) unsafePartner.set(p.oilBId, p)
    if (selectedIds.has(p.oilBId) && !unsafePartner.has(p.oilAId)) unsafePartner.set(p.oilAId, p)
  }

  function findUnsafePairing(oil: OilSummary): Pairing | undefined {
    return unsafePartner.get(oil.id)
  }

  const selectedCarrierOils = selectedCarriers.map((c) => c.oil)
  const selectedEOOils = selectedEOs.map((e) => e.oil)

  function toggleCarrier(oil: OilSummary) {
    if (selectedCarriers.some((c) => c.oil.id === oil.id)) removeCarrier(oil.id)
    else addCarrier(oil)
  }

  function toggleEO(oil: OilSummary) {
    if (selectedEOs.some((e) => e.oil.id === oil.id)) removeEO(oil.id)
    else addEO(oil)
  }

  const canSave =
    selectedCarriers.length > 0 &&
    selectedEOs.length >= 1 &&
    blendName.trim().length > 0 &&
    unsafePairings.length === 0 &&
    (avoidPairings.length === 0 || avoidAcknowledged)

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setSaveError('')
    const payload = {
      name: blendName.trim(),
      notes: blendNotes.trim() || undefined,
      totalVolumeMl,
      dilutionRate,
      grade: score.grade,
      ingredients: calc.ingredients.map((i) => ({
        oilId: i.oilId,
        percentagePct: i.percentagePct,
        volumeMl: i.volumeMl,
      })),
    }
    try {
      const res = await fetch('/api/blends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? 'Failed to save blend.')
        return
      }
      const { id } = await res.json()
      router.push(`/blend/${id}`)
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      {/* ── Left column: oil pickers ── */}
      <div className="space-y-6 lg:col-span-2">

        {/* Step 1: Carrier */}
        <OilPicker
          title="1. Choose Your Carrier Oils"
          noun="carriers"
          oils={carriers}
          selectedOils={selectedCarrierOils}
          maxCount={MAX_CARRIERS}
          findUnsafe={findUnsafePairing}
          onToggle={toggleCarrier}
          isOpen={openSection === 1}
          onOpen={() => setOpenSection(1)}
          mode={carrierMode}
          onModeChange={setCarrierMode}
          searchValue={carrierSearch}
          onSearchChange={setCarrierSearch}
          footer={
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setOpenSection(2)}
                disabled={selectedCarriers.length === 0}
                className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          }
        />

        {/* Step 2: Essential Oil picker */}
        <OilPicker
          title="2. Choose Your Essential Oils"
          noun="essential oils"
          oils={essentials}
          selectedOils={selectedEOOils}
          maxCount={MAX_EOS}
          findUnsafe={findUnsafePairing}
          onToggle={toggleEO}
          isOpen={openSection === 2}
          onOpen={() => setOpenSection(2)}
          mode={eoMode}
          onModeChange={setEoMode}
          searchValue={eoSearch}
          onSearchChange={setEoSearch}
        />

        {/* Merged Quantities card — Volume / Dilution / per-oil dilution alerts / editable lists / read-only summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Quantities</h2>
              {(selectedCarriers.length > 0 || selectedEOs.length > 0) && (
                <button
                  onClick={handleReset}
                  className="rounded px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
                >
                  Reset
                </button>
              )}
            </div>
          </CardHeader>
          <CardBody className="space-y-4">

            {/* Volume */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Volume</p>
              <div className="flex flex-wrap gap-1.5">
                {VOLUME_PRESETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => { changeVolume(v); setCustomVolume('') }}
                    className={`rounded border px-3 py-2 text-sm transition-all ${
                      totalVolumeMl === v && !customVolume
                        ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-stone-200 text-stone-500 hover:border-amber-300 dark:border-stone-600 dark:text-stone-400 dark:hover:border-amber-500'
                    }`}
                  >
                    {v} ml
                  </button>
                ))}
                <input
                  type="number"
                  placeholder="Custom"
                  value={customVolume}
                  min={5}
                  max={500}
                  onChange={(e) => {
                    setCustomVolume(e.target.value)
                    const v = parseInt(e.target.value)
                    if (v >= 5) changeVolume(v)
                  }}
                  className="w-20 rounded border border-stone-200 bg-white px-2 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
                />
              </div>
            </div>

            {/* Dilution */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Dilution</p>
              <div className="flex flex-wrap gap-1.5">
                {DILUTION_PRESETS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDilutionRate(d.value)}
                    className={`rounded border px-3 py-2 text-left text-xs transition-all ${
                      dilutionRate === d.value
                        ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-stone-200 text-stone-500 hover:border-amber-300 dark:border-stone-600 dark:text-stone-400 dark:hover:border-amber-500'
                    }`}
                  >
                    <span className="font-medium">{d.label}</span>
                    <span className="ml-1 text-stone-400 dark:text-stone-500">{d.sublabel}</span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
                Final mix: {calc.finalVolumeMl.toFixed(1)} ml
                ({calc.carrierVolumeMl.toFixed(1)} ml carrier + {calc.essentialOilTotalMl.toFixed(1)} ml essentials)
              </p>
            </div>

            {/* Per-oil dilution warnings (also shown in Compatibility card) */}
            {calc.warnings.length > 0 && (
              <div className="space-y-2">
                {calc.warnings.map((w, i) => (
                  <Alert key={i} variant="caution">{w}</Alert>
                ))}
              </div>
            )}

            {/* Carriers */}
            <div className="border-t border-stone-100 pt-3 dark:border-stone-700">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Carrier Oils {selectedCarriers.length > 0 && `(${selectedCarriers.length}/${MAX_CARRIERS})`}
              </p>
              {selectedCarriers.length === 0 ? (
                <p className="text-sm italic text-stone-400 dark:text-stone-500">None selected</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedCarriers.map((c) => (
                    <SelectedIngredientRow
                      key={c.oil.id}
                      name={c.oil.name}
                      botanicalName={c.oil.botanicalName}
                      value={Math.round(c.volumeMl)}
                      unit="ml"
                      onChange={(v) => updateCarrierMl(c.oil.id, v)}
                      onRemove={() => removeCarrier(c.oil.id)}
                      removeAriaLabel={`Remove ${c.oil.name}`}
                    />
                  ))}
                </div>
              )}
              {selectedCarriers.length > 0 && Math.abs(carrierDrift) >= 0.5 && (
                <div className="mt-1 flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-500">
                  <span>
                    {carrierDrift > 0
                      ? `${carrierDrift.toFixed(0)} ml over Volume`
                      : `${(-carrierDrift).toFixed(0)} ml unallocated`}
                  </span>
                  <button onClick={fitCarriersToVolume} className="underline hover:no-underline">
                    Fit to Volume
                  </button>
                </div>
              )}
            </div>

            {/* Essential oils */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Essential Oils {selectedEOs.length > 0 && `(${selectedEOs.length}/${MAX_EOS})`}
              </p>
              {selectedEOs.length === 0 ? (
                <p className="text-sm italic text-stone-400 dark:text-stone-500">None selected</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedEOs.map((e) => (
                    <SelectedIngredientRow
                      key={e.oil.id}
                      name={e.oil.name}
                      botanicalName={e.oil.botanicalName}
                      value={pctToDrops(e.percentagePct, totalVolumeMl)}
                      unit="drops"
                      onChange={(v) => updateDrops(e.oil.id, v)}
                      onRemove={() => removeEO(e.oil.id)}
                      removeAriaLabel={`Remove ${e.oil.name}`}
                      over={calcByOilId.get(e.oil.id)?.overMaxDilution ?? false}
                    />
                  ))}
                </div>
              )}
              {selectedEOs.length > 0 && (
                <p className="mt-1.5 text-[10px] text-stone-400 dark:text-stone-500">
                  Dilution set automatically from drops (1 ml = 20 drops)
                </p>
              )}
            </div>

            {/* Read-only summary table */}
            {calc.ingredients.length > 0 && (
              <div className="border-t border-stone-100 pt-3 dark:border-stone-700">
                <QuantityTable ingredients={calc.ingredients} totalVolumeMl={totalVolumeMl} />
              </div>
            )}

          </CardBody>
        </Card>
      </div>

      {/* ── Right column: compatibility + save ── */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-0.5">

        {/* Compatibility */}
        <Card>
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Compatibility</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Hard stops + warnings at the top so users see the blockers first */}
            {unsafePairings.length > 0 && (
              <Alert variant="unsafe" title="Unsafe combination">
                This blend cannot be saved. Remove the conflicting oils.
              </Alert>
            )}

            {avoidPairings.length > 0 && unsafePairings.length === 0 && !avoidAcknowledged && (
              <Alert variant="avoid" title="Not recommended">
                One or more pairings are not recommended.{' '}
                <button
                  className="mt-2 font-medium underline underline-offset-2"
                  onClick={() => setAvoidAcknowledged(true)}
                >
                  I understand — proceed anyway
                </button>
              </Alert>
            )}

            {calc.warnings.map((w, i) => (
              <Alert key={i} variant="caution">{w}</Alert>
            ))}

            {hasBlend && <CompatibilityPanel grade={score.grade} summary={score.summary} pairings={pairings} />}
          </CardBody>
        </Card>

        {/* Save Blend */}
        <Card>
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Save Blend</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Input
              label="Name your blend"
              placeholder="e.g. Evening Calm"
              value={blendName}
              onChange={(e) => setBlendName(e.target.value)}
            />

            <Textarea
              label="Notes (optional)"
              rows={3}
              placeholder="Intended use, application method, personal notes…"
              value={blendNotes}
              onChange={(e) => setBlendNotes(e.target.value)}
            />

            {saveError && <Alert variant="unsafe">{saveError}</Alert>}

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!canSave || saving}
            >
              {saving ? 'Saving…' : 'Save & Get Recipe Card'}
            </Button>

            {selectedCarriers.length === 0 && (
              <p className="text-center text-xs text-stone-400 dark:text-stone-500">Choose at least one carrier oil to get started.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
