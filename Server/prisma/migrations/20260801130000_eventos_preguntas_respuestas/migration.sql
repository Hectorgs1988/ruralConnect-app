-- CreateTable
CREATE TABLE `EventoPregunta` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `texto` VARCHAR(191) NOT NULL,
    `tipo` ENUM('TEXTO', 'NUMERO', 'OPCION_UNICA', 'BOOLEANO') NOT NULL,
    `esObligatoria` BOOLEAN NOT NULL DEFAULT false,
    `orden` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EventoPregunta_eventId_orden_key`(`eventId`, `orden`),
    INDEX `EventoPregunta_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventoPreguntaOpcion` (
    `id` VARCHAR(191) NOT NULL,
    `preguntaId` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `orden` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EventoPreguntaOpcion_preguntaId_orden_key`(`preguntaId`, `orden`),
    INDEX `EventoPreguntaOpcion_preguntaId_idx`(`preguntaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RespuestaEvento` (
    `id` VARCHAR(191) NOT NULL,
    `inscripcionId` VARCHAR(191) NOT NULL,
    `preguntaId` VARCHAR(191) NOT NULL,
    `valorTexto` VARCHAR(191) NULL,
    `valorNumero` INTEGER NULL,
    `valorBooleano` BOOLEAN NULL,
    `valorOpcion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RespuestaEvento_inscripcionId_preguntaId_key`(`inscripcionId`, `preguntaId`),
    INDEX `RespuestaEvento_preguntaId_idx`(`preguntaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventoPregunta` ADD CONSTRAINT `EventoPregunta_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoPreguntaOpcion` ADD CONSTRAINT `EventoPreguntaOpcion_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `EventoPregunta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RespuestaEvento` ADD CONSTRAINT `RespuestaEvento_inscripcionId_fkey` FOREIGN KEY (`inscripcionId`) REFERENCES `InscripcionEvento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RespuestaEvento` ADD CONSTRAINT `RespuestaEvento_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `EventoPregunta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
