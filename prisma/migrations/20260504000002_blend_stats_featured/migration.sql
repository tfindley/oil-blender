ALTER TABLE "Blend" ADD COLUMN "viewCount"       INTEGER   NOT NULL DEFAULT 0;
ALTER TABLE "Blend" ADD COLUMN "lastAccessedAt"  TIMESTAMP(3);
ALTER TABLE "Blend" ADD COLUMN "authorName"      TEXT;
ALTER TABLE "Blend" ADD COLUMN "about"           TEXT;
ALTER TABLE "Blend" ADD COLUMN "isFeatured"      BOOLEAN   NOT NULL DEFAULT false;
ALTER TABLE "Blend" ADD COLUMN "isPinned"        BOOLEAN   NOT NULL DEFAULT false;
ALTER TABLE "Blend" ADD COLUMN "isHidden"        BOOLEAN   NOT NULL DEFAULT false;
