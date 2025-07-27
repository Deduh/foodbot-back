/*
  Warnings:

  - A unique constraint covering the columns `[telegramUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `telegramUserId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramUserId" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramUserId_key" ON "User"("telegramUserId");

-- CreateIndex
CREATE INDEX "User_telegramUserId_idx" ON "User"("telegramUserId");
