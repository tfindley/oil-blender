// Single source of truth for blend gating.
//
// Two separate questions:
//   - isScorable: should we render a compatibility grade? Any 2+ oils qualify.
//   - isSavable:  is the user allowed to persist this blend? Requires ≥1 carrier.
//
// EO-only blends score (so users see why a combination isn't recommended) but
// cannot be saved — massage practice always wants a carrier base. Carrier-only
// blends are fully supported (e.g. 50/50 jojoba + sweet almond).

export function isScorable(carrierCount: number, eoCount: number): boolean {
  return carrierCount + eoCount >= 2
}

export function isSavable(carrierCount: number, eoCount: number): boolean {
  return carrierCount >= 1 && carrierCount + eoCount >= 2
}
