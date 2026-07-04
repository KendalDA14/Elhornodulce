-- CreateTable
CREATE TABLE `OrderAdjustment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `type` ENUM('REFUND', 'DISCOUNT') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderAdjustment_orderId_idx`(`orderId`),
    INDEX `OrderAdjustment_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteSettings` (
    `id` VARCHAR(191) NOT NULL,
    `heroImageUrl` TEXT NULL,
    `heroImagePath` TEXT NULL,
    `heroEyebrow` VARCHAR(191) NOT NULL DEFAULT 'Horneado por encargo',
    `heroTitle` VARCHAR(191) NOT NULL DEFAULT 'Horno Dulce',
    `heroDescription` TEXT NOT NULL,
    `heroNotice` TEXT NOT NULL,
    `refundPolicy` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderAdjustment` ADD CONSTRAINT `OrderAdjustment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
