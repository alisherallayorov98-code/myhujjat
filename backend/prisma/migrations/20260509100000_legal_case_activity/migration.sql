-- LegalCaseActivity: har bir ish bo'yicha aktivlik tarixi
CREATE TABLE "LegalCaseActivity" (
  "id"        TEXT         NOT NULL,
  "caseId"    TEXT         NOT NULL,
  "action"    TEXT         NOT NULL,
  "oldValue"  TEXT,
  "newValue"  TEXT,
  "note"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalCaseActivity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LegalCaseActivity"
  ADD CONSTRAINT "LegalCaseActivity_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "LegalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LegalCaseActivity_caseId_idx"           ON "LegalCaseActivity"("caseId");
CREATE INDEX "LegalCaseActivity_caseId_createdAt_idx" ON "LegalCaseActivity"("caseId", "createdAt");
