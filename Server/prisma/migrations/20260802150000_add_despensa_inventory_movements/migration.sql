CREATE TABLE `MovimientoInventarioDespensa` (
    `id` VARCHAR(191) NOT NULL,
    `productoId` VARCHAR(191) NULL,
    `compraId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `tipo` ENUM('ALTA', 'COMPRA', 'REPOSICION', 'AJUSTE', 'ELIMINACION') NOT NULL,
    `nombreProducto` VARCHAR(191) NOT NULL,
    `deltaUnidades` INTEGER NOT NULL,
    `stockAnterior` INTEGER NOT NULL,
    `stockPosterior` INTEGER NOT NULL,
    `detalle` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MovimientoInventarioDespensa_productoId_createdAt_idx`(`productoId`, `createdAt`),
    INDEX `MovimientoInventarioDespensa_compraId_idx`(`compraId`),
    INDEX `MovimientoInventarioDespensa_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `MovimientoInventarioDespensa_tipo_createdAt_idx`(`tipo`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MovimientoInventarioDespensa`
    ADD CONSTRAINT `MovimientoInventarioDespensa_productoId_fkey`
    FOREIGN KEY (`productoId`) REFERENCES `ProductoDespensa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `MovimientoInventarioDespensa_compraId_fkey`
    FOREIGN KEY (`compraId`) REFERENCES `CompraDespensa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `MovimientoInventarioDespensa_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;