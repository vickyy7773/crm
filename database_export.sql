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
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
  `entity_type` enum('Lead','User','CallHistory','Auth','Setting') NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity_type` (`entity_type`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,2,'Telecaller 1','LOGOUT','Auth',2,'{\"email\":\"telecaller@pulseeducation.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-04 20:25:35');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_history`
--

LOCK TABLES `call_history` WRITE;
/*!40000 ALTER TABLE `call_history` DISABLE KEYS */;
INSERT INTO `call_history` VALUES (1,5,2,'Telecaller 1','2025-12-31 02:05:04','hrhytrr eth ytttw','Interested',NULL,NULL,'2','2025-12-30 20:35:04',NULL,NULL),(2,5,2,'Telecaller 1','2025-12-31 02:05:45','etrttgeb','Call Back',NULL,'4466-03-13 03:54:00','34','2025-12-30 20:35:45',NULL,NULL),(3,5,2,'Telecaller 1','2025-12-31 02:06:08','rgttwrgt','Converted',NULL,NULL,'02','2025-12-30 20:36:08',NULL,NULL),(4,5,2,'Telecaller 1','2025-12-31 02:26:07','tthh h5jujutjyhr hyetrh whr','No Answer',NULL,NULL,'4','2025-12-30 20:56:07','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(5,11,2,'Telecaller 1','2025-12-31 19:52:03','eyg cegr fr rrg fryuuy r y','Contacted',NULL,NULL,'2','2025-12-31 14:22:03','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),(6,11,2,'Telecaller 1','2025-12-31 19:52:22','hf eg  gyig ygieygfwrfyg i','Wrong Number','Language Issue',NULL,'4','2025-12-31 14:22:22','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),(7,11,2,'Telecaller 1','2025-12-31 19:53:11','bv tut fh g ghv k  kh il','Wrong Number','Wrong Contact',NULL,'0','2025-12-31 14:23:11','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),(8,12,2,'Telecaller 1','2026-01-04 00:51:05','dgh dfsdgghdh dgsdhdf sdggsd','Contacted',NULL,'0000-00-00 00:00:00','2','2026-01-03 19:21:05','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(9,12,2,'Telecaller 1','2026-01-04 00:51:40','dwerwet ryrtyhetryerthstytee ay','Interested',NULL,'0000-00-00 00:00:00','4','2026-01-03 19:21:40','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(10,12,2,'Telecaller 1','2026-01-04 01:15:05','wretyhrwh vWTRTHWTTRYTHEQH Trwtehh','Interested',NULL,'0000-00-00 00:00:00','5','2026-01-03 19:45:05','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(11,12,2,'Telecaller 1','2026-01-04 01:15:52','ewrgrte twrryheta yeayryeAHYR','Contacted',NULL,'0000-00-00 00:00:00','3','2026-01-03 19:45:52','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(12,5,2,'Telecaller 1','2026-01-04 01:22:18','aaaa a a a a aaaaaa a aaa a','Contacted',NULL,'0000-00-00 00:00:00','1','2026-01-03 19:52:18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(13,12,2,'Telecaller 1','2026-01-04 09:57:27','FYJUHGVKJY KYGKUY YIT F YIL IY TT I','Contacted',NULL,'0000-00-00 00:00:00','7','2026-01-04 04:27:27','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(14,5,2,'Telecaller 1','2026-01-04 10:01:55','Testing follow-up date functionality with proper detailed remarks for validation','Call Back',NULL,'2026-01-10 14:30:00','5','2026-01-04 04:31:55','::1','curl/8.15.0'),(15,2,2,'Telecaller 1','2026-01-04 15:02:19','werth t hwt rh het g','Contacted',NULL,'0000-00-00 00:00:00','2','2026-01-04 09:32:19','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(16,2,2,'Telecaller 1','2026-01-04 15:03:08','34tyh y5 u64y u uw yu7 uyjm','Interested',NULL,'0000-00-00 00:00:00','3','2026-01-04 09:33:08','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(17,2,2,'Telecaller 1','2026-01-04 15:03:30','tyu7b7u7i75o79o 8p; rt gtyjy','Converted',NULL,NULL,'3','2026-01-04 09:33:30','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),(18,3,2,'Telecaller 1','2026-01-04 18:07:35','rtg rhj et krykteujyr jt k','Contacted',NULL,'2026-01-05 12:02:00','2','2026-01-04 12:37:35','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36');
/*!40000 ALTER TABLE `call_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_settings`
--

DROP TABLE IF EXISTS `company_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL,
  `companyName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `timezone` varchar(100) DEFAULT 'Asia/Kolkata',
  `currency` varchar(10) DEFAULT 'INR',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_settings`
--

LOCK TABLES `company_settings` WRITE;
/*!40000 ALTER TABLE `company_settings` DISABLE KEYS */;
INSERT INTO `company_settings` VALUES (1,'Study Abroad Consultancy','contact@studyabroad.com','+91 987654321','Udaipur, Rajasthan, India','www.studyabroad.com','Asia/Kolkata','INR','2026-01-04 10:39:32','2026-01-04 10:41:27');
/*!40000 ALTER TABLE `company_settings` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES (2,'Rahul Kumar','9876543210',NULL,'Delhi','520','MBBS','Russia','Interested in premium package',NULL,'Facebook Ad','Converted',2,'Telecaller 1','2026-01-04 15:01:43','2026-01-04 15:03:30',NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2026-01-04 09:33:30','pending',0,NULL),(3,'Priya Singh','9876543211',NULL,'Mumbai','485','MBBS','Philippines','Looking for basic plan',NULL,'Google Ad','Contacted',2,'Telecaller 1','2026-01-04 18:02:45','2026-01-04 18:07:35','2026-01-05 12:02:00',0,NULL,NULL,NULL,'2025-12-30 20:22:00','2026-01-04 12:37:35','pending',0,NULL),(4,'Vikram Mehta','9876543212',NULL,'Jaipur','510','MBBS','Bangladesh','Parents want low fees',NULL,'Instagram','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(5,'Anjali Sharma','9876543213',NULL,'Bangalore','495','MBBS','Georgia','Need scholarship info',NULL,'Website','Call Back',2,'Telecaller 1','2025-12-31 01:56:49','2026-01-04 10:01:55','2026-01-10 14:30:00',0,NULL,NULL,NULL,'2025-12-30 20:22:00','2026-01-04 04:31:55','pending',0,NULL),(6,'Amit Patel','9876543214',NULL,'Ahmedabad','530','MBBS','Ukraine','Good NEET score ready',NULL,'Referral','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(7,'Sneha Reddy','9876543215',NULL,'Hyderabad','475','MBBS','Kazakhstan','Budget conscious',NULL,'Facebook Ad','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(8,'Karan Gupta','9876543216',NULL,'Pune','505','MBBS','Russia','Wants top university',NULL,'Google Ad','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(9,'Neha Joshi','9876543217',NULL,'Kolkata','490','MBBS','Philippines','Quick admission needed',NULL,'Direct Call','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(10,'Rohit Verma','9876543218',NULL,'Chennai','515','MBBS','Bangladesh','Family in medical field',NULL,'Website','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-30 20:22:00','pending',0,NULL),(11,'Pooja Nair','9876543219',NULL,'Udaipur','480','MBBS','Georgia','First enquiry',NULL,'Instagram','Wrong Number',2,'Telecaller 1','2025-12-31 01:56:59','2025-12-31 19:53:11',NULL,0,NULL,NULL,NULL,'2025-12-30 20:22:00','2025-12-31 14:23:11','pending',0,NULL),(12,'Priya Sharma','9876543210','priya.sharma@example.com','Delhi',NULL,'MBBS','Russia',NULL,'DOB: 2005-03-20\nGender: Female\nNationality: N/A\nAadhar: N/A\nPassport Status: N/A\nAddress: 456 Park Avenue, Delhi, Delhi, India, 110001\nFather: Ramesh Sharma (9876543211), N/A\nMother: Sunita Sharma (N/A), N/A\nSource: EducatePulse Website','EducatePulse Website','Contacted',2,'Telecaller 1','2026-01-04 00:50:41','2026-01-04 09:57:27','0000-00-00 00:00:00',0,NULL,NULL,NULL,'2026-01-01 13:40:38','2026-01-04 04:27:27','pending',0,NULL),(13,'Test User','9876543210',NULL,'Udaipur',NULL,'MBBS','Russia',NULL,NULL,'Website','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,'4/1/2026, 5:55:22 pm','2026-01-04 12:25:22','2026-01-04 12:25:22','pending',0,NULL),(14,'Test User','9876543210',NULL,'Udaipur',NULL,'MBBS','Russia',NULL,NULL,'Website','Contacted',2,'John Telecaller','2026-01-04 17:57:12',NULL,NULL,0,NULL,NULL,'4/1/2026, 5:56:53 pm','2026-01-04 12:26:53','2026-01-04 12:27:28','pending',0,NULL),(15,'vikram vikram','9351445433','rajputvikram470@gmail.com','udaipur',NULL,'MBBS','Not Specified',NULL,'DOB: 2000-12-12\nGender: Male\nNationality: Indian\nAadhar: 345725436646\nPassport Status: Yet to Apply\nAddress: 257 opp. M.B. collage kumaron ka battha, udaipur, Rajasthan, India, 313001\nFather: fagratghshasfd (3453654325), Retired\nMother: fgreaghghf (4564353635), Retired\nSource: MBBS Application Form','MBBS Application Form','New',NULL,'Unassigned',NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-01-04 19:25:07','2026-01-04 19:25:07','pending',0,NULL);
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `type` enum('new_lead','assignment','status_change','call_log','lead_converted') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `lead_name` varchar(255) DEFAULT NULL,
  `unread` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_unread` (`unread`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_type` (`type`),
  KEY `lead_id` (`lead_id`),
  KEY `idx_user_unread` (`user_id`,`unread`,`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,NULL,'new_lead','New Lead Added','Test User submitted inquiry for MBBS in Russia',14,'Test User',0,'2026-01-04 12:26:53','2026-01-04 12:27:53'),(2,2,'assignment','Lead Assigned','You have been assigned to Test User\'s application',14,'Test User',0,'2026-01-04 12:27:12','2026-01-04 12:27:53'),(4,2,'assignment','Lead Assigned','You have been assigned to Priya Singh\'s application',3,'Priya Singh',0,'2026-01-04 12:32:45','2026-01-04 12:33:03');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `other_courses_applications`
--

DROP TABLE IF EXISTS `other_courses_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `other_courses_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_middle_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` varchar(20) NOT NULL,
  `nationality` varchar(50) NOT NULL,
  `aadhar` varchar(12) NOT NULL,
  `passport_status` varchar(50) NOT NULL,
  `passport_number` varchar(50) DEFAULT NULL,
  `file_number` varchar(50) DEFAULT NULL,
  `passport_issue_date` date DEFAULT NULL,
  `passport_expiry_date` date DEFAULT NULL,
  `father_title` varchar(10) DEFAULT NULL,
  `father_name` varchar(100) NOT NULL,
  `father_occupation` varchar(100) NOT NULL,
  `mother_title` varchar(10) DEFAULT NULL,
  `mother_name` varchar(100) NOT NULL,
  `mother_occupation` varchar(100) DEFAULT NULL,
  `school_10_name` varchar(200) NOT NULL,
  `board_10` varchar(100) NOT NULL,
  `percentage_10` decimal(5,2) NOT NULL,
  `year_10` int(11) NOT NULL,
  `school_11_name` varchar(200) DEFAULT NULL,
  `board_11` varchar(100) DEFAULT NULL,
  `percentage_11` decimal(5,2) DEFAULT NULL,
  `year_11` int(11) DEFAULT NULL,
  `school_12_status` varchar(50) NOT NULL,
  `school_12_name` varchar(200) DEFAULT NULL,
  `board_12` varchar(100) DEFAULT NULL,
  `percentage_12` decimal(5,2) DEFAULT NULL,
  `year_12` int(11) DEFAULT NULL,
  `ug_status` varchar(50) DEFAULT NULL,
  `ug_degree` varchar(100) DEFAULT NULL,
  `ug_college` varchar(255) DEFAULT NULL,
  `ug_percentage` decimal(5,2) DEFAULT NULL,
  `ug_year` int(11) DEFAULT NULL,
  `pg_status` varchar(50) DEFAULT NULL,
  `pg_degree` varchar(100) DEFAULT NULL,
  `pg_college` varchar(255) DEFAULT NULL,
  `pg_percentage` decimal(5,2) DEFAULT NULL,
  `pg_year` int(11) DEFAULT NULL,
  `any_other_course` varchar(10) DEFAULT 'No',
  `other_course_name` varchar(100) DEFAULT NULL,
  `other_course_college` varchar(255) DEFAULT NULL,
  `other_course_percentage` decimal(5,2) DEFAULT NULL,
  `other_course_year` int(11) DEFAULT NULL,
  `gap_between_education` varchar(10) DEFAULT 'No',
  `total_gap_years` int(11) DEFAULT NULL,
  `gap_reason` text DEFAULT NULL,
  `english_exam` varchar(10) DEFAULT 'No',
  `english_exam_year` int(11) DEFAULT NULL,
  `english_exam_type` varchar(50) DEFAULT NULL,
  `entrance_exam` varchar(10) DEFAULT 'No',
  `entrance_exams` text DEFAULT NULL,
  `degree_name` varchar(200) DEFAULT NULL,
  `branch_stream` varchar(200) DEFAULT NULL,
  `preferred_countries` varchar(300) DEFAULT NULL,
  `max_budget` varchar(100) DEFAULT NULL,
  `work_experience` varchar(10) DEFAULT 'No',
  `work_duration` varchar(50) DEFAULT NULL,
  `visa_applied_prior` varchar(10) DEFAULT 'No',
  `visa_country_name` varchar(100) DEFAULT NULL,
  `visa_how_many_times` int(11) DEFAULT NULL,
  `previous_visa_refusal` varchar(10) DEFAULT 'No',
  `refusal_reason` text DEFAULT NULL,
  `refusal_country_name` varchar(100) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `mobile` varchar(10) NOT NULL,
  `whatsapp` varchar(10) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `father_mobile` varchar(10) NOT NULL,
  `mother_mobile` varchar(10) DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `pincode` varchar(6) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `upload_documents` varchar(100) DEFAULT 'No, Already share on WhatsApp or Email',
  `course` varchar(50) DEFAULT 'Other Courses',
  `source` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `document_marksheet_10` varchar(255) DEFAULT NULL,
  `document_marksheet_12` varchar(255) DEFAULT NULL,
  `document_ug_degree` varchar(255) DEFAULT NULL,
  `document_pg_degree` varchar(255) DEFAULT NULL,
  `document_aadhar_card` varchar(255) DEFAULT NULL,
  `document_passport_front` varchar(255) DEFAULT NULL,
  `document_passport_back` varchar(255) DEFAULT NULL,
  `document_photograph` varchar(255) DEFAULT NULL,
  `document_english_exam_cert` varchar(255) DEFAULT NULL,
  `document_entrance_exam_scorecard` varchar(255) DEFAULT NULL,
  `document_work_exp_certificate` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `other_courses_applications`
--

LOCK TABLES `other_courses_applications` WRITE;
/*!40000 ALTER TABLE `other_courses_applications` DISABLE KEYS */;
INSERT INTO `other_courses_applications` VALUES (1,'John Michael','Doe','2000-01-15','Male','Indian','123456789012','Have Passport','P1234567','F9876543','2020-06-15','2030-06-14','Mr.','Robert Doe','Engineer','Mrs.','Mary Doe','Teacher','Delhi Public School','CBSE',85.50,2015,'Delhi Public School','CBSE',80.00,2016,'Completed','Delhi Public School','CBSE',88.00,2017,'Completed','B.Tech Computer Science','IIT Delhi',85.00,2021,'Pursuing','M.Tech AI','IIT Bombay',90.00,2024,'Yes','Data Science Certification','Coursera',95.00,2022,'Yes',1,'Preparation for competitive exams','Yes',2023,'IELTS','Yes','[{\"examName\":\"GRE\",\"score\":\"320\"},{\"examName\":\"GMAT\",\"score\":\"700\"}]','Masters in Computer Science','Artificial Intelligence','USA, Canada, UK','$50,000 - $70,000','Yes','2 years','Yes','USA',1,'No',NULL,NULL,NULL,'9876543210','9876543210','john.doe@example.com','9876543211','9876543212','123 Main Street, Sector 15','New Delhi','110001','Delhi','India','Yes, I want to upload','Other Courses','Other Courses Application Form','2026-01-04 21:33:18','2026-01-05 07:48:28','uploads\\other-courses-applications\\WhatsApp Image 2025-12-11 at 13.14.12-1767599307981-29759218.jpeg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'dsadasa','dsavSAS','2003-02-23','Male','Indian','231423142142','Have Passport','2132432142214214224','2134221422142','2421-03-21',NULL,'Mr.','ERWFERFWERF','Business','Mrs.','RWEGWQRWT','Housewife','EWRQWFEGS','EFWED',23.00,1223,'WREWFEWRFRW','EWFWREGD',23.00,2029,'Pursuing','QERWREFWEGR','EWFRRWEFW',22.99,2030,'Completed','WQEWFREGREFW','REGFWREGT',23.00,2030,'Completed','WERGERRDEFG','FESRGDBFEFR',43.00,2029,'Yes','WREGRFREFRGBRF','FEEBFEWREGS',21.00,2029,'Yes',3,'DFSDFEASGDFEFD','Yes',1324,'IELTS','Yes','[{\"examName\":\"NEET\",\"score\":\"3124\"}]','RERGAEEFWGETA','ADCBFEVDGFVD','DDGBFEWEGBFRVGF','12','Yes','2','Yes','DSGFGB',1,'Yes','EWRREQWR','23','WRGEFDWFD WQEWFWRG FAGRFWEGFSDGERSDF VERSDSDVSDGFRGREVFD','2132214231','2313241323','rajputvikram470@gmail.com','1324321423','2132432142','257 opp. M.B. collage kumaron ka battha','udaipur','313001','Rajasthan','India','No, Already share on WhatsApp or Email','Other Courses','Other Courses Application Form','2026-01-05 06:12:33','2026-01-05 06:12:33',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'Test','Student','2000-01-15','Male','Indian','123456789012','Have Passport','P1234567','F9876543','2020-01-15','2030-01-15','Mr.','Test Father','Business','Mrs.','Test Mother','Homemaker','Test School','CBSE',85.00,2015,NULL,NULL,NULL,NULL,'Completed','Test School','CBSE',88.00,2017,'Completed','B.Tech','Test College',80.00,2021,'Not Started',NULL,NULL,NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,NULL,'Yes',2023,'IELTS','Yes','[{\"examName\":\"GRE\",\"score\":\"320\"}]','MS CS','AI','USA','50000','No',NULL,'No',NULL,NULL,'No',NULL,NULL,NULL,'9876543210','9876543210','test@test.com','9876543211','9876543212','123 Test St','Delhi','110001','Delhi','India','No, Already share on WhatsApp or Email','Other Courses','Other Courses Application Form','2026-01-05 06:37:03','2026-01-05 06:37:03',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'tygfh','hghjmh','3546-04-12','Male','Indian','234576765465','Have Passport','teyrutiytuyrdty','dytuufyiu','6460-05-31',NULL,'Mr.','srtyjhjjghfgh','Business','Mrs.','gfhfjhkhfghgj','Housewife','fygujfhfgf','hgcjhkgjhcfgjh',67.00,2030,'cgghjkgjmhjlhkg','dghjgfgxch',56.00,2029,'Not Applicable',NULL,NULL,NULL,NULL,'Not Started',NULL,NULL,NULL,NULL,'Not Started',NULL,NULL,NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No','[{\"examName\":\"\",\"score\":\"\"}]','srtyuiyhdfyjtuhkgj','fhgfjklhgjcghvj','fhgjklhgjcjhjkl','6','No',NULL,'No',NULL,NULL,'No',NULL,NULL,'yrrtouyuytyrsydtuyui  y dutyu ykjyrhdtjuyoiuykutjd','4435768765','4576789757','rajputvikram470@gmail.com','8766786858','7876879897','257 opp. M.B. collage kumaron ka battha','udaipur','313001','Rajasthan','India','Yes, I want to upload now','Other Courses','Other Courses Application Form','2026-01-05 07:21:13','2026-01-05 07:21:13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'dbgfdghnfgd','wgertetregr','5453-04-23','Male','Indian','352556354653','Don\'t Have Passport',NULL,NULL,NULL,NULL,'Mr.','gdhnhgtshjtsrghsrtthrsg','Business','Mrs.','wwhtrewrge','Service','retgrgg','qerteetr',24.00,2029,'hwy5t43t5yhertr','eert3rgret',234.00,3453,'Not Applicable',NULL,NULL,NULL,NULL,'Not Started',NULL,NULL,NULL,NULL,'Not Started',NULL,NULL,NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No','\"[{\\\"examName\\\":\\\"\\\",\\\"score\\\":\\\"\\\"}]\"','dERT4RHG','Ft4rhteyhrg','etrhtrh','4','No',NULL,'No',NULL,NULL,'No',NULL,NULL,NULL,'2132454545','3435345342','rajputvikram470@gmail.com','3243543544','2132433243','257 opp. M.B. collage kumaron ka battha','udaipur','313001','Rajasthan','India','Yes, I want to upload now','Other Courses','Other Courses Application Form','2026-01-05 07:53:59','2026-01-05 07:53:59','uploads\\other-courses-applications\\WhatsApp Image 2025-12-11 at 13.14.10 (1)-1767599639409-66390961.jpeg','uploads\\other-courses-applications\\WhatsApp Image 2025-11-27 at 19.39.27-1767599639412-231905045.jpeg','uploads\\other-courses-applications\\WhatsApp Image 2025-12-13 at 20.32.42-1767599639420-169403077.jpeg','uploads\\other-courses-applications\\WhatsApp Image 2025-12-11 at 13.14.12-1767599639426-246148608.jpeg','uploads\\other-courses-applications\\WhatsApp Image 2025-12-11 at 13.14.10-1767599639427-40977730.jpeg','uploads\\other-courses-applications\\WhatsApp Image 2025-12-16 at 12.51.30-1767599639435-417448446.jpeg','uploads\\other-courses-applications\\WhatsApp Image 2025-12-11 at 13.14.12-1767599639436-303484580.jpeg','uploads\\other-courses-applications\\img-1762937181353-145342954-1767599639440-342608624.jpg','uploads\\other-courses-applications\\ChatGPT Image Oct 13, 2025, 01_38_11 PM-1767599639445-960041873.png','uploads\\other-courses-applications\\Gemini_Generated_Image_u1g73qu1g73qu1g7-1767599639460-882198127.png','uploads\\other-courses-applications\\WhatsApp Image 2025-12-09 at 20.27.36-1767599639478-217942970.jpeg');
/*!40000 ALTER TABLE `other_courses_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_applications`
--

DROP TABLE IF EXISTS `student_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `nationality` varchar(100) NOT NULL,
  `aadhar` varchar(12) NOT NULL,
  `passport_status` enum('Available','Applied','Yet to Apply') NOT NULL,
  `passport_number` varchar(50) DEFAULT NULL,
  `passport_issuance_date` date DEFAULT NULL,
  `passport_expiry_date` date DEFAULT NULL,
  `file_number` varchar(100) DEFAULT NULL,
  `father_title` enum('Mr.','Dr.','Prof.') DEFAULT 'Mr.',
  `father_name` varchar(100) NOT NULL,
  `father_mobile` varchar(20) NOT NULL,
  `father_occupation` varchar(100) NOT NULL,
  `mother_title` enum('Mrs.','Ms.','Dr.','Prof.') DEFAULT 'Mrs.',
  `mother_name` varchar(100) NOT NULL,
  `mother_mobile` varchar(20) DEFAULT NULL,
  `mother_occupation` varchar(100) DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `school_10_name` varchar(255) NOT NULL,
  `board_10` varchar(100) NOT NULL,
  `percentage_10` decimal(5,2) NOT NULL,
  `year_10` year(4) NOT NULL,
  `school_12_name` varchar(255) NOT NULL,
  `board_12` varchar(100) NOT NULL,
  `percentage_12` decimal(5,2) NOT NULL,
  `year_12` year(4) NOT NULL,
  `neet_scores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`neet_scores`)),
  `other_exam_name` varchar(100) DEFAULT NULL,
  `other_exam_details` text DEFAULT NULL,
  `preferred_country` varchar(100) NOT NULL,
  `preferred_university` varchar(255) NOT NULL,
  `upload_documents` enum('Yes','No') DEFAULT 'No',
  `document_marksheet_10` varchar(255) DEFAULT NULL,
  `document_marksheet_12` varchar(255) DEFAULT NULL,
  `document_neet_scorecard` varchar(255) DEFAULT NULL,
  `document_aadhar_front` varchar(255) DEFAULT NULL,
  `document_aadhar_back` varchar(255) DEFAULT NULL,
  `document_photograph` varchar(255) DEFAULT NULL,
  `document_passport_front` varchar(255) DEFAULT NULL,
  `document_passport_back` varchar(255) DEFAULT NULL,
  `course` varchar(50) NOT NULL DEFAULT 'MBBS',
  `source` varchar(100) NOT NULL DEFAULT 'MBBS Application Form',
  `status` enum('Pending','Under Review','Approved','Rejected','Documents Required') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_status` (`status`),
  KEY `idx_course` (`course`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_applications`
--

LOCK TABLES `student_applications` WRITE;
/*!40000 ALTER TABLE `student_applications` DISABLE KEYS */;
INSERT INTO `student_applications` VALUES (1,'Rahul','Kumar','2005-03-15','9876543210','9876543210','rahul.kumar@example.com','Male','Indian','123456789012','Available','P1234567','2023-01-10','2033-01-09',NULL,'Mr.','Rajesh Kumar','9876543211','Business','Mrs.','Sunita Kumar','9876543212','Teacher','123 Main Street, Sector 15','Delhi','110001','Delhi','India','Delhi Public School','CBSE',92.50,2022,'St. Xavier School','CBSE',88.75,2024,'[{\"year\":\"2024\",\"score\":\"650\"}]','JEE','JEE Main - 85 percentile','Russia','First Moscow State Medical University','Yes',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MBBS','MBBS Application Form','Pending','2026-01-04 19:40:42','2026-01-04 19:40:42');
/*!40000 ALTER TABLE `student_applications` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `telecaller_daily_stats`
--

LOCK TABLES `telecaller_daily_stats` WRITE;
/*!40000 ALTER TABLE `telecaller_daily_stats` DISABLE KEYS */;
INSERT INTO `telecaller_daily_stats` VALUES (1,2,'2026-01-04',11,6,3,0,0,0,0,0.00,27.27,0,'2026-01-04 13:30:00','2026-01-04 13:30:00');
/*!40000 ALTER TABLE `telecaller_daily_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `displayName` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `language` varchar(50) DEFAULT 'English',
  `dateFormat` varchar(50) DEFAULT 'DD/MM/YYYY',
  `timeFormat` varchar(10) DEFAULT '24h',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','admin@pulseeducation.com','$2b$10$0t4LV5qLIj6izeIoDg8rc.3D9ruy108.HkIfvxkvWQwantPnsNn4G','Super Admin','+919999999999','Management','active','[\"all\"]','2025-12-30 19:28:18','2025-12-30 19:36:23'),(2,'Telecaller 1','telecaller@pulseeducation.com','$2b$10$3XlRO/N7fTP3gSr.iqYUg.WoW.HtVaSKUfjuxJuXo4pIoTICcAHNy','Telecaller','+919888888888','Sales','active','[\"view_assigned_leads\", \"add_call_logs\", \"update_lead_status\"]','2025-12-30 19:28:18','2026-01-03 18:42:42'),(3,'vikram','rajputvikram470@gmail.com','$2b$10$FVATfey/NU9xgpWEtxefKOsvhn2y57msa89XHeNYr6jaYO4hN3TyW','Telecaller','+919351445876','Telecalling','active','[\"view_assigned_leads\",\"add_call_logs\",\"update_lead_status\"]','2026-01-04 14:27:31','2026-01-04 14:27:31');
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

-- Dump completed on 2026-01-05 18:12:46
