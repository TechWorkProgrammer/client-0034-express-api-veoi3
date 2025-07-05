/*
  Warnings:

  - A unique constraint covering the columns `[userId,resultId,type]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Favorite` DROP FOREIGN KEY `Favorite_userId_fkey`;

-- DropIndex
DROP INDEX `Favorite_userId_resultId_key` ON `Favorite`;

-- AlterTable
ALTER TABLE `Favorite` ADD COLUMN `type` ENUM('DEFAULT', 'GALLERY') NOT NULL DEFAULT 'DEFAULT';

-- CreateIndex
CREATE INDEX `ExpHistory_type_idx` ON `ExpHistory`(`type`);

-- CreateIndex
CREATE INDEX `Favorite_userId_idx` ON `Favorite`(`userId`);

-- CreateIndex
CREATE INDEX `Favorite_type_idx` ON `Favorite`(`type`);

-- CreateIndex
CREATE INDEX `Favorite_createdAt_idx` ON `Favorite`(`createdAt`);

-- CreateIndex
CREATE INDEX `Favorite_userId_type_idx` ON `Favorite`(`userId`, `type`);

-- CreateIndex
CREATE UNIQUE INDEX `Favorite_userId_resultId_type_key` ON `Favorite`(`userId`, `resultId`, `type`);

-- CreateIndex
CREATE INDEX `GenerateAttempt_status_idx` ON `GenerateAttempt`(`status`);

-- CreateIndex
CREATE INDEX `Notification_type_idx` ON `Notification`(`type`);

-- CreateIndex
CREATE INDEX `TokenHistory_type_idx` ON `TokenHistory`(`type`);

-- CreateIndex
CREATE INDEX `User_role_idx` ON `User`(`role`);

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Favorite` RENAME INDEX `Favorite_resultId_fkey` TO `Favorite_resultId_idx`;
