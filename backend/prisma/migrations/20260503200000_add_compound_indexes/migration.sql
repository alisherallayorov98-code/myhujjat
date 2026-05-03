-- Compound indekslar — yuqori yuklanish ostida tezligi uchun

-- Counterparty: STIR bo'yicha lookup (bulk-send execute uchun)
CREATE INDEX IF NOT EXISTS "Counterparty_organizationId_inn_idx" ON "Counterparty"("organizationId", "inn");

-- Contract: dashboard filtri (turi + status birga)
CREATE INDEX IF NOT EXISTS "Contract_organizationId_contractType_status_idx" ON "Contract"("organizationId", "contractType", "status");

-- Subscription: cron jobs uchun (expiresAt + status)
CREATE INDEX IF NOT EXISTS "Subscription_expiresAt_status_idx" ON "Subscription"("expiresAt", "status");
CREATE INDEX IF NOT EXISTS "Subscription_plan_status_idx" ON "Subscription"("plan", "status");

-- AuditLog: foydalanuvchi tarixi va action filtri
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- Decimal precision aniqlash (yaxlitlanish xatolarini oldini olish)
-- 20 raqam, 2 kasr — UZS uchun max 999 trln. so'm
ALTER TABLE "Payment"     ALTER COLUMN "amount"        TYPE DECIMAL(20, 2);
ALTER TABLE "Contract"    ALTER COLUMN "amount"        TYPE DECIMAL(20, 2);
ALTER TABLE "Contract"    ALTER COLUMN "qqsRate"       TYPE DECIMAL(5, 2);
ALTER TABLE "Contract"    ALTER COLUMN "totalInvoiced" TYPE DECIMAL(20, 2);
ALTER TABLE "Tasischi"    ALTER COLUMN "ulush"         TYPE DECIMAL(5, 2);
ALTER TABLE "Tasischi"    ALTER COLUMN "summa"         TYPE DECIMAL(20, 2);
ALTER TABLE "Invoice"     ALTER COLUMN "amount"        TYPE DECIMAL(20, 2);
ALTER TABLE "Invoice"     ALTER COLUMN "vatAmount"     TYPE DECIMAL(20, 2);
ALTER TABLE "Invoice"     ALTER COLUMN "totalAmount"   TYPE DECIMAL(20, 2);
