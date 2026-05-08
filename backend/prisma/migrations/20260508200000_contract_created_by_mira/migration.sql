-- AlterTable: Mira AI tomonidan yaratilganligini belgilovchi maydon
ALTER TABLE "Contract" ADD COLUMN "createdByMira" BOOLEAN NOT NULL DEFAULT false;
