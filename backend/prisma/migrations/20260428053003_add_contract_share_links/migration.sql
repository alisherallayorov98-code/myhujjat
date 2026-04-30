-- CreateTable
CREATE TABLE "ContractShareLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "viewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "signedAt" TIMESTAMP(3),
    "signerName" TEXT,
    "signerEmail" TEXT,
    "signerIp" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractShareLink_token_key" ON "ContractShareLink"("token");

-- CreateIndex
CREATE INDEX "ContractShareLink_token_idx" ON "ContractShareLink"("token");

-- CreateIndex
CREATE INDEX "ContractShareLink_contractId_idx" ON "ContractShareLink"("contractId");

-- AddForeignKey
ALTER TABLE "ContractShareLink" ADD CONSTRAINT "ContractShareLink_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
