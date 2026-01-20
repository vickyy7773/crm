-- CRM Anti-Abuse Features - Database Schema Updates
-- Run this file after connecting to your database

USE crm_database;

-- 1. Add call_reason to call_history table
ALTER TABLE call_history
ADD COLUMN IF NOT EXISTS call_reason ENUM(
  'Budget Issue',
  'Parents Not Agree',
  'Already Applied Elsewhere',
  'Not Eligible',
  'Language Issue',
  'Wrong Contact',
  'Not Interested (General)',
  'Other'
) NULL AFTER call_outcome;

-- 2. Create telecaller_daily_stats table
CREATE TABLE IF NOT EXISTS telecaller_daily_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  telecaller_id INT NOT NULL,
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (telecaller_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_telecaller_date (telecaller_id, date),
  INDEX idx_date (date),
  INDEX idx_abuse_flag (abuse_flag),
  INDEX idx_telecaller_id (telecaller_id)
);

-- Verify changes
SELECT 'Anti-abuse schema updates completed successfully!' AS message;
