-- LegalCase: yurist bo'limi ish jarayonlari
CREATE TABLE "LegalCase" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "counterpartyId" TEXT,
  "title"          TEXT NOT NULL,
  "type"           TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'OPEN',
  "amount"         DOUBLE PRECISION,
  "deadline"       TIMESTAMP(3),
  "notes"          TEXT,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalCase_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LegalCase"
  ADD CONSTRAINT "LegalCase_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LegalCase"
  ADD CONSTRAINT "LegalCase_counterpartyId_fkey"
  FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "LegalCase_organizationId_idx"         ON "LegalCase"("organizationId");
CREATE INDEX "LegalCase_organizationId_status_idx"  ON "LegalCase"("organizationId", "status");
CREATE INDEX "LegalCase_organizationId_isActive_idx" ON "LegalCase"("organizationId", "isActive");

-- LegalDocument: ish ichidagi hujjatlar
CREATE TABLE "LegalDocument" (
  "id"        TEXT NOT NULL,
  "caseId"    TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LegalDocument"
  ADD CONSTRAINT "LegalDocument_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "LegalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LegalDocument_caseId_idx" ON "LegalDocument"("caseId");
