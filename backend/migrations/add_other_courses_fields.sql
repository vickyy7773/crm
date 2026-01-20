-- Migration: Add new fields to other_courses_applications table
-- Date: 2026-01-05

USE crm_database;

ALTER TABLE other_courses_applications

-- Passport Details (Phase 1)
ADD COLUMN passport_number VARCHAR(50) NULL AFTER passport_status,
ADD COLUMN file_number VARCHAR(50) NULL AFTER passport_number,
ADD COLUMN passport_issue_date DATE NULL AFTER file_number,
ADD COLUMN passport_expiry_date DATE NULL AFTER passport_issue_date,

-- UG Details (Phase 2)
ADD COLUMN ug_status VARCHAR(50) NULL AFTER year_12,
ADD COLUMN ug_degree VARCHAR(100) NULL AFTER ug_status,
ADD COLUMN ug_college VARCHAR(255) NULL AFTER ug_degree,
ADD COLUMN ug_percentage DECIMAL(5,2) NULL AFTER ug_college,
ADD COLUMN ug_year INT NULL AFTER ug_percentage,

-- PG Details (Phase 2)
ADD COLUMN pg_status VARCHAR(50) NULL AFTER ug_year,
ADD COLUMN pg_degree VARCHAR(100) NULL AFTER pg_status,
ADD COLUMN pg_college VARCHAR(255) NULL AFTER pg_degree,
ADD COLUMN pg_percentage DECIMAL(5,2) NULL AFTER pg_college,
ADD COLUMN pg_year INT NULL AFTER pg_percentage,

-- Other Course Details (Phase 2)
ADD COLUMN other_course_name VARCHAR(100) NULL AFTER any_other_course,
ADD COLUMN other_course_college VARCHAR(255) NULL AFTER other_course_name,
ADD COLUMN other_course_percentage DECIMAL(5,2) NULL AFTER other_course_college,
ADD COLUMN other_course_year INT NULL AFTER other_course_percentage,

-- Gap Year Details (Phase 2)
ADD COLUMN total_gap_years INT NULL AFTER gap_between_education,
ADD COLUMN gap_reason TEXT NULL AFTER total_gap_years,

-- English Exam Details (Phase 2)
ADD COLUMN english_exam_year INT NULL AFTER english_exam,
ADD COLUMN english_exam_type VARCHAR(50) NULL AFTER english_exam_year,

-- Entrance Exams (Phase 2) - Stored as JSON array
ADD COLUMN entrance_exams TEXT NULL AFTER entrance_exam,

-- Work Experience Details (Phase 3)
ADD COLUMN work_duration VARCHAR(50) NULL AFTER work_experience,

-- Visa Details (Phase 3)
ADD COLUMN visa_country_name VARCHAR(100) NULL AFTER visa_applied_prior,
ADD COLUMN visa_how_many_times INT NULL AFTER visa_country_name,
ADD COLUMN refusal_reason TEXT NULL AFTER previous_visa_refusal,
ADD COLUMN refusal_country_name VARCHAR(100) NULL AFTER refusal_reason;

-- Verify the changes
DESCRIBE other_courses_applications;
