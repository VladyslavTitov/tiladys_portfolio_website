-- AlterTable
ALTER TABLE "PriceItem" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "priceMode" "CataloguePriceMode",
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "unitPrice" DECIMAL(12,2);

