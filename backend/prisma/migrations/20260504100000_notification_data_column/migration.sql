-- Notifications: data JSON ustuni (frontend tarjima parametrlari uchun)
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "data" JSONB;
