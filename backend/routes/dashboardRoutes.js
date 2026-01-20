const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get total leads count
    const [totalLeads] = await pool.query('SELECT COUNT(*) as count FROM leads');

    // Get conversions count
    const [conversions] = await pool.query(
      'SELECT COUNT(*) as count FROM leads WHERE status = "Converted"'
    );

    // Get pending follow-ups count (where next_followup_date is in future and not null)
    const [pendingFollowups] = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE next_followup_date IS NOT NULL
       AND next_followup_date != '0000-00-00 00:00:00'
       AND next_followup_date >= CURDATE()`
    );

    // Get active users count
    const [activeUsers] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE status = "active"'
    );

    // Get previous month's data for comparison
    const [prevMonthLeads] = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE created_at >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), INTERVAL 1 MONTH)
       AND created_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`
    );

    const [prevMonthConversions] = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE status = "Converted"
       AND updated_at >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), INTERVAL 1 MONTH)
       AND updated_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`
    );

    // Calculate percentage changes
    const leadsChange = prevMonthLeads[0].count > 0
      ? ((totalLeads[0].count - prevMonthLeads[0].count) / prevMonthLeads[0].count * 100).toFixed(1)
      : 0;

    const conversionsChange = prevMonthConversions[0].count > 0
      ? ((conversions[0].count - prevMonthConversions[0].count) / prevMonthConversions[0].count * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalLeads: totalLeads[0].count,
        conversions: conversions[0].count,
        pendingFollowups: pendingFollowups[0].count,
        activeUsers: activeUsers[0].count,
        changes: {
          leads: leadsChange,
          conversions: conversionsChange
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

// GET recent activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent call logs with lead and user information
    const query = `
      SELECT
        ch.id,
        ch.caller_name as user,
        ch.call_outcome as action,
        ch.call_date as timestamp,
        l.name as lead_name,
        l.id as lead_id,
        CASE
          WHEN ch.call_date >= NOW() - INTERVAL 5 MINUTE THEN CONCAT(TIMESTAMPDIFF(MINUTE, ch.call_date, NOW()), ' mins ago')
          WHEN ch.call_date >= NOW() - INTERVAL 1 HOUR THEN CONCAT(TIMESTAMPDIFF(MINUTE, ch.call_date, NOW()), ' mins ago')
          WHEN ch.call_date >= NOW() - INTERVAL 24 HOUR THEN CONCAT(TIMESTAMPDIFF(HOUR, ch.call_date, NOW()), ' hours ago')
          WHEN ch.call_date >= NOW() - INTERVAL 7 DAY THEN CONCAT(TIMESTAMPDIFF(DAY, ch.call_date, NOW()), ' days ago')
          ELSE DATE_FORMAT(ch.call_date, '%b %d')
        END as time_ago,
        'call' as type
      FROM call_history ch
      JOIN leads l ON ch.lead_id = l.id
      ORDER BY ch.call_date DESC
      LIMIT ?
    `;

    const [activities] = await pool.query(query, [parseInt(limit)]);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
});

// GET leads progress (count by status)
router.get('/leads-progress', async (req, res) => {
  try {
    const query = `
      SELECT
        status,
        COUNT(*) as count
      FROM leads
      WHERE status IN ('New', 'Contacted', 'Interested', 'Converted')
      GROUP BY status
    `;

    const [progress] = await pool.query(query);

    // Calculate total for percentage
    const total = progress.reduce((sum, item) => sum + item.count, 0);

    // Add percentage to each status
    const progressWithPercentage = progress.map(item => ({
      status: item.status,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    res.json({
      success: true,
      data: progressWithPercentage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads progress',
      error: error.message
    });
  }
});

module.exports = router;
