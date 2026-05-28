-- CreateTable
CREATE TABLE `SavedConfiguration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'France',
    `locale` VARCHAR(191) NOT NULL DEFAULT 'fr-FR',
    `modelName` VARCHAR(191) NOT NULL,
    `finishName` VARCHAR(191) NULL,
    `batteryName` VARCHAR(191) NULL,
    `colorName` VARCHAR(191) NULL,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SavedConfiguration_customerEmail_idx`(`customerEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VehicleOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(191) NOT NULL,
    `status` ENUM('RECEIVED', 'CRM_SYNCED', 'CONFIRMED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'RECEIVED',
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL,
    `pointOfSale` VARCHAR(191) NOT NULL,
    `vehicleModel` VARCHAR(191) NOT NULL,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `configurationId` INTEGER NULL,
    `crmLeadId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VehicleOrder_reference_key`(`reference`),
    INDEX `VehicleOrder_customerEmail_idx`(`customerEmail`),
    INDEX `VehicleOrder_status_idx`(`status`),
    INDEX `VehicleOrder_configurationId_idx`(`configurationId`),
    INDEX `VehicleOrder_crmLeadId_idx`(`crmLeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessFleetVehicle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyName` VARCHAR(191) NOT NULL,
    `contactName` VARCHAR(191) NOT NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'France',
    `vehicleLabel` VARCHAR(191) NOT NULL,
    `vin` VARCHAR(191) NULL,
    `licensePlate` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'MAINTENANCE', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BusinessFleetVehicle_companyName_idx`(`companyName`),
    INDEX `BusinessFleetVehicle_contactEmail_idx`(`contactEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaintenanceAppointment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerName` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `vehicleLabel` VARCHAR(191) NOT NULL,
    `serviceCenter` VARCHAR(191) NOT NULL,
    `appointmentDate` DATETIME(3) NOT NULL,
    `serviceType` ENUM('REVISION', 'REPAIR', 'TIRE_CHANGE', 'SOFTWARE_UPDATE') NOT NULL DEFAULT 'REVISION',
    `status` ENUM('PLANNED', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `notes` TEXT NULL,
    `configurationId` INTEGER NULL,
    `fleetVehicleId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MaintenanceAppointment_customerEmail_idx`(`customerEmail`),
    INDEX `MaintenanceAppointment_appointmentDate_idx`(`appointmentDate`),
    INDEX `MaintenanceAppointment_configurationId_idx`(`configurationId`),
    INDEX `MaintenanceAppointment_fleetVehicleId_idx`(`fleetVehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmLead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `source` ENUM('CONTACT_FORM', 'ORDER', 'TEST_DRIVE') NOT NULL DEFAULT 'CONTACT_FORM',
    `status` ENUM('NEW', 'SENT_TO_CRM', 'QUALIFIED', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `vehicleInterest` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmLead_email_idx`(`email`),
    INDEX `CrmLead_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VehicleOrder` ADD CONSTRAINT `VehicleOrder_configurationId_fkey` FOREIGN KEY (`configurationId`) REFERENCES `SavedConfiguration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleOrder` ADD CONSTRAINT `VehicleOrder_crmLeadId_fkey` FOREIGN KEY (`crmLeadId`) REFERENCES `CrmLead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceAppointment` ADD CONSTRAINT `MaintenanceAppointment_configurationId_fkey` FOREIGN KEY (`configurationId`) REFERENCES `SavedConfiguration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceAppointment` ADD CONSTRAINT `MaintenanceAppointment_fleetVehicleId_fkey` FOREIGN KEY (`fleetVehicleId`) REFERENCES `BusinessFleetVehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
