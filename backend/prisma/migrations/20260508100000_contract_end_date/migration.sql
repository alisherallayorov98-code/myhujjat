-- AlterTable: shartnoma tugash sanasi (ixtiyoriy maydon)
ALTER TABLE "Contract" ADD COLUMN "endDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Contract_organizationId_endDate_idx" ON "Contract"("organizationId", "endDate");
