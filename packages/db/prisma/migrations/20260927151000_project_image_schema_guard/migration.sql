-- The original migration checked constraint names across every schema. A test or
-- tenant schema could therefore miss this FK when another schema had it already.
-- Preserve existing migrations and scope the repair to this table's OID.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProjectImage_projectId_fkey'
      AND conrelid = '"ProjectImage"'::regclass
  ) THEN
    ALTER TABLE "ProjectImage" ADD CONSTRAINT "ProjectImage_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
