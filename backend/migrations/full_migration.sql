-- =============================================
-- CRM Full Database Migration for PostgreSQL
-- Run this on a fresh database to create all tables
-- =============================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Telecaller',
  phone VARCHAR(20),
  department VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  city VARCHAR(100),
  neet VARCHAR(50),
  course VARCHAR(100) DEFAULT 'MBBS',
  destination VARCHAR(100),
  destination_country VARCHAR(100),
  remark TEXT,
  source VARCHAR(100),
  status VARCHAR(100) DEFAULT 'New',
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255) DEFAULT 'Unassigned',
  assigned_date TIMESTAMP,
  last_call_date TIMESTAMP,
  next_followup_date TIMESTAMP,
  is_transferred BOOLEAN DEFAULT FALSE,
  transferred_date TIMESTAMP,
  transferred_to INT REFERENCES users(id) ON DELETE SET NULL,
  transferred_to_name VARCHAR(255),
  follow_up_status VARCHAR(50) DEFAULT 'pending',
  reopen_requested BOOLEAN DEFAULT FALSE,
  imported_date VARCHAR(100),
  notes TEXT,
  course_interested VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_leads_is_transferred ON leads(is_transferred);

-- 3. CALL_HISTORY TABLE
CREATE TABLE IF NOT EXISTS call_history (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  caller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caller_name VARCHAR(255) NOT NULL,
  call_date TIMESTAMP NOT NULL,
  call_remark TEXT NOT NULL,
  call_outcome VARCHAR(100) NOT NULL,
  call_reason VARCHAR(100),
  next_followup_date TIMESTAMP,
  duration VARCHAR(50),
  created_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_call_history_lead_id ON call_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_history_caller_id ON call_history(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_history_call_date ON call_history(call_date);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  lead_id INT DEFAULT NULL REFERENCES leads(id) ON DELETE CASCADE,
  lead_name VARCHAR(255) DEFAULT NULL,
  unread BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(unread);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 5. TELECALLER_DAILY_STATS TABLE
CREATE TABLE IF NOT EXISTS telecaller_daily_stats (
  id SERIAL PRIMARY KEY,
  telecaller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telecaller_name VARCHAR(255),
  telecaller_email VARCHAR(255),
  date DATE NOT NULL,
  total_calls INT DEFAULT 0,
  contacted_count INT DEFAULT 0,
  interested_count INT DEFAULT 0,
  negative_outcome_count INT DEFAULT 0,
  wrong_number_count INT DEFAULT 0,
  not_reachable_count INT DEFAULT 0,
  followups_missed INT DEFAULT 0,
  negative_outcome_ratio DECIMAL(5,2) DEFAULT 0.00,
  interested_ratio DECIMAL(5,2) DEFAULT 0.00,
  abuse_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(telecaller_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON telecaller_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_abuse ON telecaller_daily_stats(abuse_flag);
CREATE INDEX IF NOT EXISTS idx_daily_stats_telecaller ON telecaller_daily_stats(telecaller_id);

-- 6. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(255),
  action VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 7. COMPANY_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS company_settings (
  id INT PRIMARY KEY DEFAULT 1,
  "companyName" VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  currency VARCHAR(10) DEFAULT 'INR',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO company_settings (id, "companyName", email, phone, timezone, currency)
VALUES (1, 'Pulse Education', 'admin@pulseeducation.com', '', 'Asia/Kolkata', 'INR')
ON CONFLICT (id) DO NOTHING;

-- 8. STUDENT_APPLICATIONS TABLE (MBBS)
CREATE TABLE IF NOT EXISTS student_applications (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  mobile VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  gender VARCHAR(20),
  nationality VARCHAR(100),
  aadhar VARCHAR(12),
  passport_status VARCHAR(50),
  passport_number VARCHAR(50),
  passport_issuance_date DATE,
  passport_expiry_date DATE,
  file_number VARCHAR(100),
  father_title VARCHAR(20) DEFAULT 'Mr.',
  father_name VARCHAR(100),
  father_mobile VARCHAR(20),
  father_occupation VARCHAR(100),
  mother_title VARCHAR(20) DEFAULT 'Mrs.',
  mother_name VARCHAR(100),
  mother_mobile VARCHAR(20),
  mother_occupation VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  pincode VARCHAR(10),
  state VARCHAR(100),
  country VARCHAR(100),
  school_10_name VARCHAR(255),
  board_10 VARCHAR(100),
  percentage_10 DECIMAL(5,2),
  year_10 INT,
  school_12_name VARCHAR(255),
  board_12 VARCHAR(100),
  percentage_12 DECIMAL(5,2),
  year_12 INT,
  neet_scores JSON,
  other_exam_name VARCHAR(100),
  other_exam_details TEXT,
  preferred_country VARCHAR(100),
  preferred_university VARCHAR(255),
  upload_documents VARCHAR(10) DEFAULT 'No',
  document_marksheet_10 VARCHAR(255),
  document_marksheet_12 VARCHAR(255),
  document_neet_scorecard VARCHAR(255),
  document_aadhar_front VARCHAR(255),
  document_aadhar_back VARCHAR(255),
  document_photograph VARCHAR(255),
  document_passport_front VARCHAR(255),
  document_passport_back VARCHAR(255),
  course VARCHAR(50) DEFAULT 'MBBS',
  source VARCHAR(100) DEFAULT 'MBBS Application Form',
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_app_email ON student_applications(email);
CREATE INDEX IF NOT EXISTS idx_student_app_mobile ON student_applications(mobile);
CREATE INDEX IF NOT EXISTS idx_student_app_status ON student_applications(status);

-- 9. OTHER_COURSES_APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS other_courses_applications (
  id SERIAL PRIMARY KEY,
  first_middle_name VARCHAR(255),
  last_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(50),
  nationality VARCHAR(100),
  aadhar VARCHAR(12),
  passport_status VARCHAR(50),
  passport_number VARCHAR(50),
  file_number VARCHAR(50),
  passport_issue_date DATE,
  passport_expiry_date DATE,
  father_title VARCHAR(20),
  father_name VARCHAR(100),
  father_occupation VARCHAR(100),
  father_mobile VARCHAR(20),
  mother_title VARCHAR(20),
  mother_name VARCHAR(100),
  mother_occupation VARCHAR(100),
  mother_mobile VARCHAR(20),
  school_10_name VARCHAR(255),
  board_10 VARCHAR(100),
  percentage_10 DECIMAL(5,2),
  year_10 INT,
  school_11_name VARCHAR(255),
  board_11 VARCHAR(100),
  percentage_11 DECIMAL(5,2),
  year_11 INT,
  school_12_status VARCHAR(50),
  school_12_name VARCHAR(255),
  board_12 VARCHAR(100),
  percentage_12 DECIMAL(5,2),
  year_12 INT,
  ug_status VARCHAR(50),
  ug_degree VARCHAR(100),
  ug_college VARCHAR(255),
  ug_percentage DECIMAL(5,2),
  ug_year INT,
  pg_status VARCHAR(50),
  pg_degree VARCHAR(100),
  pg_college VARCHAR(255),
  pg_percentage DECIMAL(5,2),
  pg_year INT,
  any_other_course VARCHAR(50),
  other_course_name VARCHAR(100),
  other_course_college VARCHAR(255),
  other_course_percentage DECIMAL(5,2),
  other_course_year INT,
  gap_between_education VARCHAR(50),
  total_gap_years INT,
  gap_reason TEXT,
  english_exam VARCHAR(50),
  english_exam_year INT,
  english_exam_type VARCHAR(50),
  entrance_exam VARCHAR(50),
  entrance_exams TEXT,
  degree_name VARCHAR(100),
  branch_stream VARCHAR(100),
  preferred_countries VARCHAR(500),
  max_budget VARCHAR(50),
  work_experience VARCHAR(50),
  work_duration VARCHAR(50),
  visa_applied_prior VARCHAR(50),
  visa_country_name VARCHAR(100),
  visa_how_many_times INT,
  previous_visa_refusal VARCHAR(50),
  refusal_reason TEXT,
  refusal_country_name VARCHAR(100),
  comments TEXT,
  mobile VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  pincode VARCHAR(10),
  state VARCHAR(100),
  country VARCHAR(100),
  upload_documents VARCHAR(100),
  document_marksheet_10 VARCHAR(255),
  document_marksheet_12 VARCHAR(255),
  document_ug_degree VARCHAR(255),
  document_pg_degree VARCHAR(255),
  document_aadhar_card VARCHAR(255),
  document_passport_front VARCHAR(255),
  document_passport_back VARCHAR(255),
  document_photograph VARCHAR(255),
  document_english_exam_cert VARCHAR(255),
  document_entrance_exam_scorecard VARCHAR(255),
  document_work_exp_certificate VARCHAR(255),
  course VARCHAR(100) DEFAULT 'Other Courses',
  source VARCHAR(100) DEFAULT 'Other Courses Application Form',
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_other_app_email ON other_courses_applications(email);
CREATE INDEX IF NOT EXISTS idx_other_app_mobile ON other_courses_applications(mobile);
CREATE INDEX IF NOT EXISTS idx_other_app_status ON other_courses_applications(status);

-- =============================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin123 (bcrypt hashed)
-- =============================================
INSERT INTO users (name, email, password, role, status)
VALUES (
  'Admin',
  'admin@pulseeducation.com',
  '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkHh0ZMEq5r6J5FYXfNzGJ3YD4mHe',
  'Super Admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- =============================================
-- MIGRATION COMPLETE!
-- Tables created: users, leads, call_history, notifications,
-- telecaller_daily_stats, audit_logs, company_settings,
-- student_applications, other_courses_applications
-- Default admin user: admin@pulseeducation.com / admin123
-- =============================================
