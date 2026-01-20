const { pool } = require('../config/database');

// Middleware to authenticate user (simple version without JWT)
// In production, use JWT tokens
const authenticateUser = async (req, res, next) => {
  try {
    // Get user ID from header (in production, extract from JWT token)
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide user ID.'
      });
    }

    // Get user from database
    const [users] = await pool.query(
      'SELECT id, name, email, role, permissions, status FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user. User not found.'
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive.'
      });
    }

    // Parse permissions if it's a string
    if (typeof user.permissions === 'string') {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch (e) {
        user.permissions = [];
      }
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

module.exports = { authenticateUser };
