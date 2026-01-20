-- Insert dummy student application for testing
INSERT INTO student_applications (
  first_name, last_name, date_of_birth, mobile, whatsapp, email, gender, nationality, aadhar,
  passport_status, passport_number, passport_issuance_date, passport_expiry_date,
  father_title, father_name, father_mobile, father_occupation,
  mother_title, mother_name, mother_mobile, mother_occupation,
  address, city, pincode, state, country,
  school_10_name, board_10, percentage_10, year_10,
  school_12_name, board_12, percentage_12, year_12,
  neet_scores, other_exam_name, other_exam_details,
  preferred_country, preferred_university, upload_documents,
  course, source, status
) VALUES (
  'Rahul', 'Kumar', '2005-03-15', '9876543210', '9876543210', 'rahul.kumar@example.com', 'Male', 'Indian', '123456789012',
  'Available', 'P1234567', '2023-01-10', '2033-01-09',
  'Mr.', 'Rajesh Kumar', '9876543211', 'Business',
  'Mrs.', 'Sunita Kumar', '9876543212', 'Teacher',
  '123 Main Street, Sector 15', 'Delhi', '110001', 'Delhi', 'India',
  'Delhi Public School', 'CBSE', 92.5, 2022,
  'St. Xavier School', 'CBSE', 88.75, 2024,
  '[{"year":"2024","score":"650"}]', 'JEE', 'JEE Main - 85 percentile',
  'Russia', 'First Moscow State Medical University', 'Yes',
  'MBBS', 'MBBS Application Form', 'Pending'
);
