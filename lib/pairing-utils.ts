export function pairingKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

interface RawPairing {
  oilAId: string
  oilBId: string
  rating: string
  reason: string
}

export function buildPairingMap(
  pairings: RawPairing[],
): Record<string, { rating: string; reason: string }> {
  const map: Record<string, { rating: string; reason: string }> = {}
  for (const p of pairings) {
    map[pairingKey(p.oilAId, p.oilBId)] = { rating: p.rating, reason: p.reason }
  }
  return map
}
