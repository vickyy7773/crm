-- Insert second dummy student application for testing
INSERT INTO student_applications (
  first_name, last_name, date_of_birth, mobile, whatsapp, email, gender, nationality, aadhar,
  passport_status, file_number,
  father_title, father_name, father_mobile, father_occupation,
  mother_title, mother_name, mother_mobile, mother_occupation,
  address, city, pincode, state, country,
  school_10_name, board_10, percentage_10, year_10,
  school_12_name, board_12, percentage_12, year_12,
  neet_scores,
  preferred_country, preferred_university, upload_documents,
  course, source, status
) VALUES (
  'Priya', 'Sharma', '2004-07-22', '8765432109', '8765432109', 'priya.sharma@example.com', 'Female', 'Indian', '987654321098',
  'Applied', 'FILE123456',
  'Dr.', 'Amit Sharma', '8765432100', 'Doctor',
  'Mrs.', 'Neha Sharma', '8765432101', 'Homemaker',
  '456 Park Avenue, Phase 2', 'Mumbai', '400001', 'Maharashtra', 'India',
  'Mumbai International School', 'ICSE', 94.2, 2021,
  'Wilson College', 'CBSE', 91.8, 2023,
  '[{"year":"2023","score":"685"},{"year":"2024","score":"695"}]',
  'Ukraine', 'Kyiv Medical University', 'No',
  'MBBS', 'MBBS Application Form', 'Under Review'
);
