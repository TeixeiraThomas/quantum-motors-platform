-- MySQL dump 10.13  Distrib 8.0.34, for macos13 (x86_64)
--
-- Host: localhost    Database: quantum-motors
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_BatteryToFinish`
--

DROP TABLE IF EXISTS `_BatteryToFinish`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_BatteryToFinish` (
  `A` int NOT NULL,
  `B` int NOT NULL,
  UNIQUE KEY `_BatteryToFinish_AB_unique` (`A`,`B`),
  KEY `_BatteryToFinish_B_index` (`B`),
  CONSTRAINT `_BatteryToFinish_A_fkey` FOREIGN KEY (`A`) REFERENCES `Battery` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_BatteryToFinish_B_fkey` FOREIGN KEY (`B`) REFERENCES `Finish` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_BatteryToFinish`
--

LOCK TABLES `_BatteryToFinish` WRITE;
/*!40000 ALTER TABLE `_BatteryToFinish` DISABLE KEYS */;
INSERT INTO `_BatteryToFinish` VALUES (1,1),(2,1),(3,1),(1,2),(2,2),(3,2),(1,3),(2,3),(3,3),(1,4),(2,4),(3,4);
/*!40000 ALTER TABLE `_BatteryToFinish` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_ColorToFinish`
--

DROP TABLE IF EXISTS `_ColorToFinish`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_ColorToFinish` (
  `A` int NOT NULL,
  `B` int NOT NULL,
  UNIQUE KEY `_ColorToFinish_AB_unique` (`A`,`B`),
  KEY `_ColorToFinish_B_index` (`B`),
  CONSTRAINT `_ColorToFinish_A_fkey` FOREIGN KEY (`A`) REFERENCES `Color` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ColorToFinish_B_fkey` FOREIGN KEY (`B`) REFERENCES `Finish` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_ColorToFinish`
--

LOCK TABLES `_ColorToFinish` WRITE;
/*!40000 ALTER TABLE `_ColorToFinish` DISABLE KEYS */;
INSERT INTO `_ColorToFinish` VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(1,2),(2,2),(3,2),(4,2),(5,2),(6,2),(1,3),(2,3),(3,3),(4,3),(5,3),(6,3),(1,4),(2,4),(3,4),(4,4),(5,4),(6,4);
/*!40000 ALTER TABLE `_ColorToFinish` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_FinishToModel`
--

DROP TABLE IF EXISTS `_FinishToModel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_FinishToModel` (
  `A` int NOT NULL,
  `B` int NOT NULL,
  UNIQUE KEY `_FinishToModel_AB_unique` (`A`,`B`),
  KEY `_FinishToModel_B_index` (`B`),
  CONSTRAINT `_FinishToModel_A_fkey` FOREIGN KEY (`A`) REFERENCES `Finish` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_FinishToModel_B_fkey` FOREIGN KEY (`B`) REFERENCES `Model` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_FinishToModel`
--

LOCK TABLES `_FinishToModel` WRITE;
/*!40000 ALTER TABLE `_FinishToModel` DISABLE KEYS */;
INSERT INTO _FinishToModel VALUES (2,1),(3,1),(4,1),(1,2),(2,2),(4,2),(1,3),(2,3),(3,4),(4,4),(2,5),(4,5);
/*!40000 ALTER TABLE `_FinishToModel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('4131d97f-59e8-4bb1-b661-ce1ce0f0b0fe','e015921a72e78e99584bf2c35ca0ff6ec5f57f446b02967f1fd84cd59925573c','2024-02-04 22:18:37.842','20240204221837_',NULL,NULL,'2024-02-04 22:18:37.761',1),('edd18b4b-1416-423d-94f0-ce9d84fcdf90','58eea3bac784e0176edc400de98d4bb61f31bfc9caed7635ec10d5362fb44d10','2024-02-04 21:49:46.693','20240204214946_',NULL,NULL,'2024-02-04 21:49:46.357',1),('6f0a6e69-bc84-4eb6-a5b7-05481d0df1d1','7d880f4d243d4e4c90ad75e65da879140ae443d35d5fc3442066dcfe0e26e1f3','2024-02-05 17:22:13.142','20240205172213_',NULL,NULL,'2024-02-05 17:22:13.041',1),('884efefb-cab4-42cb-980f-db621bc7a8c9','31883a5af4652ea9555c8bd5179c9c51dd0cf2fff78906e3add27e9df8e2c28f','2024-02-05 17:23:51.114','20240205172351_',NULL,NULL,'2024-02-05 17:23:51.023',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Battery`
--

DROP TABLE IF EXISTS `Battery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Battery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `power` double NOT NULL,
  `capacity` double NOT NULL,
  `price` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Battery`
--

LOCK TABLES `Battery` WRITE;
/*!40000 ALTER TABLE `Battery` DISABLE KEYS */;
INSERT INTO Battery VALUES (1,'Batterie Standard','Batterie polyvalente pour un usage quotidien. Capacite de 58 kWh, puissance de 180 kW, equilibre entre performances et autonomie.',180,58,0),(2,'Batterie Grande Autonomie','Batterie orientee longs trajets. Capacite de 82 kWh, puissance de 240 kW, autonomie renforcee pour la route et les vacances.',240,82,4200),(3,'Batterie Performance','Batterie haute performance. Capacite de 102 kWh, puissance de 320 kW, acceleration et reprises maximales.',320,102,8900);
/*!40000 ALTER TABLE `Battery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Car`
--

DROP TABLE IF EXISTS `Car`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Car` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelId` int NOT NULL,
  `finishId` int NOT NULL,
  `batteryId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Car_code_key` (`code`),
  UNIQUE KEY `Car_modelId_finishId_batteryId_key` (`modelId`,`finishId`,`batteryId`),
  KEY `Car_finishId_fkey` (`finishId`),
  KEY `Car_batteryId_fkey` (`batteryId`),
  CONSTRAINT `Car_batteryId_fkey` FOREIGN KEY (`batteryId`) REFERENCES `Battery` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Car_finishId_fkey` FOREIGN KEY (`finishId`) REFERENCES `Finish` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Car_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Car`
--

LOCK TABLES `Car` WRITE;
/*!40000 ALTER TABLE `Car` DISABLE KEYS */;
INSERT INTO Car VALUES (1,'ECS',1,2,1),(2,'ECA',1,2,2),(3,'ECB',1,2,3),(4,'ESS',1,3,1),(5,'ESA',1,3,2),(6,'ESB',1,3,3),(7,'EUS',1,4,1),(8,'EUA',1,4,2),(9,'EUB',1,4,3),(10,'VES',2,1,1),(11,'VEA',2,1,2),(12,'VEB',2,1,3),(13,'VCS',2,2,1),(14,'VCA',2,2,2),(15,'VCB',2,2,3),(16,'VUS',2,4,1),(17,'VUA',2,4,2),(18,'VUB',2,4,3),(19,'SES',3,1,1),(20,'SEA',3,1,2),(21,'SEB',3,1,3),(22,'SCS',3,2,1),(23,'SCA',3,2,2),(24,'SCB',3,2,3),(25,'PSS',4,3,1),(26,'PSA',4,3,2),(27,'PSB',4,3,3),(28,'PUS',4,4,1),(29,'PUA',4,4,2),(30,'PUB',4,4,3),(31,'ZCS',5,2,1),(32,'ZCA',5,2,2),(33,'ZCB',5,2,3),(34,'ZUS',5,4,1),(35,'ZUA',5,4,2),(36,'ZUB',5,4,3);
/*!40000 ALTER TABLE `Car` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Color`
--

DROP TABLE IF EXISTS `Color`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Color` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  `hexa` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '000000',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Color_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Color`
--

LOCK TABLES `Color` WRITE;
/*!40000 ALTER TABLE `Color` DISABLE KEYS */;
INSERT INTO Color VALUES (1,'WHI','Blanc','Blanc',0,'FFFFFF'),(2,'BLK','Noir','Noir',0,'000000'),(3,'REI','Rouge intense','Rouge intense',490,'FF2400'),(4,'BLC','Bleu ciel','Bleu ciel',390,'77B5FE'),(5,'GRC','Gris cosmos','Gris cosmos',450,'D3D3D3'),(6,'YEL','Jaune brillant','Jaune brillant',650,'FFFF00');
/*!40000 ALTER TABLE `Color` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Finish`
--

DROP TABLE IF EXISTS `Finish`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Finish` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Finish`
--

LOCK TABLES `Finish` WRITE;
/*!40000 ALTER TABLE `Finish` DISABLE KEYS */;
INSERT INTO Finish VALUES (1,'Eco','Version efficiente orientee cout d usage et sobriete energetique. Ideale pour les trajets du quotidien.',0),(2,'Confort','Version familiale axee confort, silence a bord et equipements utiles au quotidien.',2200),(3,'Sport','Version dynamique avec reglages plus fermes et sensations de conduite renforcees.',5200),(4,'Ultra','Version premium avec equipements haut de gamme et finition interieure renforcee.',7800);
/*!40000 ALTER TABLE `Finish` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Model`
--

DROP TABLE IF EXISTS `Model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Model` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  `type` enum('SEDAN','SUV','HATCH') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Model`
--

LOCK TABLES `Model` WRITE;
/*!40000 ALTER TABLE `Model` DISABLE KEYS */;
INSERT INTO Model VALUES (1,'Electron','SUV confortable, lourd et puissant, concu pour les familles qui veulent de la presence sur route et de la serenite au quotidien.',65990,'SUV'),(2,'Volt','Break familial confortable, optimise pour les longs trajets, grand coffre et excellente polyvalence.',54990,'SEDAN'),(3,'Spark','Vehicule compact du quotidien, agile en ville, sobre et simple a stationner.',32990,'HATCH'),(4,'Pulse','Coupe sport electrique, la plus puissante de la gamme, acceleration franche et comportement dynamique.',89990,'SEDAN'),(5,'Zenith','Berline familiale tres confortable, orientee bien-etre a bord et voyages longue distance.',61990,'SEDAN');
/*!40000 ALTER TABLE `Model` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-02-04 23:53:34

