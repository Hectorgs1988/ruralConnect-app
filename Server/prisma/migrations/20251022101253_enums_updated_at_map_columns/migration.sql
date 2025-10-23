/*
  Warnings:

  - You are about to drop the column `inicio` on the `Reserva` table. All the data in the column will be lost.
  - You are about to alter the column `estado` on the `Reserva` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - A unique constraint covering the columns `[nombre]` on the table `Espacio` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Reserva` DROP FOREIGN KEY `Reserva_espacioId_fkey`;

-- DropIndex
DROP INDEX `Reserva_espacioId_inicio_fin_idx` ON `Reserva`;

-- AlterTable
ALTER TABLE `Espacio` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `descripcion` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `PasajeroViaje` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Reserva` DROP COLUMN `inicio`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `fin` DATETIME(3) NULL,
    MODIFY `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA') NOT NULL DEFAULT 'CONFIRMADA';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Viaje` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `estado` ENUM('ABIERTO', 'COMPLETO', 'CANCELADO') NOT NULL DEFAULT 'ABIERTO',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `Espacio_nombre_key` ON `Espacio`(`nombre`);

-- CreateIndex
CREATE INDEX `Reserva_espacioId_fecha_idx` ON `Reserva`(`espacioId`, `fecha`);

-- CreateIndex
CREATE INDEX `Reserva_espacioId_fin_idx` ON `Reserva`(`espacioId`, `fin`);

-- CreateIndex
CREATE INDEX `Reserva_usuarioId_fecha_idx` ON `Reserva`(`usuarioId`, `fecha`);

-- CreateIndex
CREATE INDEX `Viaje_conductorId_fecha_idx` ON `Viaje`(`conductorId`, `fecha`);

ALTER TABLE `Viaje` DROP FOREIGN KEY `Viaje_conductorId_fkey`;
-- AddForeignKey
ALTER TABLE `Viaje`
    ADD CONSTRAINT `Viaje_conductorId_fkey`
    FOREIGN KEY (`conductorId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `PasajeroViaje` RENAME INDEX `PasajeroViaje_userId_fkey` TO `PasajeroViaje_userId_idx`;
