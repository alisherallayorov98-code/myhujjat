-- AlterTable: Document ga employeeId ustuni qo'shish (nullable, backward compatible)
ALTER TABLE "Document" ADD COLUMN "employeeId" TEXT;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Document_organizationId_employeeId_idx" ON "Document"("organizationId", "employeeId");
