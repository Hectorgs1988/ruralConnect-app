CREATE TABLE `CompraDespensa` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `totalCentimos` INTEGER NOT NULL,
    `estadoPago` VARCHAR(191) NOT NULL DEFAULT 'SIMULATED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CompraDespensa_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CompraDespensaItem` (
    `id` VARCHAR(191) NOT NULL,
    `compraId` VARCHAR(191) NOT NULL,
    `productoId` VARCHAR(191) NULL,
    `nombreProducto` VARCHAR(191) NOT NULL,
    `precioUnitarioCentimos` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `subtotalCentimos` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CompraDespensaItem_compraId_idx`(`compraId`),
    INDEX `CompraDespensaItem_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CompraDespensa`
    ADD CONSTRAINT `CompraDespensa_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CompraDespensaItem`
    ADD CONSTRAINT `CompraDespensaItem_compraId_fkey`
    FOREIGN KEY (`compraId`) REFERENCES `CompraDespensa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `CompraDespensaItem_productoId_fkey`
    FOREIGN KEY (`productoId`) REFERENCES `ProductoDespensa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;