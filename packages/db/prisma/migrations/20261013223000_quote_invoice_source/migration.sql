-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "quoteRevisionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_quoteRevisionId_key" ON "Invoice"("quoteRevisionId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteRevisionId_fkey" FOREIGN KEY ("quoteRevisionId") REFERENCES "QuoteRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

