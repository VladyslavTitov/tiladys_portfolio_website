-- Nullable service-detail preselection; original messages are never rewritten.
ALTER TABLE "ContactMessage" ADD COLUMN "requestDetail" TEXT;
