-- The previous migration (oil_enrichment_metadata) backfilled all existing
-- oils as enriched. This was incorrect for instances that seeded but never
-- ran enrichment. Reset to NULL so the admin panel accurately shows which
-- oils have actually been enriched via the Claude API.
UPDATE "Oil" SET "enrichedAt" = NULL, "enrichmentModel" = NULL;
