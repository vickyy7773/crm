-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: crm_database
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `call_history`
--

DROP TABLE IF EXISTS `call_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `call_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead_id` int(11) NOT NULL,
  `caller_id` int(11) NOT NULL,
  `caller_name` varchar(255) NOT NULL,
  `call_date` datetime NOT NULL,
  `call_remark` text NOT NULL,
  `call_outcome` enum('Contacted','Interested','Call Back','Not Interested','Wrong Number','Converted','Not Reachable','Switched Off','Busy','No Answer') NOT NULL,
  `call_reason` enum('Budget Issue','Parents Not Agree','Already Applied Elsewhere','Not Eligible','Language Issue','Wrong Contact','Not Interested (General)','Other') DEFAULT NULL,
  `next_followup_date` datetime DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lead_id` (`lead_id`),
  KEY `idx_caller_id` (`caller_id`),
  KEY `idx_call_date` (`call_date`),
  CONSTRAINT `call_history_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `call_history_ibfk_2` FOREIGN KEY (`caller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_history`
--

LOCK TABLES `call_history` WRITE;
/*!40000 ALTER TABLE `call_history` DISABLE KEYS */;
INSERT INTO `call_history` VALUES (1,5,2,'Telecaller 1','2025-12-31 02:05:04','hrhytrr eth ytttw','Interested',NULL,NULL,'2','2025-12-30 20:35:04',NULL,NULL),(2,5,2,'Telecaller 1','2025-12-31 02:05:45','etrttgeb','Call Back',NULL,'4466-03-13 03:54:00','34','2025-12-30 20:35:45',NULL,NULL),(3,5,2,'Telecaller 1','2025-12-31 02:06:08','rgttwrgt','Converted',NULL,NULL,'02','2025-12-30 20:36:08',NULL,NULL),(4,5,2,'Telecaller 1','2025-12-31 02:26:07','tthh h5jujutjyhr hyetrh whr','No Answer',NULL,NULL,'4','2025-12-30 20:56:07','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(5,11,2,'Telecaller 1','2025-12-31 19:52:03','eyg cegr fr rrg fryuuy r y','Contacted',NULL,NULL,'2','2025-12-31 14:22:03','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),(6,11,2,'Telecaller 1','2025-12-31 19:52:22','hf eg  gyig ygieygfwrfyg i','Wrong Number','Language Issue',NULL,'4','2025-12-31 14:22:22','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),(7,11,2,'Telecaller 1','2025-12-31 19:53:11','bv tut fh g ghv k  kh il','Wrong Number','Wrong Contact',NULL,'0','2025-12-31 14:23:11','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),(8,12,2,'Telecaller 1','2026-01-04 00:51:05','dgh dfsdgghdh dgsdhdf sdggsd','Contacted',NULL,'0000-00-00 00:00:00','2','2026-01-03 19:21:05','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(9,12,2,'Telecaller 1','2026-01-04 00:51:40','dwerwet ryrtyhetryerthstytee ay','Interested',NULL,'0000-00-00 00:00:00','4','2026-01-03 19:21:40','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(10,12,2,'Telecaller 1','2026-01-04 01:15:05','wretyhrwh vWTRTHWTTRYTHEQH Trwtehh','Interested',NULL,'0000-00-00 00:00:00','5','2026-01-03 19:45:05','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(11,12,2,'Telecaller 1','2026-01-04 01:15:52','ewrgrte twrryheta yeayryeAHYR','Contacted',NULL,'0000-00-00 00:00:00','3','2026-01-03 19:45:52','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(12,5,2,'Telecaller 1','2026-01-04 01:22:18','aaaa a a a a aaaaaa a aaa a','Contacted',NULL,'0000-00-00 00:00:00','1','2026-01-03 19:52:18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(13,12,2,'Telecaller 1','2026-01-04 09:57:27','FYJUHGVKJY KYGKUY YIT F YIL IY TT I','Contacted',NULL,'0000-00-00 00:00:00','7','2026-01-04 04:27:27','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(14,5,2,'Telecaller 1','2026-01-04 10:01:55','Testing follow-up date functionality with proper detailed remarks for validation','Call Back',NULL,'2026-01-10 14:30:00','5','2026-01-04 04:31:55','::1','curl/8.15.0');
/*!40000 ALTER TABLE `call_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `neet` varchar(10) DEFAULT NULL,
  `course` varchar(100) DEFAULT 'MBBS',
  `destination` varchar(100) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `status` enum('New','Contacted','Interested','Call Back','Not Interested','Wrong Number','Converted','Reopen Requested') DEFAULT 'New',
  `assigned_to` int(11) DEFAULT NULL,
  `assigned_to_name` varchar(255) DEFAULT 'Unassigned',
  `assigned_date` datetime DEFAULT NULL,
  `last_call_date` datetime DEFAULT NULL,
  `next_followup_date` datetime DEFAULT NULL,
  `is_transferred` tinyint(1) DEFAULT 0,
  `transferred_date` datetime DEFAULT NULL,
  `transferred_to` int(11) DEFAULT NULL,
  `imported_date` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `follow_up_status` enum('pending','missed') DEFAULT 'pending',
  `reopen_requested` tinyint(1) DEFAULT 0,
  `transferred_to_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transferred_to` (`transferred_to`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_next_followup` (`next_followup_date`),
  KEY `idx_is_transferred` (`is_transferred`),
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`transferred_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES (1,'Test User','9999999999',NULL,'Delhi','500','MBBS','Russia','Test',NULL,'Test','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:15:56','2025-12-30 20:15:56','pending',0,NULL),(2,'Rahul Kumar','9876543210',NULL,'Delhi','520','MBBS','Russia','Interested in premium package',NULL,'Facebook Ad','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(3,'Priya Singh','9876543211',NULL,'Mumbai','485','MBBS','Philippines','Looking for basic plan',NULL,'Google Ad','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(4,'Vikram Mehta','9876543212',NULL,'Jaipur','510','MBBS','Bangladesh','Parents want low fees',NULL,'Instagram','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(5,'Anjali Sharma','9876543213',NULL,'Bangalore','495','MBBS','Georgia','Need scholarship info',NULL,'Website','Call Back',2,'Telecaller 1','2025-12-31 01:56:49','2026-01-04 10:01:55','2026-01-10 14:30:00',0,NULL,NULL,NULL,'2025-12-30 20:22:00','2026-01-04 04:31:55','pending',0,NULL),(6,'Amit Patel','9876543214',NULL,'Ahmedabad','530','MBBS','Ukraine','Good NEET score ready',NULL,'Referral','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(7,'Sneha Reddy','9876543215',NULL,'Hyderabad','475','MBBS','Kazakhstan','Budget conscious',NULL,'Facebook Ad','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(8,'Karan Gupta','9876543216',NULL,'Pune','505','MBBS','Russia','Wants top university',NULL,'Google Ad','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(9,'Neha Joshi','9876543217',NULL,'Kolkata','490','MBBS','Philippines','Quick admission needed',NULL,'Direct Call','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(10,'Rohit Verma','9876543218',NULL,'Chennai','515','MBBS','Bangladesh','Family in medical field',NULL,'Website','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(11,'Pooja Nair','9876543219',NULL,'Udaipur','480','MBBS','Georgia','First enquiry',NULL,'Instagram','Wrong Number',2,'Telecaller 1','2025-12-31 01:56:59','2025-12-31 19:53:11',NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-31 14:23:11','pending',0,NULL),(12,'Priya Sharma','9876543210','priya.sharma@example.com','Delhi',NULL,'MBBS','Russia',NULL,'DOB: 2005-03-20\nGender: Female\nNationality: N/A\nAadhar: N/A\nPassport Status: N/A\nAddress: 456 Park Avenue, Delhi, Delhi, India, 110001\nFather: Ramesh Sharma (9876543211), N/A\nMother: Sunita Sharma (N/A), N/A\nSource: EducatePulse Website','EducatePulse Website','Contacted',2,'Telecaller 1','2026-01-04 00:50:41','2026-01-04 09:57:27','0000-00-00 00:00:00',0,NULL,NULL,NULL,'2026-01-01 13:40:38','2026-01-04 04:27:27','pending',0,NULL);
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `telecaller_daily_stats`
--

DROP TABLE IF EXISTS `telecaller_daily_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `telecaller_daily_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `telecaller_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `total_calls` int(11) DEFAULT 0,
  `contacted_count` int(11) DEFAULT 0,
  `interested_count` int(11) DEFAULT 0,
  `negative_outcome_count` int(11) DEFAULT 0,
  `wrong_number_count` int(11) DEFAULT 0,
  `not_reachable_count` int(11) DEFAULT 0,
  `followups_missed` int(11) DEFAULT 0,
  `negative_outcome_ratio` decimal(5,2) DEFAULT 0.00,
  `interested_ratio` decimal(5,2) DEFAULT 0.00,
  `abuse_flag` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_telecaller_date` (`telecaller_id`,`date`),
  KEY `idx_date` (`date`),
  KEY `idx_abuse_flag` (`abuse_flag`),
  KEY `idx_telecaller_id` (`telecaller_id`),
  CONSTRAINT `telecaller_daily_stats_ibfk_1` FOREIGN KEY (`telecaller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `telecaller_daily_stats`
--

LOCK TABLES `telecaller_daily_stats` WRITE;
/*!40000 ALTER TABLE `telecaller_daily_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `telecaller_daily_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Super Admin','Telecaller','Counsellor','Manager','Sales Representative') NOT NULL DEFAULT 'Telecaller',
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','admin@pulseeducation.com','$2b$10$0t4LV5qLIj6izeIoDg8rc.3D9ruy108.HkIfvxkvWQwantPnsNn4G','Super Admin','+919999999999','Management','active','[\"all\"]','2025-12-30 19:28:18','2025-12-30 19:36:23'),(2,'Telecaller 1','telecaller@pulseeducation.com','$2b$10$3XlRO/N7fTP3gSr.iqYUg.WoW.HtVaSKUfjuxJuXo4pIoTICcAHNy','Telecaller','+919888888888','Sales','active','[\"view_assigned_leads\", \"add_call_logs\", \"update_lead_status\"]','2025-12-30 19:28:18','2026-01-03 18:42:42');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-04 10:22:57
