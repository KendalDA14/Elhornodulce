ALTER TABLE `sitesettings`
  ADD COLUMN `aboutDescription` TEXT NULL,
  ADD COLUMN `aboutEyebrow` VARCHAR(191) NULL,
  ADD COLUMN `aboutImagePath` TEXT NULL,
  ADD COLUMN `aboutImageUrl` TEXT NULL,
  ADD COLUMN `aboutTitle` VARCHAR(191) NULL,
  ADD COLUMN `refundPartialText` TEXT NULL,
  ADD COLUMN `refundReplacementText` TEXT NULL,
  ADD COLUMN `refundReviewText` TEXT NULL;
