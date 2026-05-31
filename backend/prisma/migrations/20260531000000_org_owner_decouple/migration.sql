-- Tashkilotni yaratuvchi shaxsdan ajratish.
-- Maqsad: xodim (yaratuvchi akkaunt) o'chirilsa ham tashkilot va uning
-- barcha ma'lumotlari (shartnoma, faktura, hujjat) o'chib ketmasligi.
-- Egalik endi OrgMember.OWNER roli orqali boshqariladi va o'tkaziladi.

-- 1) Eski FK (ON DELETE CASCADE) ni olib tashlaymiz
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_userId_fkey";

-- 2) userId endi ixtiyoriy (yaratuvchi o'chsa NULL bo'ladi, tashkilot qoladi)
ALTER TABLE "Organization" ALTER COLUMN "userId" DROP NOT NULL;

-- 3) Yangi FK: yaratuvchi o'chsa -> userId NULL bo'ladi (cascade emas)
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) Backfill: har bir mavjud tashkilot uchun yaratuvchini OWNER a'zo sifatida
--    yozib qo'yamiz (agar hali a'zo bo'lmasa). Shu orqali egalik a'zolik
--    jadvalida ham saqlanadi va shaxsга qattiq bog'lanib qolmaydi.
INSERT INTO "OrgMember" ("id", "organizationId", "userId", "role", "status", "createdAt")
SELECT 'om_' || o."id", o."id", o."userId", 'OWNER'::"OrgRole", 'ACTIVE'::"MemberStatus", NOW()
FROM "Organization" o
WHERE o."userId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "OrgMember" m
    WHERE m."organizationId" = o."id" AND m."userId" = o."userId"
  );
