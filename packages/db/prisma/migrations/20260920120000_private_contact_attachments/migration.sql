-- Additive migration only. Apply after owner review; never part of a build.
CREATE TABLE "ContactAttachment" (
  "id" TEXT NOT NULL, "messageId" TEXT NOT NULL, "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL, "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL, "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContactAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ContactAttachment_messageId_idx" ON "ContactAttachment"("messageId");
CREATE TABLE "ContactRateLimit" (
  "key" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactRateLimit_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "ContactRateLimit_expiresAt_idx" ON "ContactRateLimit"("expiresAt");
