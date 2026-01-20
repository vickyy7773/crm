-- Create notifications table for dynamic notification system
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,  -- NULL means notification is for all users
  type ENUM('new_lead', 'assignment', 'status_change', 'call_log', 'lead_converted') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  lead_id INT DEFAULT NULL,  -- Reference to the lead this notification is about
  lead_name VARCHAR(255) DEFAULT NULL,  -- Store lead name for quick display
  unread BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_unread (unread),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for common queries (user's unread notifications)
CREATE INDEX idx_user_unread ON notifications(user_id, unread, created_at);
