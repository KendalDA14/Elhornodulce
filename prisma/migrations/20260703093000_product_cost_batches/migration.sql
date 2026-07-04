-- CreateTable
CREATE TABLE `ProductCostBatch` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `producedQuantity` DECIMAL(10, 2) NOT NULL,
    `totalCost` DECIMAL(10, 2) NOT NULL,
    `costPerUnit` DECIMAL(10, 2) NOT NULL,
    `desiredMarginPercent` DECIMAL(5, 2) NULL,
    `desiredProfitAmount` DECIMAL(10, 2) NULL,
    `suggestedPrice` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductCostBatch_productId_idx`(`productId`),
    INDEX `ProductCostBatch_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductCostItem` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `ingredientId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 3) NULL,
    `unit` VARCHAR(191) NULL,
    `totalCost` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductCostItem_batchId_idx`(`batchId`),
    INDEX `ProductCostItem_ingredientId_idx`(`ingredientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductCostBatch` ADD CONSTRAINT `ProductCostBatch_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCostItem` ADD CONSTRAINT `ProductCostItem_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `ProductCostBatch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCostItem` ADD CONSTRAINT `ProductCostItem_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
