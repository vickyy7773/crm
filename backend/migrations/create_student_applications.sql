-- Migration: Create student_applications table
-- Description: Stores MBBS and other course application submissions

CREATE TABLE IF NOT EXISTS student_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Personal Details
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  aadhar VARCHAR(12) NOT NULL,

  -- Passport Information
  passport_status ENUM('Available', 'Applied', 'Yet to Apply') NOT NULL,
  passport_number VARCHAR(50),
  passport_issuance_date DATE,
  passport_expiry_date DATE,
  file_number VARCHAR(100),

  -- Family Details
  father_title ENUM('Mr.', 'Dr.', 'Prof.') DEFAULT 'Mr.',
  father_name VARCHAR(100) NOT NULL,
  father_mobile VARCHAR(20) NOT NULL,
  father_occupation VARCHAR(100) NOT NULL,
  mother_title ENUM('Mrs.', 'Ms.', 'Dr.', 'Prof.') DEFAULT 'Mrs.',
  mother_name VARCHAR(100) NOT NULL,
  mother_mobile VARCHAR(20),
  mother_occupation VARCHAR(100),

  -- Address Details
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,

  -- Academic Details - 10th
  school_10_name VARCHAR(255) NOT NULL,
  board_10 VARCHAR(100) NOT NULL,
  percentage_10 DECIMAL(5,2) NOT NULL,
  year_10 YEAR NOT NULL,

  -- Academic Details - 12th
  school_12_name VARCHAR(255) NOT NULL,
  board_12 VARCHAR(100) NOT NULL,
  percentage_12 DECIMAL(5,2) NOT NULL,
  year_12 YEAR NOT NULL,

  -- NEET Scores (JSON array)
  neet_scores JSON,

  -- Other Exam Details
  other_exam_name VARCHAR(100),
  other_exam_details TEXT,

  -- Preferences
  preferred_country VARCHAR(100) NOT NULL,
  preferred_university VARCHAR(255) NOT NULL,
  upload_documents ENUM('Yes', 'No') DEFAULT 'No',

  -- Document References (file paths or metadata)
  document_marksheet_10 VARCHAR(255),
  document_marksheet_12 VARCHAR(255),
  document_neet_scorecard VARCHAR(255),
  document_aadhar_front VARCHAR(255),
  document_aadhar_back VARCHAR(255),
  document_photograph VARCHAR(255),
  document_passport_front VARCHAR(255),
  document_passport_back VARCHAR(255),

  -- Application Metadata
  course VARCHAR(50) NOT NULL DEFAULT 'MBBS',
  source VARCHAR(100) NOT NULL DEFAULT 'MBBS Application Form',
  status ENUM('Pending', 'Under Review', 'Approved', 'Rejected', 'Documents Required') DEFAULT 'Pending',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_mobile (mobile),
  INDEX idx_status (status),
  INDEX idx_course (course),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
