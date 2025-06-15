-- AlterTable
ALTER TABLE `TokenHistory` MODIFY `type` ENUM('PURCHASE', 'REFUND_TOKEN', 'ADJUSTMENT_TOKEN', 'SPEND') NOT NULL;

-- AlterTable
ALTER TABLE `VideoGenerationResult` ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `VideoGenerationResult_views_idx` ON `VideoGenerationResult`(`views`);
