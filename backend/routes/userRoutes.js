const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

// GET /debug-permissions - Debug endpoint to check permissions
router.get('/debug-permissions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, permissions FROM users ORDER BY created_at DESC'
    );

    // Parse permissions for each user
    const usersWithParsedPermissions = rows.map(user => {
      let permissions = user.permissions;
      if (typeof permissions === 'string') {
        try {
          permissions = JSON.parse(permissions);
        } catch (e) {
          permissions = [];
        }
      }
      return {
        ...user,
        permissions: permissions,
        hasCreateLead: Array.isArray(permissions) && permissions.includes('create_lead')
      };
    });

    res.json({
      success: true,
      count: usersWithParsedPermissions.length,
      data: usersWithParsedPermissions
    });
  } catch (error) {
    console.error('Debug permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: error.message
    });
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, department, status, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// GET single user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, department, status, permissions, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
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
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// GET all telecallers (for lead assignment dropdown)
router.get('/role/telecaller', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, status
       FROM users
       WHERE role = ? AND status = ?
       ORDER BY name ASC`,
      ['Telecaller', 'active']
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Get telecallers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching telecallers',
      error: error.message
    });
  }
});

// GET user statistics (for admin dashboard)
router.get('/:id/statistics', async (req, res) => {
  try {
    const userId = req.params.id;

    const [totalAssignedRows] = await pool.query(
      'SELECT COUNT(*) as count FROM leads WHERE assigned_to = ?',
      [userId]
    );

    const [totalCallsRows] = await pool.query(
      'SELECT COUNT(*) as count FROM call_history WHERE caller_id = ?',
      [userId]
    );

    const [interestedRows] = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE assigned_to = ? AND status = ?`,
      [userId, 'Interested']
    );

    const [conversionsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE assigned_to = ? AND status = ?`,
      [userId, 'Converted']
    );

    // Get contacted leads (leads with at least 1 call log)
    const [contactedRows] = await pool.query(
      `SELECT COUNT(DISTINCT lead_id) as count FROM call_history
       WHERE caller_id = ?`,
      [userId]
    );

    const totalAssignedCount = totalAssignedRows[0].count;
    const contactedCount = contactedRows[0].count;

    // Correct conversion rate: conversions / contacted leads (not total assigned)
    const conversionRate = contactedCount > 0
      ? ((conversionsRows[0].count / contactedCount) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        totalAssigned: parseInt(totalAssignedCount),
        totalCalls: parseInt(totalCallsRows[0].count),
        interestedLeads: parseInt(interestedRows[0].count),
        conversions: parseInt(conversionsRows[0].count),
        conversionRate: parseFloat(conversionRate)
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// GET abuse pattern check for telecaller (last 30 calls)
router.get('/:id/abuse-check', async (req, res) => {
  try {
    const userId = req.params.id;

    // Get last 30 call logs for this telecaller
    const [callLogs] = await pool.query(
      `SELECT call_outcome FROM call_history
       WHERE caller_id = ?
       ORDER BY call_date DESC
       LIMIT 30`,
      [userId]
    );

    if (callLogs.length < 10) {
      return res.json({
        success: true,
        data: {
          totalCalls: callLogs.length,
          abuseFlag: false,
          message: 'Insufficient data for pattern analysis (minimum 10 calls required)'
        }
      });
    }

    // Count outcomes
    const totalCalls = callLogs.length;
    const negativeOutcomes = ['Not Interested', 'Wrong Number', 'Not Reachable', 'Switched Off'];
    const positiveOutcomes = ['Interested', 'Converted'];

    let negativeCount = 0;
    let interestedCount = 0;

    callLogs.forEach(log => {
      if (negativeOutcomes.includes(log.call_outcome)) {
        negativeCount++;
      }
      if (positiveOutcomes.includes(log.call_outcome)) {
        interestedCount++;
      }
    });

    const negativeRatio = (negativeCount / totalCalls) * 100;
    const interestedRatio = (interestedCount / totalCalls) * 100;

    // ABUSE FLAG LOGIC: 80%+ negative AND 5% or less interested
    const abuseFlag = (negativeRatio >= 80 && interestedRatio <= 5);

    res.json({
      success: true,
      data: {
        totalCalls,
        negativeCount,
        interestedCount,
        negativeRatio: parseFloat(negativeRatio.toFixed(2)),
        interestedRatio: parseFloat(interestedRatio.toFixed(2)),
        abuseFlag,
        message: abuseFlag
          ? '⚠️ Unusual negative outcome pattern detected'
          : 'Call pattern looks normal'
      }
    });
  } catch (error) {
    console.error('Abuse check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking abuse pattern',
      error: error.message
    });
  }
});

// GET all telecallers with abuse check (for admin comparison view)
router.get('/telecallers/comparison', async (req, res) => {
  try {
    // Get all active telecallers
    const [telecallers] = await pool.query(
      `SELECT id, name, email FROM users
       WHERE role = ? AND status = ?
       ORDER BY name ASC`,
      ['Telecaller', 'active']
    );

    // For each telecaller, get their stats and abuse check
    const comparisonData = await Promise.all(
      telecallers.map(async (telecaller) => {
        const [totalCallsRows] = await pool.query(
          'SELECT COUNT(*) as count FROM call_history WHERE caller_id = ?',
          [telecaller.id]
        );

        const [recentCalls] = await pool.query(
          `SELECT call_outcome FROM call_history
           WHERE caller_id = ?
           ORDER BY call_date DESC
           LIMIT 30`,
          [telecaller.id]
        );

        // Calculate ratios
        const totalRecentCalls = recentCalls.length;
        const negativeOutcomes = ['Not Interested', 'Wrong Number', 'Not Reachable', 'Switched Off'];
        const positiveOutcomes = ['Interested', 'Converted'];

        let negativeCount = 0;
        let interestedCount = 0;
        let wrongNumberCount = 0;

        recentCalls.forEach(call => {
          if (negativeOutcomes.includes(call.call_outcome)) negativeCount++;
          if (positiveOutcomes.includes(call.call_outcome)) interestedCount++;
          if (call.call_outcome === 'Wrong Number') wrongNumberCount++;
        });

        const negativeRatio = totalRecentCalls > 0 ? (negativeCount / totalRecentCalls) * 100 : 0;
        const interestedRatio = totalRecentCalls > 0 ? (interestedCount / totalRecentCalls) * 100 : 0;
        const wrongNumberRatio = totalRecentCalls > 0 ? (wrongNumberCount / totalRecentCalls) * 100 : 0;

        const abuseFlag = totalRecentCalls >= 10 && negativeRatio >= 80 && interestedRatio <= 5;

        const [missedFollowupsRows] = await pool.query(
          `SELECT COUNT(*) as count FROM leads
           WHERE assigned_to = ?
           AND next_followup_date < NOW()
           AND next_followup_date IS NOT NULL
           AND status NOT IN (?, ?, ?)`,
          [telecaller.id, 'Converted', 'Not Interested', 'Wrong Number']
        );

        return {
          id: telecaller.id,
          name: telecaller.name,
          email: telecaller.email,
          totalCalls: parseInt(totalCallsRows[0].count),
          recentCallsAnalyzed: totalRecentCalls,
          interestedPercentage: parseFloat(interestedRatio.toFixed(2)),
          negativePercentage: parseFloat(negativeRatio.toFixed(2)),
          wrongNumberPercentage: parseFloat(wrongNumberRatio.toFixed(2)),
          followupsMissed: parseInt(missedFollowupsRows[0].count),
          abuseFlag
        };
      })
    );

    // Sort by abuse flag first, then by negative percentage
    comparisonData.sort((a, b) => {
      if (a.abuseFlag && !b.abuseFlag) return -1;
      if (!a.abuseFlag && b.abuseFlag) return 1;
      return b.negativePercentage - a.negativePercentage;
    });

    res.json({
      success: true,
      data: comparisonData,
      summary: {
        totalTelecallers: comparisonData.length,
        flaggedTelecallers: comparisonData.filter(t => t.abuseFlag).length
      }
    });
  } catch (error) {
    console.error('Telecaller comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching telecaller comparison data',
      error: error.message
    });
  }
});

// POST new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, phone, department, status } = req.body;

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required fields'
      });
    }

    // Check if email already exists
    const [existingRows] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password (use default if not provided)
    const defaultPassword = 'user123';
    const hashedPassword = await bcrypt.hash(password || defaultPassword, 10);

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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        role,
        phone || null,
        department || null,
        status || 'active',
        JSON.stringify(permissions)
      ]
    );

    const newUserId = insertResult.insertId;

    // Get the created user
    const [newUserRows] = await pool.query(
      'SELECT id, name, email, role, phone, department, status, created_at FROM users WHERE id = ?',
      [newUserId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUserRows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PUT reset password (admin only) - MUST come BEFORE /:id route
router.put('/:id/reset-password', async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: `Password reset successfully for ${rows[0].name}`,
      data: {
        userId: rows[0].id,
        name: rows[0].name,
        email: rows[0].email
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, phone, department, status, password, permissions } = req.body;

    // Check if user exists
    const [existingRows] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const [emailRows] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (emailRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push(`name = ?`);
      updateValues.push(name);
    }
    if (email) {
      updateFields.push(`email = ?`);
      updateValues.push(email);
    }
    if (role) {
      updateFields.push(`role = ?`);
      updateValues.push(role);
    }
    // Handle permissions - use provided permissions or set default based on role
    if (permissions !== undefined) {
      updateFields.push(`permissions = ?`);
      updateValues.push(JSON.stringify(permissions));
    } else if (role) {
      // If role is updated but permissions not provided, set default
      let defaultPermissions = [];
      if (role === 'Super Admin') {
        defaultPermissions = ['all'];
      } else if (role === 'Telecaller') {
        defaultPermissions = ['view_assigned_leads', 'add_call_logs', 'update_lead_status'];
      } else if (role === 'Counsellor') {
        defaultPermissions = ['view_transferred_leads', 'update_lead_status'];
      }
      updateFields.push(`permissions = ?`);
      updateValues.push(JSON.stringify(defaultPermissions));
    }
    if (phone !== undefined) {
      updateFields.push(`phone = ?`);
      updateValues.push(phone);
    }
    if (department !== undefined) {
      updateFields.push(`department = ?`);
      updateValues.push(department);
    }
    if (status) {
      updateFields.push(`status = ?`);
      updateValues.push(status);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password = ?`);
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(userId);

    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const [updatedRows] = await pool.query(
      'SELECT id, name, email, role, phone, department, status, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const deletedUser = rows[0];

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// PATCH activate/deactivate user
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.query(
      'SELECT status FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newStatus = rows[0].status === 'active' ? 'inactive' : 'active';

    await pool.query(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, userId]
    );

    res.json({
      success: true,
      message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: { status: newStatus }
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
});

// POST /api/users/daily-stats/trigger - Manually trigger daily stats calculation
router.post('/daily-stats/trigger', async (req, res) => {
  const { triggerManual } = require('../services/dailyStatsJob');
  await triggerManual(req, res);
});

// GET /api/users/daily-stats/history - Get daily stats history
router.get('/daily-stats/history', async (req, res) => {
  try {
    const { days = 30, telecallerId } = req.query;

    let query = `
      SELECT
        ds.*,
        u.name as telecaller_name,
        u.email as telecaller_email
      FROM telecaller_daily_stats ds
      JOIN users u ON ds.telecaller_id = u.id
      WHERE ds.date >= CURRENT_DATE - INTERVAL ${parseInt(days)} DAY
    `;
    const params = [];

    // Filter by specific telecaller if provided
    if (telecallerId) {
      query += ' AND ds.telecaller_id = ?';
      params.push(parseInt(telecallerId));
    }

    query += ' ORDER BY ds.date DESC, ds.abuse_flag DESC, ds.negative_outcome_ratio DESC';

    const [rows] = await pool.query(query, params);

    const flaggedDays = rows.filter(s => s.abuse_flag).length;
    const totalDays = rows.length;

    res.json({
      success: true,
      count: rows.length,
      data: rows,
      summary: {
        totalRecords: totalDays,
        flaggedRecords: flaggedDays,
        daysRange: parseInt(days)
      }
    });

  } catch (error) {
    console.error('Get daily stats history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily stats history',
      error: error.message
    });
  }
});

module.exports = router;
