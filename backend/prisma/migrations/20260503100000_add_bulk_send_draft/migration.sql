-- CreateTable
CREATE TABLE "BulkSendDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "templateId" TEXT,
    "customContent" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'OLDI_SOTDI',
    "defaultAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "defaultProductName" VARCHAR(500),
    "city" TEXT NOT NULL DEFAULT 'Toshkent',
    "numberingMode" TEXT NOT NULL DEFAULT 'sequential',
    "startNumber" VARCHAR(50),
    "items" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkSendDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkSendDraft_organizationId_status_idx" ON "BulkSendDraft"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BulkSendDraft_userId_status_idx" ON "BulkSendDraft"("userId", "status");

-- AddForeignKey
ALTER TABLE "BulkSendDraft" ADD CONSTRAINT "BulkSendDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkSendDraft" ADD CONSTRAINT "BulkSendDraft_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
