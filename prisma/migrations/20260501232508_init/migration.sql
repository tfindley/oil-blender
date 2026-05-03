-- CreateEnum
CREATE TYPE "OilType" AS ENUM ('ESSENTIAL', 'CARRIER');

-- CreateEnum
CREATE TYPE "PairingRating" AS ENUM ('EXCELLENT', 'GOOD', 'CAUTION', 'AVOID', 'UNSAFE');

-- CreateTable
CREATE TABLE "Oil" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "botanicalName" TEXT NOT NULL,
    "type" "OilType" NOT NULL,
    "origin" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benefits" TEXT[],
    "contraindications" TEXT[],
    "aroma" TEXT NOT NULL,
    "consistency" TEXT,
    "absorbency" TEXT,
    "shelfLifeMonths" INTEGER,
    "dilutionRateMax" DOUBLE PRECISION,
    "buyUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OilPairing" (
    "id" TEXT NOT NULL,
    "oilAId" TEXT NOT NULL,
    "oilBId" TEXT NOT NULL,
    "rating" "PairingRating" NOT NULL DEFAULT 'GOOD',
    "reason" TEXT NOT NULL,

    CONSTRAINT "OilPairing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blend" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalVolumeMl" DOUBLE PRECISION NOT NULL,
    "dilutionRate" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT,
    "notes" TEXT,
    "grade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlendIngredient" (
    "id" TEXT NOT NULL,
    "blendId" TEXT NOT NULL,
    "oilId" TEXT NOT NULL,
    "percentagePct" DOUBLE PRECISION NOT NULL,
    "volumeMl" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BlendIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Oil_name_key" ON "Oil"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OilPairing_oilAId_oilBId_key" ON "OilPairing"("oilAId", "oilBId");

-- CreateIndex
CREATE UNIQUE INDEX "BlendIngredient_blendId_oilId_key" ON "BlendIngredient"("blendId", "oilId");

-- AddForeignKey
ALTER TABLE "OilPairing" ADD CONSTRAINT "OilPairing_oilAId_fkey" FOREIGN KEY ("oilAId") REFERENCES "Oil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OilPairing" ADD CONSTRAINT "OilPairing_oilBId_fkey" FOREIGN KEY ("oilBId") REFERENCES "Oil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlendIngredient" ADD CONSTRAINT "BlendIngredient_blendId_fkey" FOREIGN KEY ("blendId") REFERENCES "Blend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlendIngredient" ADD CONSTRAINT "BlendIngredient_oilId_fkey" FOREIGN KEY ("oilId") REFERENCES "Oil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
