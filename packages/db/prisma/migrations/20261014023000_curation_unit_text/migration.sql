ALTER TABLE "Project" ADD COLUMN "homepageFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PriceItem" ADD COLUMN "unitTranslations" JSONB;
