const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET company settings
router.get('/company', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM company_settings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      // Return default values if no settings exist
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
      data: result.rows[0]
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

    // Check if settings exist
    const existing = await pool.query(
      'SELECT id FROM company_settings WHERE id = 1'
    );

    if (existing.rows.length === 0) {
      // Insert new settings
      await pool.query(
        `INSERT INTO company_settings (id, companyName, email, phone, address, website, timezone, currency, updated_at)
         VALUES (1, $1, $2, $3, $4, $5, $6, $7, NOW())`,
        [companyName, email, phone, address, website, timezone, currency]
      );
    } else {
      // Update existing settings
      await pool.query(
        `UPDATE company_settings
         SET companyName = $1, email = $2, phone = $3, address = $4, website = $5, timezone = $6, currency = $7, updated_at = NOW()
         WHERE id = 1`,
        [companyName, email, phone, address, website, timezone, currency]
      );
    }

    const updatedSettings = await pool.query(
      'SELECT * FROM company_settings WHERE id = 1'
    );

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: updatedSettings.rows[0]
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

    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default values if no settings exist
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
      data: result.rows[0]
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

    // Check if settings exist
    const existing = await pool.query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length === 0) {
      // Insert new settings
      await pool.query(
        `INSERT INTO user_settings (user_id, displayName, email, language, dateFormat, timeFormat, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, displayName, email, language, dateFormat, timeFormat]
      );
    } else {
      // Update existing settings
      await pool.query(
        `UPDATE user_settings
         SET displayName = $1, email = $2, language = $3, dateFormat = $4, timeFormat = $5, updated_at = NOW()
         WHERE user_id = $6`,
        [displayName, email, language, dateFormat, timeFormat, userId]
      );
    }

    const updatedSettings = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'User settings updated successfully',
      data: updatedSettings.rows[0]
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
