'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { OilSummary, PairingRating, BlendGrade } from '@/types'
import { calculateBlend } from '@/lib/blend-calculator'
import { scoreBlend } from '@/lib/blend-scorer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { CompatibilityPanel } from './CompatibilityPanel'
import { QuantityTable } from './QuantityTable'

const VOLUME_PRESETS = [10, 30, 50, 100, 200]
const DILUTION_PRESETS = [
  { label: '1% — sensitive', value: 0.01 },
  { label: '2% — daily', value: 0.02 },
  { label: '3% — therapeutic', value: 0.03 },
  { label: '5% — targeted', value: 0.05 },
]

interface SelectedEO {
  oil: OilSummary
  percentagePct: number
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
}

export function BlendBuilder({ carriers, essentials }: BlendBuilderProps) {
  const router = useRouter()

  const [carrier, setCarrier] = useState<OilSummary | null>(null)
  const [selectedEOs, setSelectedEOs] = useState<SelectedEO[]>([])
  const [totalVolumeMl, setTotalVolumeMl] = useState(50)
  const [customVolume, setCustomVolume] = useState('')
  const [dilutionRate, setDilutionRate] = useState(0.02)
  const [pairings, setPairings] = useState<Pairing[]>([])
  const [blendName, setBlendName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [eoSearch, setEoSearch] = useState('')
  const [eoMode, setEoMode] = useState<'search' | 'browse'>('search')
  const [avoidAcknowledged, setAvoidAcknowledged] = useState(false)

  const allSelectedIds = [carrier?.id, ...selectedEOs.map((e) => e.oil.id)].filter(Boolean) as string[]

  const fetchPairings = useCallback(async (ids: string[]) => {
    if (ids.length < 2) { setPairings([]); return }
    try {
      const res = await fetch(`/api/pairings?oilIds=${ids.join(',')}`)
      if (res.ok) setPairings(await res.json())
    } catch { /* silently skip */ }
  }, [])

  useEffect(() => {
    fetchPairings(allSelectedIds)
  }, [carrier?.id, selectedEOs.map((e) => e.oil.id).join(',')]) // eslint-disable-line

  const score = scoreBlend(pairings)

  const ingredientInputs = [
    ...(carrier ? [{ oilId: carrier.id, name: carrier.name, type: 'CARRIER' as const, percentagePct: 100 - dilutionRate * 100 }] : []),
    ...selectedEOs.map((e) => ({
      oilId: e.oil.id,
      name: e.oil.name,
      type: 'ESSENTIAL' as const,
      percentagePct: e.percentagePct,
      dilutionRateMax: e.oil.dilutionRateMax,
    })),
  ]

  const calc = carrier
    ? calculateBlend(totalVolumeMl, dilutionRate, ingredientInputs)
    : { totalVolumeMl, dilutionRate, essentialOilTotalMl: 0, carrierVolumeMl: 0, ingredients: [], warnings: [] }

  const unsafePairings = pairings.filter((p) => p.rating === 'UNSAFE')
  const avoidPairings = pairings.filter((p) => p.rating === 'AVOID')

  function addEO(oil: OilSummary) {
    if (selectedEOs.some((e) => e.oil.id === oil.id)) return
    const newCount = selectedEOs.length + 1
    const pctEach = (dilutionRate * 100) / newCount
    setSelectedEOs([
      ...selectedEOs.map((e) => ({ ...e, percentagePct: pctEach })),
      { oil, percentagePct: pctEach },
    ])
    setEoSearch('')
    setAvoidAcknowledged(false)
  }

  function removeEO(id: string) {
    const next = selectedEOs.filter((e) => e.oil.id !== id)
    if (next.length > 0) {
      const pctEach = (dilutionRate * 100) / next.length
      setSelectedEOs(next.map((e) => ({ ...e, percentagePct: pctEach })))
    } else {
      setSelectedEOs([])
    }
    setAvoidAcknowledged(false)
  }

  function updatePct(id: string, pct: number) {
    setSelectedEOs(selectedEOs.map((e) => (e.oil.id === id ? { ...e, percentagePct: pct } : e)))
  }

  function isUnsafeWithCurrent(eo: OilSummary): Pairing | undefined {
    return pairings.find(
      (p) =>
        p.rating === 'UNSAFE' &&
        ((p.oilAId === carrier?.id && p.oilBId === eo.id) ||
          (p.oilBId === carrier?.id && p.oilAId === eo.id) ||
          selectedEOs.some(
            (s) =>
              (p.oilAId === s.oil.id && p.oilBId === eo.id) ||
              (p.oilBId === s.oil.id && p.oilAId === eo.id)
          ))
    )
  }

  const availableEOs = essentials.filter((e) => !selectedEOs.some((s) => s.oil.id === e.id))
  const filteredEOs = availableEOs.filter(
    (e) =>
      !eoSearch ||
      e.name.toLowerCase().includes(eoSearch.toLowerCase()) ||
      e.botanicalName.toLowerCase().includes(eoSearch.toLowerCase())
  )

  const canSave =
    !!carrier &&
    selectedEOs.length >= 1 &&
    blendName.trim().length > 0 &&
    unsafePairings.length === 0 &&
    (avoidPairings.length === 0 || avoidAcknowledged)

  async function handleSave() {
    if (!canSave || !carrier) return
    setSaving(true)
    setSaveError('')
    const payload = {
      name: blendName.trim(),
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
      {/* Left column: inputs */}
      <div className="space-y-6 lg:col-span-2">

        {/* Step 1: Carrier */}
        <Card>
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">1. Choose Your Carrier Oil</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">The base that delivers the blend to your skin.</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {carriers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCarrier(c); setAvoidAcknowledged(false) }}
                  title={c.description}
                  className={`rounded-lg border p-3 text-left text-sm transition-all ${
                    carrier?.id === c.id
                      ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-500'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50/40 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-200 dark:hover:border-amber-500 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500 line-clamp-1 dark:text-stone-400">{c.aroma}</p>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Step 2: Essential Oils */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">2. Add Essential Oils</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">Select up to 5 essential oils for your blend.</p>
              </div>
              {selectedEOs.length < 5 && (
                <div className="flex rounded-md border border-stone-200 text-xs dark:border-stone-600">
                  <button
                    onClick={() => setEoMode('search')}
                    className={`px-3 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md ${
                      eoMode === 'search'
                        ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                        : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-700'
                    }`}
                  >
                    Search
                  </button>
                  <button
                    onClick={() => setEoMode('browse')}
                    className={`px-3 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md ${
                      eoMode === 'browse'
                        ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                        : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-700'
                    }`}
                  >
                    Browse
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {/* Selected EOs */}
            {selectedEOs.length > 0 && (
              <div className="space-y-2">
                {selectedEOs.map((e) => (
                  <div key={e.oil.id} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-600 dark:bg-stone-700">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{e.oil.name}</span>
                      <span className="ml-2 text-xs italic text-stone-400 dark:text-stone-500">{e.oil.botanicalName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0.1}
                        max={5}
                        step={0.1}
                        value={e.percentagePct.toFixed(1)}
                        onChange={(ev) => updatePct(e.oil.id, parseFloat(ev.target.value) || 0)}
                        className="w-16 rounded border border-stone-300 bg-white px-2 py-1 text-right text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-500 dark:bg-stone-600 dark:text-stone-100"
                      />
                      <span className="text-sm text-stone-500 dark:text-stone-400">%</span>
                    </div>
                    <button
                      onClick={() => removeEO(e.oil.id)}
                      className="text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400"
                      aria-label={`Remove ${e.oil.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search mode */}
            {selectedEOs.length < 5 && eoMode === 'search' && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or botanical name…"
                  value={eoSearch}
                  onChange={(e) => setEoSearch(e.target.value)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
                />
                {eoSearch && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-600 dark:bg-stone-800">
                    {filteredEOs.slice(0, 8).map((eo) => {
                      const unsafe = isUnsafeWithCurrent(eo)
                      return (
                        <button
                          key={eo.id}
                          onClick={() => !unsafe && addEO(eo)}
                          disabled={!!unsafe}
                          title={unsafe ? `Cannot add: ${unsafe.reason}` : eo.description}
                          className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                            unsafe
                              ? 'cursor-not-allowed bg-red-50 text-red-400 dark:bg-red-950/50 dark:text-red-500'
                              : 'text-stone-800 hover:bg-amber-50 dark:text-stone-200 dark:hover:bg-amber-950/30'
                          }`}
                        >
                          <div>
                            <span className="font-medium">{eo.name}</span>
                            <span className="ml-2 text-xs italic text-stone-400 dark:text-stone-500">{eo.botanicalName}</span>
                          </div>
                          {unsafe ? (
                            <span className="text-xs text-red-500">🚫 Unsafe</span>
                          ) : (
                            <span className="text-xs text-stone-400 dark:text-stone-500">{eo.aroma}</span>
                          )}
                        </button>
                      )
                    })}
                    {filteredEOs.length === 0 && (
                      <p className="px-3 py-2.5 text-sm text-stone-400 dark:text-stone-500">No oils found.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Browse mode */}
            {selectedEOs.length < 5 && eoMode === 'browse' && (
              <div>
                <input
                  type="text"
                  placeholder="Filter…"
                  value={eoSearch}
                  onChange={(e) => setEoSearch(e.target.value)}
                  className="mb-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filteredEOs.map((eo) => {
                    const unsafe = isUnsafeWithCurrent(eo)
                    return (
                      <button
                        key={eo.id}
                        onClick={() => !unsafe && addEO(eo)}
                        disabled={!!unsafe}
                        title={unsafe ? `Cannot add: ${unsafe.reason}` : undefined}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          unsafe
                            ? 'cursor-not-allowed border-red-100 bg-red-50/50 opacity-60 dark:border-red-900 dark:bg-red-950/20'
                            : 'border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 dark:border-stone-600 dark:bg-stone-700 dark:hover:border-amber-500 dark:hover:bg-amber-950/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-800 dark:text-stone-100">{eo.name}</p>
                            <p className="text-xs italic text-stone-400 dark:text-stone-500">{eo.botanicalName}</p>
                          </div>
                          {unsafe && <span className="shrink-0 text-xs text-red-500">🚫</span>}
                        </div>
                        <p className="mt-1 text-xs text-stone-500 italic dark:text-stone-400">{eo.aroma}</p>
                        <ul className="mt-1.5 space-y-0.5">
                          {eo.benefits.slice(0, 2).map((b, i) => (
                            <li key={i} className="text-xs text-stone-500 dark:text-stone-400">• {b}</li>
                          ))}
                        </ul>
                      </button>
                    )
                  })}
                  {filteredEOs.length === 0 && (
                    <p className="col-span-2 py-4 text-center text-sm text-stone-400 dark:text-stone-500">No oils available.</p>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Step 3: Volume & Dilution */}
        <Card>
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">3. Volume &amp; Dilution</h2>
          </CardHeader>
          <CardBody className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">Total volume</p>
              <div className="flex flex-wrap gap-2">
                {VOLUME_PRESETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => { setTotalVolumeMl(v); setCustomVolume('') }}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-all ${
                      totalVolumeMl === v && !customVolume
                        ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-stone-200 text-stone-600 hover:border-amber-300 dark:border-stone-600 dark:text-stone-300 dark:hover:border-amber-500'
                    }`}
                  >
                    {v} ml
                  </button>
                ))}
                <input
                  type="number"
                  placeholder="Custom ml"
                  value={customVolume}
                  min={5}
                  max={500}
                  onChange={(e) => {
                    setCustomVolume(e.target.value)
                    const v = parseInt(e.target.value)
                    if (v >= 5) setTotalVolumeMl(v)
                  }}
                  className="w-24 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">Dilution rate</p>
              <div className="flex flex-wrap gap-2">
                {DILUTION_PRESETS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDilutionRate(d.value)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-all ${
                      dilutionRate === d.value
                        ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-stone-200 text-stone-600 hover:border-amber-300 dark:border-stone-600 dark:text-stone-300 dark:hover:border-amber-500'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
                {(dilutionRate * 100).toFixed(0)}% dilution → {calc.essentialOilTotalMl.toFixed(2)} ml essential oils in {calc.carrierVolumeMl.toFixed(2)} ml carrier
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Quantity table */}
        {calc.ingredients.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Quantities</h2>
            </CardHeader>
            <CardBody className="p-0">
              <QuantityTable ingredients={calc.ingredients} totalVolumeMl={totalVolumeMl} />
            </CardBody>
          </Card>
        )}

        {calc.warnings.map((w, i) => (
          <Alert key={i} variant="caution">{w}</Alert>
        ))}
      </div>

      {/* Right column: compatibility + save */}
      <div className="space-y-6">
        <Card className="sticky top-20">
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Compatibility</h2>
          </CardHeader>
          <CardBody className="space-y-5">
            <CompatibilityPanel grade={score.grade} summary={score.summary} pairings={pairings} />

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

            <div className="space-y-3 border-t border-stone-100 pt-4 dark:border-stone-700">
              <Input
                label="Name your blend"
                placeholder="e.g. Evening Calm"
                value={blendName}
                onChange={(e) => setBlendName(e.target.value)}
              />

              {saveError && <Alert variant="unsafe">{saveError}</Alert>}

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? 'Saving…' : 'Save & Get Recipe Card'}
              </Button>

              {!carrier && (
                <p className="text-center text-xs text-stone-400 dark:text-stone-500">Choose a carrier oil to get started.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
