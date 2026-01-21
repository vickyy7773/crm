-- PostgreSQL Schema for CRM Database
-- Converted from MySQL/MariaDB to PostgreSQL for Render Deployment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom ENUM types
CREATE TYPE user_role AS ENUM ('Super Admin', 'Telecaller', 'Counsellor', 'Manager', 'Sales Representative');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Interested', 'Call Back', 'Not Interested', 'Wrong Number', 'Converted', 'Reopen Requested');
CREATE TYPE follow_up_status_type AS ENUM ('pending', 'missed');
CREATE TYPE call_outcome_type AS ENUM ('Contacted', 'Interested', 'Call Back', 'Not Interested', 'Wrong Number', 'Converted', 'Not Reachable', 'Switched Off', 'Busy', 'No Answer');
CREATE TYPE call_reason_type AS ENUM ('Budget Issue', 'Parents Not Agree', 'Already Applied Elsewhere', 'Not Eligible', 'Language Issue', 'Wrong Contact', 'Not Interested (General)', 'Other');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');
CREATE TYPE audit_entity AS ENUM ('Lead', 'User', 'CallHistory', 'Auth', 'Setting');
CREATE TYPE notification_type AS ENUM ('new_lead', 'assignment', 'status_change', 'call_log', 'lead_converted');
CREATE TYPE passport_status_type AS ENUM ('Available', 'Applied', 'Yet to Apply', 'Have Passport', 'Don''t Have Passport');
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE title_type AS ENUM ('Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.');
CREATE TYPE application_status_type AS ENUM ('Pending', 'Under Review', 'Approved', 'Rejected', 'Documents Required');

-- Table: users (Must be created first due to foreign key references)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Telecaller',
    phone VARCHAR(20),
    department VARCHAR(100),
    status user_status DEFAULT 'active',
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Table: leads
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100),
    neet VARCHAR(10),
    course VARCHAR(100) DEFAULT 'MBBS',
    destination VARCHAR(100),
    remark TEXT,
    notes TEXT,
    source VARCHAR(100),
    status lead_status DEFAULT 'New',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(255) DEFAULT 'Unassigned',
    assigned_date TIMESTAMP,
    last_call_date TIMESTAMP,
    next_followup_date TIMESTAMP,
    is_transferred BOOLEAN DEFAULT FALSE,
    transferred_date TIMESTAMP,
    transferred_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    transferred_to_name VARCHAR(255),
    imported_date VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    follow_up_status follow_up_status_type DEFAULT 'pending',
    reopen_requested BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_next_followup ON leads(next_followup_date);
CREATE INDEX idx_leads_is_transferred ON leads(is_transferred);
CREATE INDEX idx_leads_transferred_to ON leads(transferred_to);

-- Table: call_history
CREATE TABLE call_history (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    caller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caller_name VARCHAR(255) NOT NULL,
    call_date TIMESTAMP NOT NULL,
    call_remark TEXT NOT NULL,
    call_outcome call_outcome_type NOT NULL,
    call_reason call_reason_type,
    next_followup_date TIMESTAMP,
    duration VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_ip VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_call_history_lead_id ON call_history(lead_id);
CREATE INDEX idx_call_history_caller_id ON call_history(caller_id);
CREATE INDEX idx_call_history_call_date ON call_history(call_date);

-- Table: audit_logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_name VARCHAR(255),
    action audit_action NOT NULL,
    entity_type audit_entity NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Table: notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    lead_name VARCHAR(255),
    unread BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(unread);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_lead_id ON notifications(lead_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, unread, created_at);

-- Table: company_settings
CREATE TABLE company_settings (
    id INTEGER PRIMARY KEY,
    companyName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_settings
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    displayName VARCHAR(255),
    email VARCHAR(255),
    language VARCHAR(50) DEFAULT 'English',
    dateFormat VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    timeFormat VARCHAR(10) DEFAULT '24h',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Table: telecaller_daily_stats
CREATE TABLE telecaller_daily_stats (
    id SERIAL PRIMARY KEY,
    telecaller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    contacted_count INTEGER DEFAULT 0,
    interested_count INTEGER DEFAULT 0,
    negative_outcome_count INTEGER DEFAULT 0,
    wrong_number_count INTEGER DEFAULT 0,
    not_reachable_count INTEGER DEFAULT 0,
    followups_missed INTEGER DEFAULT 0,
    negative_outcome_ratio DECIMAL(5,2) DEFAULT 0.00,
    interested_ratio DECIMAL(5,2) DEFAULT 0.00,
    abuse_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(telecaller_id, date)
);

CREATE INDEX idx_telecaller_stats_date ON telecaller_daily_stats(date);
CREATE INDEX idx_telecaller_stats_abuse ON telecaller_daily_stats(abuse_flag);
CREATE INDEX idx_telecaller_stats_telecaller ON telecaller_daily_stats(telecaller_id);

-- Table: student_applications
CREATE TABLE student_applications (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    gender gender_type NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    aadhar VARCHAR(12) NOT NULL,
    passport_status passport_status_type NOT NULL,
    passport_number VARCHAR(50),
    passport_issuance_date DATE,
    passport_expiry_date DATE,
    file_number VARCHAR(100),
    father_title title_type DEFAULT 'Mr.',
    father_name VARCHAR(100) NOT NULL,
    father_mobile VARCHAR(20) NOT NULL,
    father_occupation VARCHAR(100) NOT NULL,
    mother_title title_type DEFAULT 'Mrs.',
    mother_name VARCHAR(100) NOT NULL,
    mother_mobile VARCHAR(20),
    mother_occupation VARCHAR(100),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    school_10_name VARCHAR(255) NOT NULL,
    board_10 VARCHAR(100) NOT NULL,
    percentage_10 DECIMAL(5,2) NOT NULL,
    year_10 VARCHAR(4) NOT NULL,
    school_12_name VARCHAR(255) NOT NULL,
    board_12 VARCHAR(100) NOT NULL,
    percentage_12 DECIMAL(5,2) NOT NULL,
    year_12 VARCHAR(4) NOT NULL,
    neet_scores JSONB,
    other_exam_name VARCHAR(100),
    other_exam_details TEXT,
    preferred_country VARCHAR(100) NOT NULL,
    preferred_university VARCHAR(255) NOT NULL,
    upload_documents VARCHAR(10) DEFAULT 'No',
    document_marksheet_10 VARCHAR(255),
    document_marksheet_12 VARCHAR(255),
    document_neet_scorecard VARCHAR(255),
    document_aadhar_front VARCHAR(255),
    document_aadhar_back VARCHAR(255),
    document_photograph VARCHAR(255),
    document_passport_front VARCHAR(255),
    document_passport_back VARCHAR(255),
    course VARCHAR(50) NOT NULL DEFAULT 'MBBS',
    source VARCHAR(100) NOT NULL DEFAULT 'MBBS Application Form',
    status application_status_type DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_apps_email ON student_applications(email);
CREATE INDEX idx_student_apps_mobile ON student_applications(mobile);
CREATE INDEX idx_student_apps_status ON student_applications(status);
CREATE INDEX idx_student_apps_course ON student_applications(course);
CREATE INDEX idx_student_apps_created ON student_applications(created_at);

-- Table: other_courses_applications
CREATE TABLE other_courses_applications (
    id SERIAL PRIMARY KEY,
    first_middle_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    aadhar VARCHAR(12) NOT NULL,
    passport_status VARCHAR(50) NOT NULL,
    passport_number VARCHAR(50),
    file_number VARCHAR(50),
    passport_issue_date DATE,
    passport_expiry_date DATE,
    father_title VARCHAR(10),
    father_name VARCHAR(100) NOT NULL,
    father_occupation VARCHAR(100) NOT NULL,
    mother_title VARCHAR(10),
    mother_name VARCHAR(100) NOT NULL,
    mother_occupation VARCHAR(100),
    school_10_name VARCHAR(200) NOT NULL,
    board_10 VARCHAR(100) NOT NULL,
    percentage_10 DECIMAL(5,2) NOT NULL,
    year_10 INTEGER NOT NULL,
    school_11_name VARCHAR(200),
    board_11 VARCHAR(100),
    percentage_11 DECIMAL(5,2),
    year_11 INTEGER,
    school_12_status VARCHAR(50) NOT NULL,
    school_12_name VARCHAR(200),
    board_12 VARCHAR(100),
    percentage_12 DECIMAL(5,2),
    year_12 INTEGER,
    ug_status VARCHAR(50),
    ug_degree VARCHAR(100),
    ug_college VARCHAR(255),
    ug_percentage DECIMAL(5,2),
    ug_year INTEGER,
    pg_status VARCHAR(50),
    pg_degree VARCHAR(100),
    pg_college VARCHAR(255),
    pg_percentage DECIMAL(5,2),
    pg_year INTEGER,
    any_other_course VARCHAR(10) DEFAULT 'No',
    other_course_name VARCHAR(100),
    other_course_college VARCHAR(255),
    other_course_percentage DECIMAL(5,2),
    other_course_year INTEGER,
    gap_between_education VARCHAR(10) DEFAULT 'No',
    total_gap_years INTEGER,
    gap_reason TEXT,
    english_exam VARCHAR(10) DEFAULT 'No',
    english_exam_year INTEGER,
    english_exam_type VARCHAR(50),
    entrance_exam VARCHAR(10) DEFAULT 'No',
    entrance_exams TEXT,
    degree_name VARCHAR(200),
    branch_stream VARCHAR(200),
    preferred_countries VARCHAR(300),
    max_budget VARCHAR(100),
    work_experience VARCHAR(10) DEFAULT 'No',
    work_duration VARCHAR(50),
    visa_applied_prior VARCHAR(10) DEFAULT 'No',
    visa_country_name VARCHAR(100),
    visa_how_many_times INTEGER,
    previous_visa_refusal VARCHAR(10) DEFAULT 'No',
    refusal_reason TEXT,
    refusal_country_name VARCHAR(100),
    comments TEXT,
    mobile VARCHAR(10) NOT NULL,
    whatsapp VARCHAR(10),
    email VARCHAR(100) NOT NULL,
    father_mobile VARCHAR(10) NOT NULL,
    mother_mobile VARCHAR(10),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    upload_documents VARCHAR(100) DEFAULT 'No, Already share on WhatsApp or Email',
    course VARCHAR(50) DEFAULT 'Other Courses',
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
    document_work_exp_certificate VARCHAR(255)
);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telecaller_stats_updated_at BEFORE UPDATE ON telecaller_daily_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_apps_updated_at BEFORE UPDATE ON student_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_other_courses_updated_at BEFORE UPDATE ON other_courses_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone, department, status, permissions)
VALUES
('Super Admin', 'admin@pulseeducation.com', '$2b$10$0t4LV5qLIj6izeIoDg8rc.3D9ruy108.HkIfvxkvWQwantPnsNn4G', 'Super Admin', '+919999999999', 'Management', 'active', '["all"]'),
('Telecaller 1', 'telecaller@pulseeducation.com', '$2b$10$3XlRO/N7fTP3gSr.iqYUg.WoW.HtVaSKUfjuxJuXo4pIoTICcAHNy', 'Telecaller', '+919888888888', 'Sales', 'active', '["view_assigned_leads", "add_call_logs", "update_lead_status"]');

-- Insert default company settings
INSERT INTO company_settings (id, companyName, email, phone, address, website, timezone, currency)
VALUES (1, 'Pulse Education', 'contact@pulseeducation.com', '+91 XXXXXXXXXX', 'India', 'www.pulseeducation.com', 'Asia/Kolkata', 'INR');

-- Schema creation complete
