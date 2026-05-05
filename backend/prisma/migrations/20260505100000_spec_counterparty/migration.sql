-- Spesifikatsiyaga kontragent biriktirish
-- Avval bu maydon yo'q edi — endi spesifikatsiya kontragent rekvizitlari
-- bilan birga eksport qilinishi mumkin (NARXNI KELISHISH PROTOKOLI uslubida)

ALTER TABLE "Specification" ADD COLUMN "counterpartyId" TEXT;

-- Foreign key (kontragent o'chirilsa, specification.counterpartyId = NULL bo'ladi)
ALTER TABLE "Specification"
  ADD CONSTRAINT "Specification_counterpartyId_fkey"
  FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Multi-tenant filter uchun index (organizationId + counterpartyId)
CREATE INDEX "Specification_organizationId_counterpartyId_idx"
  ON "Specification"("organizationId", "counterpartyId");
