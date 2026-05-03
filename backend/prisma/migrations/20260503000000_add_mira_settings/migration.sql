-- CreateTable
CREATE TABLE "MiraSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultContractType" TEXT NOT NULL DEFAULT 'OLDI_SOTDI',
    "defaultAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "defaultCity" TEXT NOT NULL DEFAULT 'Toshkent',
    "defaultProductName" VARCHAR(500),
    "defaultPaymentDays" INTEGER NOT NULL DEFAULT 10,
    "numberingScheme" TEXT NOT NULL DEFAULT 'date-seq',
    "customPrefix" VARCHAR(20),
    "lastCounter" INTEGER NOT NULL DEFAULT 0,
    "lastDateNumber" TEXT,
    "autoSendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoSignEnabled" BOOLEAN NOT NULL DEFAULT false,
    "confirmationThreshold" DECIMAL(20,2),
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "MiraSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MiraSettings_userId_key" ON "MiraSettings"("userId");

-- CreateIndex
CREATE INDEX "MiraSettings_organizationId_idx" ON "MiraSettings"("organizationId");

-- AddForeignKey
ALTER TABLE "MiraSettings" ADD CONSTRAINT "MiraSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiraSettings" ADD CONSTRAINT "MiraSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
