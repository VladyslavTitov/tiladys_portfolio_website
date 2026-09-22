CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');
CREATE TYPE "BusinessTaxMode" AS ENUM ('UNCONFIRMED', 'VAT', 'KLEINUNTERNEHMER', 'EXEMPT');

CREATE TABLE "BusinessBillingSettings" (
  "id" TEXT NOT NULL DEFAULT 'default', "legalName" TEXT NOT NULL DEFAULT 'TiLADYS – Vladyslav Titov',
  "street" TEXT NOT NULL DEFAULT 'Kronenstraße 19', "postalCode" TEXT NOT NULL DEFAULT '45479',
  "city" TEXT NOT NULL DEFAULT 'Mülheim an der Ruhr', "country" TEXT NOT NULL DEFAULT 'Germany',
  "email" TEXT NOT NULL DEFAULT 'contact@tiladys.com', "phone" TEXT NOT NULL DEFAULT '+49 163 7235608',
  "taxMode" "BusinessTaxMode" NOT NULL DEFAULT 'UNCONFIRMED', "taxNumber" TEXT, "vatId" TEXT,
  "taxStatement" TEXT, "bankAccountHolder" TEXT, "iban" TEXT, "bic" TEXT, "bankName" TEXT,
  "paymentTermsDays" INTEGER, "paymentInstructions" TEXT, "settingsConfirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessBillingSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL, "invoiceNumber" TEXT, "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "customerId" TEXT NOT NULL, "serviceJobId" TEXT, "currency" TEXT NOT NULL DEFAULT 'EUR',
  "issueDate" TIMESTAMP(3), "dueDate" TIMESTAMP(3), "serviceDateFrom" TIMESTAMP(3), "serviceDateTo" TIMESTAMP(3),
  "sellerLegalName" TEXT NOT NULL, "sellerStreet" TEXT NOT NULL, "sellerPostalCode" TEXT NOT NULL,
  "sellerCity" TEXT NOT NULL, "sellerCountry" TEXT NOT NULL, "sellerEmail" TEXT NOT NULL, "sellerPhone" TEXT NOT NULL,
  "sellerTaxMode" "BusinessTaxMode" NOT NULL, "sellerTaxNumber" TEXT, "sellerVatId" TEXT, "sellerTaxStatement" TEXT,
  "sellerBankAccountHolder" TEXT, "sellerIban" TEXT, "sellerBic" TEXT, "sellerBankName" TEXT,
  "paymentTermsDays" INTEGER, "paymentInstructions" TEXT, "recipientName" TEXT NOT NULL,
  "recipientCompany" TEXT, "recipientEmail" TEXT, "recipientStreet" TEXT NOT NULL,
  "recipientPostalCode" TEXT NOT NULL, "recipientCity" TEXT NOT NULL, "recipientCountry" TEXT NOT NULL,
  "customerReference" TEXT, "notes" TEXT, "subtotal" DECIMAL(14,2) NOT NULL,
  "taxTotal" DECIMAL(14,2), "total" DECIMAL(14,2) NOT NULL, "issuedPdf" BYTEA,
  "issuedPdfChecksum" TEXT, "issuedPdfSize" INTEGER, "issuedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceLine" (
  "id" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "serviceName" TEXT NOT NULL, "description" TEXT,
  "quantity" DECIMAL(12,3) NOT NULL, "unit" TEXT NOT NULL, "unitPrice" DECIMAL(12,2) NOT NULL,
  "taxTreatment" "JobLineTaxTreatment" NOT NULL, "taxRate" DECIMAL(5,2), "subtotal" DECIMAL(14,2) NOT NULL,
  "taxAmount" DECIMAL(14,2), "total" DECIMAL(14,2) NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoicePayment" (
  "id" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "amount" DECIMAL(14,2) NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL, "method" TEXT, "reference" TEXT, "note" TEXT,
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_customerId_createdAt_idx" ON "Invoice"("customerId", "createdAt");
CREATE INDEX "Invoice_serviceJobId_idx" ON "Invoice"("serviceJobId");
CREATE INDEX "Invoice_status_issueDate_idx" ON "Invoice"("status", "issueDate");
CREATE INDEX "InvoiceLine_invoiceId_sortOrder_idx" ON "InvoiceLine"("invoiceId", "sortOrder");
CREATE INDEX "InvoicePayment_invoiceId_paidAt_idx" ON "InvoicePayment"("invoiceId", "paidAt");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_serviceJobId_fkey" FOREIGN KEY ("serviceJobId") REFERENCES "ServiceJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
