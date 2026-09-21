ALTER TABLE "Project"
  ADD COLUMN "seoTitle" JSONB,
  ADD COLUMN "seoDescription" JSONB,
  ADD COLUMN "socialTitle" JSONB,
  ADD COLUMN "socialDescription" JSONB,
  ADD COLUMN "socialImageId" TEXT;

ALTER TABLE "Project" ADD CONSTRAINT "Project_socialImageId_fkey"
  FOREIGN KEY ("socialImageId") REFERENCES "ProjectImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProjectSlugAlias" (
  "slug" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectSlugAlias_pkey" PRIMARY KEY ("slug"),
  CONSTRAINT "ProjectSlugAlias_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProjectSlugAlias_projectId_idx" ON "ProjectSlugAlias"("projectId");
