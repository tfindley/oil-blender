ALTER TABLE "Oil" ADD COLUMN "enrichedAt"      TIMESTAMP(3);
ALTER TABLE "Oil" ADD COLUMN "enrichmentModel" TEXT;

-- Existing oils already contain AI-enriched data (seed was AI-generated).
-- Mark them enriched so re-running bulk enrichment doesn't re-process them.
UPDATE "Oil" SET "enrichedAt" = NOW(), "enrichmentModel" = 'claude-sonnet-4-6'
WHERE "enrichedAt" IS NULL;
