-- Pinned (yulduzcha) shartnomalar — eng muhimlarini yuqorida ko'rsatish.
-- Default false, eski shartnomalar pinned bo'lmaydi.

ALTER TABLE "Contract" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- Pinned shartnomalarni tezda topish uchun (bitta tashkilot ichida)
CREATE INDEX "Contract_organizationId_isPinned_isActive_idx"
  ON "Contract"("organizationId", "isPinned", "isActive");
