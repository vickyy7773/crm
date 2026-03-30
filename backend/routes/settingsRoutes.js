const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET company settings
router.get('/company', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM company_settings WHERE id = 1'
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          companyName: 'Study Abroad Consultancy',
          email: 'contact@studyabroad.com',
          phone: '+91 9876543210',
          address: 'Udaipur, Rajasthan, India',
          website: 'www.studyabroad.com',
          timezone: 'Asia/Kolkata',
          currency: 'INR'
        }
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company settings',
      error: error.message
    });
  }
});

// PUT update company settings
router.put('/company', async (req, res) => {
  try {
    const { companyName, email, phone, address, website, timezone, currency } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM company_settings WHERE id = 1'
    );

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO company_settings (id, companyName, email, phone, address, website, timezone, currency, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [companyName, email, phone, address, website, timezone, currency]
      );
    } else {
      await pool.query(
        `UPDATE company_settings
         SET companyName = ?, email = ?, phone = ?, address = ?, website = ?, timezone = ?, currency = ?, updated_at = NOW()
         WHERE id = 1`,
        [companyName, email, phone, address, website, timezone, currency]
      );
    }

    const [updatedRows] = await pool.query(
      'SELECT * FROM company_settings WHERE id = 1'
    );

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company settings',
      error: error.message
    });
  }
});

// GET user settings
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          displayName: 'Admin User',
          email: 'admin@studyabroad.com',
          language: 'English',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h'
        }
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user settings',
      error: error.message
    });
  }
});

// PUT update user settings
router.put('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, email, language, dateFormat, timeFormat } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM user_settings WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO user_settings (user_id, displayName, email, language, dateFormat, timeFormat, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, displayName, email, language, dateFormat, timeFormat]
      );
    } else {
      await pool.query(
        `UPDATE user_settings
         SET displayName = ?, email = ?, language = ?, dateFormat = ?, timeFormat = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [displayName, email, language, dateFormat, timeFormat, userId]
      );
    }

    const [updatedRows] = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'User settings updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings',
      error: error.message
    });
  }
});

module.exports = router;
