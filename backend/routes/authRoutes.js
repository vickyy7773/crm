const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { logAudit, getIpAddress } = require('../utils/auditLogger');

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND status = ?',
      [email, 'active']
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = rows[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Remove password from response
    const { password: userPassword, ...userWithoutPassword } = user;

    // Parse permissions if it's a string
    if (typeof userWithoutPassword.permissions === 'string') {
      try {
        userWithoutPassword.permissions = JSON.parse(userWithoutPassword.permissions);
      } catch (e) {
        userWithoutPassword.permissions = [];
      }
    }

    // Log audit trail
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entityType: 'Auth',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: getIpAddress(req),
      userAgent: req.get('user-agent')
    });

    // Return user data
    res.json({
      success: true,
      message: 'Login successful',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// POST /api/auth/register - Register new user (admin only)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      department
    } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    // Check if user already exists
    const [existingRows] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set permissions based on role
    let permissions = [];
    if (role === 'Super Admin') {
      permissions = ['all'];
    } else if (role === 'Telecaller') {
      permissions = ['view_assigned_leads', 'add_call_logs', 'update_lead_status'];
    } else if (role === 'Counsellor') {
      permissions = ['view_transferred_leads', 'update_lead_status'];
    }

    // Insert new user
    const [insertResult] = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, department, status, permissions)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [name, email, hashedPassword, role, phone || null, department || null, JSON.stringify(permissions)]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: insertResult.insertId,
        name,
        email,
        role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, department, status, permissions, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = rows[0];

    // Parse permissions if it's a string
    if (typeof user.permissions === 'string') {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch (e) {
        user.permissions = [];
      }
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/auth/logout - Logout (client-side mostly)
router.post('/logout', async (req, res) => {
  try {
    // Log audit trail if user info provided
    if (req.body.userId) {
      await logAudit({
        userId: req.body.userId,
        userName: req.body.userName || 'Unknown User',
        action: 'LOGOUT',
        entityType: 'Auth',
        entityId: req.body.userId,
        details: { email: req.body.email || null },
        ipAddress: getIpAddress(req),
        userAgent: req.get('user-agent')
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success even if audit logging fails
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
});

module.exports = router;
