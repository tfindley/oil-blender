'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { OilSummary, PairingRating, BlendGrade } from '@/types'
import { calculateBlend } from '@/lib/blend-calculator'
import { scoreBlend } from '@/lib/blend-scorer'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { CompatibilityPanel } from './CompatibilityPanel'
import { QuantityTable } from './QuantityTable'

const VOLUME_PRESETS = [10, 30, 50, 100, 200]
const DILUTION_PRESETS = [
  { label: '1%', sublabel: 'sensitive', value: 0.01 },
  { label: '2%', sublabel: 'daily', value: 0.02 },
  { label: '3%', sublabel: 'therapeutic', value: 0.03 },
  { label: '5%', sublabel: 'targeted', value: 0.05 },
]

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
  const [eoInputMode, setEoInputMode] = useState<'pct' | 'drops'>('pct')
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

  const carrierSubtitle =
    openSection === 1 ? 'The base that delivers the blend to your skin. Pick one or more.'
    : selectedCarriers.length === 0 ? 'None selected'
    : selectedCarriers.length <= 2 ? selectedCarriers.map((c) => c.oil.name).join(' + ')
    : `${selectedCarriers.length} carriers`

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
    setEoInputMode('pct')
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

  function addCarrier(oil: OilSummary) {
    if (selectedCarriers.some((c) => c.oil.id === oil.id)) return
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
    setEoSearch('')
    setAvoidAcknowledged(false)
    if (eoInputMode === 'drops') {
      const pct = (1 / 20 / totalVolumeMl) * 100
      const newEOs = [...selectedEOs, { oil, percentagePct: pct }]
      setSelectedEOs(newEOs)
      setDilutionRate(newEOs.reduce((s, e) => s + e.percentagePct, 0) / 100)
    } else {
      const newCount = selectedEOs.length + 1
      const pctEach = (dilutionRate * 100) / newCount
      setSelectedEOs([
        ...selectedEOs.map((e) => ({ ...e, percentagePct: pctEach })),
        { oil, percentagePct: pctEach },
      ])
    }
  }

  function removeEO(id: string) {
    setAvoidAcknowledged(false)
    const next = selectedEOs.filter((e) => e.oil.id !== id)
    if (eoInputMode === 'drops') {
      setSelectedEOs(next)
      setDilutionRate(Math.max(0.001, next.reduce((s, e) => s + e.percentagePct, 0) / 100))
    } else if (next.length > 0) {
      const pctEach = (dilutionRate * 100) / next.length
      setSelectedEOs(next.map((e) => ({ ...e, percentagePct: pctEach })))
    } else {
      setSelectedEOs([])
    }
  }

  function updatePct(id: string, pct: number) {
    setSelectedEOs(selectedEOs.map((e) => (e.oil.id === id ? { ...e, percentagePct: pct } : e)))
  }

  function updateDrops(id: string, drops: number) {
    const pct = (Math.max(1, drops) / 20 / totalVolumeMl) * 100
    const newEOs = selectedEOs.map((e) => (e.oil.id === id ? { ...e, percentagePct: pct } : e))
    setSelectedEOs(newEOs)
    setDilutionRate(Math.max(0.001, newEOs.reduce((s, e) => s + e.percentagePct, 0) / 100))
  }

  function normalizePercentages() {
    const sum = selectedEOs.reduce((s, e) => s + e.percentagePct, 0)
    const target = dilutionRate * 100
    if (sum <= 0) {
      const pctEach = target / selectedEOs.length
      setSelectedEOs(selectedEOs.map((e) => ({ ...e, percentagePct: pctEach })))
    } else {
      setSelectedEOs(selectedEOs.map((e) => ({ ...e, percentagePct: (e.percentagePct / sum) * target })))
    }
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

  const filteredCarriers = carriers.filter(
    (c) =>
      !carrierSearch ||
      c.name.toLowerCase().includes(carrierSearch.toLowerCase()) ||
      (c.botanicalName ?? '').toLowerCase().includes(carrierSearch.toLowerCase())
  )

  const availableEOs = essentials.filter((e) => !selectedEOs.some((s) => s.oil.id === e.id))
  const filteredEOs = availableEOs.filter(
    (e) =>
      !eoSearch ||
      e.name.toLowerCase().includes(eoSearch.toLowerCase()) ||
      (e.botanicalName ?? '').toLowerCase().includes(eoSearch.toLowerCase())
  )

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
        <Card>
          <CardHeader>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setOpenSection(1)}
            >
              <div>
                <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">1. Choose Your Carrier Oils</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {carrierSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {openSection === 1 && (
                  <div className="flex rounded-md border border-stone-200 text-xs dark:border-stone-600">
                    <button
                      onClick={() => setCarrierMode('search')}
                      className={`px-3 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md ${
                        carrierMode === 'search'
                          ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                          : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-700'
                      }`}
                    >
                      Search
                    </button>
                    <button
                      onClick={() => setCarrierMode('browse')}
                      className={`px-3 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md ${
                        carrierMode === 'browse'
                          ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                          : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-700'
                      }`}
                    >
                      Browse
                    </button>
                  </div>
                )}
                <span className="text-stone-400 dark:text-stone-500">{openSection === 1 ? '▲' : '▼'}</span>
              </div>
            </div>
          </CardHeader>
          {openSection === 1 && (
            <CardBody>
              {/* Search mode */}
              {carrierMode === 'search' && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or botanical name…"
                    value={carrierSearch}
                    onChange={(e) => setCarrierSearch(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
                  />
                  {carrierSearch && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-600 dark:bg-stone-800">
                      {filteredCarriers.slice(0, 8).map((c) => {
                        const isSelected = selectedCarriers.some((s) => s.oil.id === c.id)
                        const unsafe = !isSelected ? findUnsafePairing(c) : undefined
                        return (
                          <button
                            key={c.id}
                            onClick={() => !unsafe && (isSelected ? removeCarrier(c.id) : addCarrier(c))}
                            disabled={!!unsafe}
                            title={unsafe ? `Cannot add: ${unsafe.reason}` : c.description}
                            className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                              unsafe
                                ? 'cursor-not-allowed bg-red-50 text-red-400 dark:bg-red-950/50 dark:text-red-500'
                                : isSelected
                                  ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                                  : 'text-stone-800 hover:bg-amber-50 dark:text-stone-200 dark:hover:bg-amber-950/30'
                            }`}
                          >
                            <div>
                              <span className="font-medium">{c.name}</span>
                              <span className="ml-2 text-xs italic text-stone-400 dark:text-stone-500">{c.botanicalName}</span>
                            </div>
                            {unsafe ? (
                              <span className="text-xs text-red-500">🚫 Unsafe</span>
                            ) : isSelected ? (
                              <span className="text-xs text-amber-700 dark:text-amber-400">✓ Selected</span>
                            ) : (
                              <span className="text-xs text-stone-400 dark:text-stone-500">{c.aroma}</span>
                            )}
                          </button>
                        )
                      })}
                      {filteredCarriers.length === 0 && (
                        <p className="px-3 py-2.5 text-sm text-stone-400 dark:text-stone-500">No oils found.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Browse mode */}
              {carrierMode === 'browse' && (
                <div>
                  <input
                    type="text"
                    placeholder="Filter…"
                    value={carrierSearch}
                    onChange={(e) => setCarrierSearch(e.target.value)}
                    className="mb-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {filteredCarriers.map((c) => {
                      const isSelected = selectedCarriers.some((s) => s.oil.id === c.id)
                      const unsafe = !isSelected ? findUnsafePairing(c) : undefined
                      return (
                        <button
                          key={c.id}
                          onClick={() => !unsafe && (isSelected ? removeCarrier(c.id) : addCarrier(c))}
                          disabled={!!unsafe}
                          title={unsafe ? `Cannot add: ${unsafe.reason}` : undefined}
                          className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                            unsafe
                              ? 'cursor-not-allowed border-red-100 bg-red-50/50 opacity-60 dark:border-red-900 dark:bg-red-950/20'
                              : isSelected
                                ? 'border-amber-500 bg-amber-50 dark:border-amber-500 dark:bg-amber-950'
                                : 'border-stone-200 bg-white hover:bg-amber-50/40 dark:border-stone-600 dark:bg-stone-700 dark:hover:bg-amber-950/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-stone-800 dark:text-stone-100">{c.name}</p>
                              <p className="text-xs italic text-stone-400 dark:text-stone-500">{c.botanicalName}</p>
                            </div>
                            {unsafe && <span className="shrink-0 text-xs text-red-500">🚫</span>}
                          </div>
                          <p className="mt-1 text-xs italic text-stone-500 dark:text-stone-400">{c.aroma}</p>
                          <ul className="mt-1.5 space-y-0.5">
                            {c.benefits.slice(0, 2).map((b, i) => (
                              <li key={i} className="text-xs text-stone-500 dark:text-stone-400">• {b}</li>
                            ))}
                          </ul>
                        </button>
                      )
                    })}
                    {filteredCarriers.length === 0 && (
                      <p className="col-span-2 py-4 text-center text-sm text-stone-400 dark:text-stone-500">No oils found.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setOpenSection(2)}
                  disabled={selectedCarriers.length === 0}
                  className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </CardBody>
          )}
        </Card>

        {/* Step 2: Essential Oil picker */}
        <Card>
          <CardHeader>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setOpenSection(2)}
            >
              <div>
                <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">2. Add Essential Oils</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {openSection === 2
                    ? (selectedEOs.length < 5 ? 'Select up to 5 essential oils.' : 'Maximum 5 oils reached.')
                    : (selectedEOs.length > 0 ? `${selectedEOs.length} oil${selectedEOs.length === 1 ? '' : 's'} selected` : 'None selected')}
                </p>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {openSection === 2 && selectedEOs.length < 5 && (
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
                <span className="text-stone-400 dark:text-stone-500">{openSection === 2 ? '▲' : '▼'}</span>
              </div>
            </div>
          </CardHeader>
          {openSection === 2 && <CardBody className="space-y-3">
            {selectedEOs.length >= 5 && (
              <p className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-500 dark:bg-stone-700 dark:text-stone-400">
                You have 5 essential oils — remove one from your blend to add another.
              </p>
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
                      const unsafe = findUnsafePairing(eo)
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
                    const unsafe = findUnsafePairing(eo)
                    return (
                      <button
                        key={eo.id}
                        onClick={() => !unsafe && addEO(eo)}
                        disabled={!!unsafe}
                        title={unsafe ? `Cannot add: ${unsafe.reason}` : undefined}
                        className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                          unsafe
                            ? 'cursor-not-allowed border-red-100 bg-red-50/50 opacity-60 dark:border-red-900 dark:bg-red-950/20'
                            : 'border-stone-200 bg-white hover:bg-amber-50/40 dark:border-stone-600 dark:bg-stone-700 dark:hover:bg-amber-950/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-stone-800 dark:text-stone-100">{eo.name}</p>
                            <p className="text-xs italic text-stone-400 dark:text-stone-500">{eo.botanicalName}</p>
                          </div>
                          {unsafe && <span className="shrink-0 text-xs text-red-500">🚫</span>}
                        </div>
                        <p className="mt-1 text-xs italic text-stone-500 dark:text-stone-400">{eo.aroma}</p>
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
          </CardBody>}
        </Card>

        {/* Quantities — full-width so table columns have room */}
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

      {/* ── Right column: live blend summary ── */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-0.5">

        {/* Blend composition */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Your Blend</h2>
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

            {/* Carriers */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Carrier Oils {selectedCarriers.length > 1 && `(${selectedCarriers.length})`}
              </p>
              {selectedCarriers.length === 0 ? (
                <p className="text-sm italic text-stone-400 dark:text-stone-500">None selected</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedCarriers.map((c) => (
                    <div key={c.oil.id} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/40">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{c.oil.name}</span>
                        <span className="ml-1.5 text-[10px] italic text-amber-600 dark:text-amber-500">{c.oil.botanicalName}</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        step={1}
                        value={Math.round(c.volumeMl)}
                        onChange={(ev) => updateCarrierMl(c.oil.id, parseFloat(ev.target.value) || 0)}
                        className="w-16 rounded border border-amber-300 bg-white px-1.5 py-1.5 text-right text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
                      />
                      <span className="text-xs text-amber-600 dark:text-amber-500">ml</span>
                      <button
                        onClick={() => removeCarrier(c.oil.id)}
                        className="-mr-1 rounded-full p-1.5 text-amber-400 hover:bg-red-50 hover:text-red-500 dark:text-amber-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        aria-label={`Remove ${c.oil.name}`}
                      >
                        ✕
                      </button>
                    </div>
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
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Essential Oils {selectedEOs.length > 0 && `(${selectedEOs.length}/5)`}
                </p>
                {selectedEOs.length > 0 && (
                  <button
                    onClick={() => setEoInputMode((m) => m === 'pct' ? 'drops' : 'pct')}
                    className="relative flex h-8 w-28 shrink-0 items-center rounded-full bg-stone-100 p-0.5 text-xs font-medium dark:bg-stone-700"
                    aria-label={`Switch to ${eoInputMode === 'pct' ? 'drops' : 'percentage'} input`}
                  >
                    <span
                      aria-hidden
                      className={`absolute inset-y-0.5 rounded-full bg-amber-700 transition-all duration-200 ${
                        eoInputMode === 'pct' ? 'left-0.5 right-[50%]' : 'left-[50%] right-0.5'
                      }`}
                    />
                    <span className={`relative z-10 flex-1 text-center transition-colors ${eoInputMode === 'pct' ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`}>%</span>
                    <span className={`relative z-10 flex-1 text-center transition-colors ${eoInputMode === 'drops' ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`}>drops</span>
                  </button>
                )}
              </div>
              {selectedEOs.length === 0 ? (
                <p className="text-sm italic text-stone-400 dark:text-stone-500">None selected</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedEOs.map((e) => {
                    const dropCount = Math.round(e.percentagePct / 100 * totalVolumeMl * 20)
                    return (
                      <div key={e.oil.id} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-600 dark:bg-stone-700">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{e.oil.name}</span>
                          <span className="ml-1.5 text-[10px] italic text-stone-400 dark:text-stone-500">{e.oil.botanicalName}</span>
                        </div>
                        {eoInputMode === 'pct' ? (
                          <>
                            <input
                              type="number"
                              min={0.1}
                              max={5}
                              step={0.1}
                              value={e.percentagePct.toFixed(1)}
                              onChange={(ev) => updatePct(e.oil.id, parseFloat(ev.target.value) || 0)}
                              className="w-14 rounded border border-stone-300 bg-white px-1.5 py-1.5 text-right text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-500 dark:bg-stone-600 dark:text-stone-100"
                            />
                            <span className="text-xs text-stone-400 dark:text-stone-500">%</span>
                          </>
                        ) : (
                          <>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              step={1}
                              value={dropCount}
                              onChange={(ev) => updateDrops(e.oil.id, parseInt(ev.target.value, 10) || 1)}
                              className="w-14 rounded border border-stone-300 bg-white px-1.5 py-1.5 text-right text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-500 dark:bg-stone-600 dark:text-stone-100"
                            />
                            <span className="text-xs text-stone-400 dark:text-stone-500">drops</span>
                          </>
                        )}
                        <button
                          onClick={() => removeEO(e.oil.id)}
                          className="-mr-1 rounded-full p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          aria-label={`Remove ${e.oil.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              {eoInputMode === 'pct' && selectedEOs.length > 0 && Math.abs(selectedEOs.reduce((s, e) => s + e.percentagePct, 0) - dilutionRate * 100) > 0.1 && (
                <button
                  onClick={normalizePercentages}
                  className="mt-1 inline-block py-1 text-xs text-amber-700 hover:underline dark:text-amber-500"
                >
                  Percentages don't sum to {(dilutionRate * 100).toFixed(1)}% — normalize
                </button>
              )}
              {eoInputMode === 'drops' && selectedEOs.length > 0 && (
                <p className="mt-1.5 text-[10px] text-stone-400 dark:text-stone-500">
                  Dilution set automatically from drops (1 ml = 20 drops)
                </p>
              )}
            </div>

            {/* Volume */}
            <div className="border-t border-stone-100 pt-3 dark:border-stone-700">
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
              <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
                Final mix: {calc.finalVolumeMl.toFixed(1)} ml
                ({calc.carrierVolumeMl.toFixed(1)} ml carrier + {calc.essentialOilTotalMl.toFixed(1)} ml essentials)
              </p>
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
            </div>

          </CardBody>
        </Card>

        {/* Compatibility + save */}
        <Card>
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Compatibility</h2>
          </CardHeader>
          <CardBody className="space-y-5">
            {hasBlend && <CompatibilityPanel grade={score.grade} summary={score.summary} pairings={pairings} />}

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
                <p className="text-center text-xs text-stone-400 dark:text-stone-500">Choose a carrier oil to get started.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
