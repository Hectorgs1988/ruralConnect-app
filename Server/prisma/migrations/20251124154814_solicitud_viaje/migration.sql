-- CreateTable
CREATE TABLE `SolicitudViaje` (
    `id` VARCHAR(191) NOT NULL,
    `solicitanteId` VARCHAR(191) NOT NULL,
    `origen` VARCHAR(191) NOT NULL,
    `destino` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `horaDesde` VARCHAR(191) NOT NULL,
    `horaHasta` VARCHAR(191) NOT NULL,
    `notas` VARCHAR(191) NULL,
    `estado` ENUM('ABIERTA', 'ACEPTADA', 'CANCELADA') NOT NULL DEFAULT 'ABIERTA',
    `aceptadaPorId` VARCHAR(191) NULL,
    `viajeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SolicitudViaje_viajeId_key`(`viajeId`),
    INDEX `SolicitudViaje_fecha_idx`(`fecha`),
    INDEX `SolicitudViaje_solicitanteId_idx`(`solicitanteId`),
    INDEX `SolicitudViaje_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SolicitudViaje` ADD CONSTRAINT `SolicitudViaje_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SolicitudViaje` ADD CONSTRAINT `SolicitudViaje_aceptadaPorId_fkey` FOREIGN KEY (`aceptadaPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SolicitudViaje` ADD CONSTRAINT `SolicitudViaje_viajeId_fkey` FOREIGN KEY (`viajeId`) REFERENCES `Viaje`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
