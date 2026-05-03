-- Template: yangi tarjima ustunlari
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "nameOz"    TEXT;
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "contentUz" TEXT;
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "contentOz" TEXT;
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "contentRu" TEXT;
