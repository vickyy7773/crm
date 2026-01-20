-- CRM Improvements - Database Schema Updates
-- Run this file after connecting to your database

USE crm_database;

-- 1. Update call_history table: Add new call outcomes
ALTER TABLE call_history
MODIFY call_outcome ENUM(
  'Contacted',
  'Interested',
  'Call Back',
  'Not Interested',
  'Wrong Number',
  'Converted',
  'Not Reachable',
  'Switched Off',
  'Busy',
  'No Answer'
) NOT NULL;

-- 2. Update leads table: Add follow_up_status and reopen_requested
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS follow_up_status ENUM('pending', 'missed') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reopen_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transferred_to_name VARCHAR(255) NULL;

-- 3. Add audit fields to call_history table
ALTER TABLE call_history
ADD COLUMN IF NOT EXISTS created_ip VARCHAR(45) NULL,
ADD COLUMN IF NOT EXISTS user_agent TEXT NULL;

-- 4. Update leads table status enum to include reopen_requested
ALTER TABLE leads
MODIFY status ENUM(
  'New',
  'Contacted',
  'Interested',
  'Call Back',
  'Not Interested',
  'Wrong Number',
  'Converted',
  'Reopen Requested'
) DEFAULT 'New';

-- Verify changes
SELECT 'Schema updates completed successfully!' AS message;
