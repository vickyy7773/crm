// JWT Secret Generator
// Run this file to generate a secure random JWT secret
// Usage: node generate-jwt-secret.js

const crypto = require('crypto');

console.log('\n===========================================');
console.log('JWT SECRET KEY GENERATOR');
console.log('===========================================\n');

// Generate a secure random 32-byte string
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('Your secure JWT secret key:\n');
console.log(jwtSecret);
console.log('\n');
console.log('Copy this key and add it to your .env file:');
console.log('JWT_SECRET=' + jwtSecret);
console.log('\n===========================================\n');
console.log('⚠️  IMPORTANT: Keep this secret secure!');
console.log('   Never commit it to version control.');
console.log('   Never share it publicly.');
console.log('\n===========================================\n');
