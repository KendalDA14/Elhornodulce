ALTER TABLE `CustomDessertRequest` ADD COLUMN `orderId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `CustomDessertRequest_orderId_key` ON `CustomDessertRequest`(`orderId`);
CREATE INDEX `CustomDessertRequest_status_idx` ON `CustomDessertRequest`(`status`);

ALTER TABLE `CustomDessertRequest`
  ADD CONSTRAINT `CustomDessertRequest_orderId_fkey`
  FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
