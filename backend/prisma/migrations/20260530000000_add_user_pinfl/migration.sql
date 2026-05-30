-- AlterTable: User modeliga pinfl (JSHSHIR) maydoni qo'shildi (E-IMZO login uchun)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pinfl" TEXT;

-- UniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_pinfl_key" ON "User"("pinfl");
