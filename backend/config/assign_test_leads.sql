-- Assign Test Leads to Telecaller
-- This script assigns the first 5 leads to Telecaller 1 (ID: 2)

-- Assign leads with different statuses and follow-up dates
UPDATE leads
SET
  assigned_to = 2,
  assigned_date = NOW(),
  next_followup_date = CURDATE()  -- Today's follow-up
WHERE id = 1;

UPDATE leads
SET
  assigned_to = 2,
  assigned_date = NOW(),
  next_followup_date = DATE_SUB(CURDATE(), INTERVAL 2 DAY)  -- Overdue by 2 days
WHERE id = 2;

UPDATE leads
SET
  assigned_to = 2,
  assigned_date = NOW(),
  next_followup_date = CURDATE()  -- Today's follow-up
WHERE id = 3;

UPDATE leads
SET
  assigned_to = 2,
  assigned_date = NOW(),
  next_followup_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY),  -- Future follow-up
  status = 'Contacted'
WHERE id = 4;

UPDATE leads
SET
  assigned_to = 2,
  assigned_date = NOW(),
  next_followup_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY),  -- Overdue by 1 day
  status = 'Call Back'
WHERE id = 5;

-- Check the assigned leads
SELECT
  id,
  name,
  phone,
  city,
  destination,
  status,
  assigned_to,
  next_followup_date,
  CASE
    WHEN next_followup_date < CURDATE() THEN 'OVERDUE'
    WHEN DATE(next_followup_date) = CURDATE() THEN 'TODAY'
    ELSE 'UPCOMING'
  END as followup_status
FROM leads
WHERE assigned_to = 2
ORDER BY next_followup_date ASC;
