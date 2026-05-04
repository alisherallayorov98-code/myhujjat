-- Shablon javobgarlik tizimi: foydalanuvchi shablonni ishlatishdan oldin
-- disclaimer'ni qabul qilishi DB'da yoziladi (sud uchun isbot)

-- CreateEnum
CREATE TYPE "UserTemplateSource" AS ENUM ('CUSTOM', 'WORD_UPLOAD', 'PASTE', 'CLONED', 'EDITED');

-- CreateTable
CREATE TABLE "TemplateAcknowledgement" (
    "id"                TEXT NOT NULL,
    "userId"            TEXT NOT NULL,
    "templateRef"       TEXT NOT NULL,
    "disclaimerVersion" TEXT NOT NULL,
    "ipAddress"         TEXT,
    "userAgent"         TEXT,
    "acceptedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemplateAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateAcknowledgement_userId_templateRef_idx" ON "TemplateAcknowledgement"("userId", "templateRef");
CREATE INDEX "TemplateAcknowledgement_acceptedAt_idx" ON "TemplateAcknowledgement"("acceptedAt");

-- AddForeignKey
ALTER TABLE "TemplateAcknowledgement" ADD CONSTRAINT "TemplateAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "UserTemplate" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "contractType"   "ContractType",
    "source"         "UserTemplateSource" NOT NULL DEFAULT 'CUSTOM',
    "baseTemplateId" TEXT,
    "blocks"         JSONB NOT NULL DEFAULT '[]',
    "rawContent"     TEXT,
    "versionHistory" JSONB NOT NULL DEFAULT '[]',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTemplate_organizationId_idx" ON "UserTemplate"("organizationId");
CREATE INDEX "UserTemplate_userId_idx" ON "UserTemplate"("userId");

-- AddForeignKey
ALTER TABLE "UserTemplate" ADD CONSTRAINT "UserTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTemplate" ADD CONSTRAINT "UserTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
