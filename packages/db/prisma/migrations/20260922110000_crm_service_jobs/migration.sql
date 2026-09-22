CREATE TYPE "CustomerType" AS ENUM ('PERSON', 'BUSINESS');
CREATE TYPE "CustomerStatus" AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "ServiceJobStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'COMPLETED', 'CANCELLED');
CREATE TYPE "FileAssetKind" AS ENUM ('BEFORE', 'DURING', 'AFTER', 'DOCUMENT', 'OTHER');
CREATE TYPE "FileAssetVisibility" AS ENUM ('PRIVATE');

CREATE TABLE "NumberSequence" (
  "scope" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "nextValue" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("scope", "year")
);

CREATE TABLE "Company" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT, "phone" TEXT,
  "street" TEXT, "postalCode" TEXT, "city" TEXT, "country" TEXT NOT NULL DEFAULT 'DE',
  "website" TEXT, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL, "customerNumber" TEXT NOT NULL, "type" "CustomerType" NOT NULL DEFAULT 'PERSON',
  "status" "CustomerStatus" NOT NULL DEFAULT 'LEAD', "firstName" TEXT, "lastName" TEXT,
  "companyId" TEXT, "email" TEXT, "phone" TEXT, "secondaryPhone" TEXT, "street" TEXT,
  "postalCode" TEXT, "city" TEXT, "country" TEXT NOT NULL DEFAULT 'DE',
  "preferredLanguage" TEXT NOT NULL DEFAULT 'de', "source" TEXT, "notes" TEXT,
  "archivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerNote" (
  "id" TEXT NOT NULL, "customerId" TEXT NOT NULL, "body" TEXT NOT NULL, "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerActivity" (
  "id" TEXT NOT NULL, "customerId" TEXT NOT NULL, "type" TEXT NOT NULL, "summary" TEXT NOT NULL,
  "metadata" JSONB, "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceJob" (
  "id" TEXT NOT NULL, "jobNumber" TEXT NOT NULL, "customerId" TEXT NOT NULL, "companyId" TEXT,
  "servicePriceItemId" TEXT, "serviceType" TEXT, "title" TEXT NOT NULL, "description" TEXT,
  "privateNotes" TEXT, "customerVisibleNotes" TEXT, "serviceDate" TIMESTAMP(3),
  "status" "ServiceJobStatus" NOT NULL DEFAULT 'PLANNED', "estimatedPrice" DECIMAL(12,2),
  "finalPrice" DECIMAL(12,2), "materialCost" DECIMAL(12,2), "otherCost" DECIMAL(12,2),
  "startTime" TIMESTAMP(3), "endTime" TIMESTAMP(3), "workDurationMinutes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FileAsset" (
  "id" TEXT NOT NULL, "customerId" TEXT, "serviceJobId" TEXT,
  "kind" "FileAssetKind" NOT NULL DEFAULT 'DOCUMENT',
  "visibility" "FileAssetVisibility" NOT NULL DEFAULT 'PRIVATE', "filename" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL,
  "storageProvider" TEXT NOT NULL, "storageKey" TEXT NOT NULL, "checksum" TEXT NOT NULL,
  "caption" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_customerNumber_key" ON "Customer"("customerNumber");
CREATE UNIQUE INDEX "ServiceJob_jobNumber_key" ON "ServiceJob"("jobNumber");
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "FileAsset"("storageKey");
CREATE INDEX "Company_name_idx" ON "Company"("name");
CREATE INDEX "Customer_status_updatedAt_idx" ON "Customer"("status", "updatedAt");
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE INDEX "Customer_lastName_firstName_idx" ON "Customer"("lastName", "firstName");
CREATE INDEX "CustomerNote_customerId_createdAt_idx" ON "CustomerNote"("customerId", "createdAt");
CREATE INDEX "CustomerActivity_customerId_createdAt_idx" ON "CustomerActivity"("customerId", "createdAt");
CREATE INDEX "ServiceJob_customerId_status_serviceDate_idx" ON "ServiceJob"("customerId", "status", "serviceDate");
CREATE INDEX "ServiceJob_companyId_idx" ON "ServiceJob"("companyId");
CREATE INDEX "ServiceJob_status_serviceDate_idx" ON "ServiceJob"("status", "serviceDate");
CREATE INDEX "FileAsset_customerId_createdAt_idx" ON "FileAsset"("customerId", "createdAt");
CREATE INDEX "FileAsset_serviceJobId_sortOrder_idx" ON "FileAsset"("serviceJobId", "sortOrder");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_servicePriceItemId_fkey" FOREIGN KEY ("servicePriceItemId") REFERENCES "PriceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_serviceJobId_fkey" FOREIGN KEY ("serviceJobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
