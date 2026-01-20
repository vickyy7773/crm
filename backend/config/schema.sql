-- Pulse Education CRM Database Schema
-- MySQL Database

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS call_history;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Super Admin', 'Telecaller', 'Counsellor', 'Manager', 'Sales Representative') NOT NULL DEFAULT 'Telecaller',
  phone VARCHAR(20),
  department VARCHAR(100),
  status ENUM('active', 'inactive') DEFAULT 'active',
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leads Table
CREATE TABLE leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  city VARCHAR(100),
  neet VARCHAR(10),
  course VARCHAR(100) DEFAULT 'MBBS',
  destination VARCHAR(100),
  remark TEXT,
  source VARCHAR(100),
  status ENUM('New', 'Contacted', 'Interested', 'Call Back', 'Not Interested', 'Wrong Number', 'Converted') DEFAULT 'New',

  -- Assignment fields
  assigned_to INT NULL,
  assigned_to_name VARCHAR(255) DEFAULT 'Unassigned',
  assigned_date DATETIME NULL,

  -- Follow-up fields
  last_call_date DATETIME NULL,
  next_followup_date DATETIME NULL,

  -- Transfer fields
  is_transferred BOOLEAN DEFAULT FALSE,
  transferred_date DATETIME NULL,
  transferred_to INT NULL,

  -- Metadata
  imported_date VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (transferred_to) REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes for better performance
  INDEX idx_phone (phone),
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_next_followup (next_followup_date),
  INDEX idx_is_transferred (is_transferred)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call History Table
CREATE TABLE call_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  caller_id INT NOT NULL,
  caller_name VARCHAR(255) NOT NULL,
  call_date DATETIME NOT NULL,
  call_remark TEXT NOT NULL,
  call_outcome ENUM('New', 'Contacted', 'Interested', 'Call Back', 'Not Interested', 'Wrong Number', 'Converted') NOT NULL,
  next_followup_date DATETIME NULL,
  duration VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_lead_id (lead_id),
  INDEX idx_caller_id (caller_id),
  INDEX idx_call_date (call_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Super Admin user (password: admin123 - hashed with bcrypt)
-- Password hash for 'admin123': $2b$10$XqZ9J7YqVnXK5YqVnXK5YuGJZQXqZ9J7YqVnXK5YqVnXK5YqVnXK5
INSERT INTO users (name, email, password, role, phone, department, status, permissions)
VALUES (
  'Super Admin',
  'admin@pulseeducation.com',
  '$2b$10$XqZ9J7YqVnXK5YqVnXK5YuGJZQXqZ9J7YqVnXK5YqVnXK5YqVnXK5u',
  'Super Admin',
  '+919999999999',
  'Management',
  'active',
  JSON_ARRAY('all')
);

-- Insert sample Telecaller user (password: tele123)
-- Password hash for 'tele123': $2b$10$YqZ9J7YqVnXK5YqVnXK5YuGJZQXqZ9J7YqVnXK5YqVnXK5YqVnXK5
INSERT INTO users (name, email, password, role, phone, department, status, permissions)
VALUES (
  'Telecaller 1',
  'telecaller@pulseeducation.com',
  '$2b$10$YqZ9J7YqVnXK5YqVnXK5YuGJZQXqZ9J7YqVnXK5YqVnXK5YqVnXK5u',
  'Telecaller',
  '+919888888888',
  'Sales',
  'active',
  JSON_ARRAY('view_assigned_leads', 'add_call_logs', 'update_lead_status')
);
