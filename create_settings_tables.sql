-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id INT PRIMARY KEY,
  companyName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  displayName VARCHAR(255),
  email VARCHAR(255),
  language VARCHAR(50) DEFAULT 'English',
  dateFormat VARCHAR(50) DEFAULT 'DD/MM/YYYY',
  timeFormat VARCHAR(10) DEFAULT '24h',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user (user_id)
);

-- Insert default company settings
INSERT INTO company_settings (id, companyName, email, phone, address, website, timezone, currency)
VALUES (1, 'Study Abroad Consultancy', 'contact@studyabroad.com', '+91 9876543210', 'Udaipur, Rajasthan, India', 'www.studyabroad.com', 'Asia/Kolkata', 'INR')
ON DUPLICATE KEY UPDATE id = id;
