-- AlterTable
ALTER TABLE "BusinessBillingSettings" ADD COLUMN     "paymentInstructionsDe" TEXT,
ADD COLUMN     "taxStatementDe" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "documentVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "notesDe" TEXT,
ADD COLUMN     "paymentInstructionsDe" TEXT,
ADD COLUMN     "sellerTaxStatementDe" TEXT;

-- AlterTable
ALTER TABLE "InvoiceLine" ADD COLUMN     "billingPeriodFrom" TEXT,
ADD COLUMN     "billingPeriodTo" TEXT,
ADD COLUMN     "descriptionDe" TEXT,
ADD COLUMN     "priceConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceMode" "CataloguePriceMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "serviceNameDe" TEXT,
ADD COLUMN     "unitDe" TEXT;

-- AlterTable
ALTER TABLE "ServiceJobLineItem" ADD COLUMN     "billingPeriodFrom" TEXT,
ADD COLUMN     "billingPeriodTo" TEXT,
ADD COLUMN     "descriptionDe" TEXT,
ADD COLUMN     "serviceNameDe" TEXT,
ADD COLUMN     "unitDe" TEXT;

