-- Prevent concurrent or repeated clicks from creating multiple active drafts
-- for the same saved service job. Cancelled and issued invoices remain historical.
CREATE UNIQUE INDEX "Invoice_serviceJobId_draft_key"
ON "Invoice"("serviceJobId")
WHERE "status" = 'DRAFT' AND "serviceJobId" IS NOT NULL;
