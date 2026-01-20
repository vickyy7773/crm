-- Update user passwords with correct bcrypt hashes

UPDATE users
SET password = '$2b$10$0t4LV5qLIj6izeIoDg8rc.3D9ruy108.HkIfvxkvWQwantPnsNn4G'
WHERE id = 1;

UPDATE users
SET password = '$2b$10$hjAzP1cQydDl8VI/wYt7suA6ND4NibcFgfBN/5pb/5ceBYxngl6EW'
WHERE id = 2;

SELECT id, name, email, 'Password updated!' as status FROM users;
