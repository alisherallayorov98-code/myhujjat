-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONTRACT_CREATED', 'CONTRACT_EXPIRING', 'CONTRACT_SIGNED', 'SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_ACTIVATED', 'CONTRACT_LIMIT', 'SYSTEM', 'WELCOME');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");
