-- Forward-only: removes only the obsolete selection flag. No rows or media are touched.
ALTER TABLE "Project" DROP COLUMN "featured";
