CREATE TYPE "JobLineTaxTreatment" AS ENUM ('UNCONFIRMED', 'VAT_STANDARD', 'VAT_REDUCED', 'ZERO_RATED', 'EXEMPT', 'KLEINUNTERNEHMER');
CREATE TYPE "CataloguePriceMode" AS ENUM ('FIXED', 'FROM', 'HOURLY', 'MONTHLY', 'PERCENTAGE', 'MANUAL');

CREATE TABLE "ServiceJobLineItem" (
  "id" TEXT NOT NULL,
  "serviceJobId" TEXT NOT NULL,
  "cataloguePriceItemId" TEXT,
  "serviceName" TEXT NOT NULL,
  "description" TEXT,
  "quantity" DECIMAL(12,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "cataloguePriceText" TEXT,
  "catalogueUnitPrice" DECIMAL(12,2),
  "cataloguePriceMode" "CataloguePriceMode" NOT NULL DEFAULT 'MANUAL',
  "priceConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "agreedUnitPrice" DECIMAL(12,2) NOT NULL,
  "taxTreatment" "JobLineTaxTreatment" NOT NULL DEFAULT 'UNCONFIRMED',
  "taxRate" DECIMAL(5,2),
  "subtotal" DECIMAL(14,2) NOT NULL,
  "taxAmount" DECIMAL(14,2),
  "total" DECIMAL(14,2) NOT NULL,
  "internalUnitCost" DECIMAL(12,2),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceJobLineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceJobLineItem_serviceJobId_sortOrder_idx" ON "ServiceJobLineItem"("serviceJobId", "sortOrder");
CREATE INDEX "ServiceJobLineItem_cataloguePriceItemId_idx" ON "ServiceJobLineItem"("cataloguePriceItemId");
ALTER TABLE "ServiceJobLineItem" ADD CONSTRAINT "ServiceJobLineItem_serviceJobId_fkey" FOREIGN KEY ("serviceJobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobLineItem" ADD CONSTRAINT "ServiceJobLineItem_cataloguePriceItemId_fkey" FOREIGN KEY ("cataloguePriceItemId") REFERENCES "PriceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
