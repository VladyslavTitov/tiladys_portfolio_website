-- Additive only. Do not infer billing ownership from mutable contacts or names.
ALTER TABLE "Invoice" ADD COLUMN "billingCompanyId" TEXT,
  ADD COLUMN "billingRecipientType" TEXT NOT NULL DEFAULT 'LEGACY';
ALTER TABLE "Invoice" ALTER COLUMN "billingRecipientType" SET DEFAULT 'INDIVIDUAL';
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billingCompanyId_fkey"
  FOREIGN KEY ("billingCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billing_recipient_check" CHECK (
  ("billingRecipientType" = 'COMPANY' AND "billingCompanyId" IS NOT NULL) OR
  ("billingRecipientType" IN ('INDIVIDUAL', 'LEGACY') AND "billingCompanyId" IS NULL)
);
CREATE INDEX "Invoice_billingCompanyId_createdAt_idx" ON "Invoice"("billingCompanyId", "createdAt");
