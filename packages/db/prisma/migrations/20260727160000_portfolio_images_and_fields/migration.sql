ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "type" JSONB,
  ADD COLUMN IF NOT EXISTS "role" JSONB,
  ADD COLUMN IF NOT EXISTS "workItems" JSONB;

CREATE TABLE IF NOT EXISTS "ProjectImage" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "alt" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectImage_projectId_sortOrder_idx"
  ON "ProjectImage"("projectId", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectImage_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectImage"
      ADD CONSTRAINT "ProjectImage_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
