const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get total leads count
    const totalLeads = await pool.query('SELECT COUNT(*) as count FROM leads');

    // Get conversions count
    const conversions = await pool.query(
      'SELECT COUNT(*) as count FROM leads WHERE status = $1',
      ['Converted']
    );

    // Get pending follow-ups count (where next_followup_date is in future and not null)
    const pendingFollowups = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE next_followup_date IS NOT NULL
       AND next_followup_date >= CURRENT_DATE`
    );

    // Get active users count
    const activeUsers = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE status = $1',
      ['active']
    );

    // Get previous month's data for comparison
    const prevMonthLeads = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE created_at >= (CURRENT_DATE - INTERVAL '2 months')
       AND created_at < (CURRENT_DATE - INTERVAL '1 month')`
    );

    const prevMonthConversions = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE status = $1
       AND updated_at >= (CURRENT_DATE - INTERVAL '2 months')
       AND updated_at < (CURRENT_DATE - INTERVAL '1 month')`,
      ['Converted']
    );

    // Calculate percentage changes
    const leadsChange = prevMonthLeads.rows[0].count > 0
      ? ((totalLeads.rows[0].count - prevMonthLeads.rows[0].count) / prevMonthLeads.rows[0].count * 100).toFixed(1)
      : 0;

    const conversionsChange = prevMonthConversions.rows[0].count > 0
      ? ((conversions.rows[0].count - prevMonthConversions.rows[0].count) / prevMonthConversions.rows[0].count * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalLeads: totalLeads.rows[0].count,
        conversions: conversions.rows[0].count,
        pendingFollowups: pendingFollowups.rows[0].count,
        activeUsers: activeUsers.rows[0].count,
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
          WHEN ch.call_date >= NOW() - INTERVAL '5 minutes' THEN CONCAT(EXTRACT(EPOCH FROM (NOW() - ch.call_date))::integer / 60, ' mins ago')
          WHEN ch.call_date >= NOW() - INTERVAL '1 hour' THEN CONCAT(EXTRACT(EPOCH FROM (NOW() - ch.call_date))::integer / 60, ' mins ago')
          WHEN ch.call_date >= NOW() - INTERVAL '24 hours' THEN CONCAT(EXTRACT(EPOCH FROM (NOW() - ch.call_date))::integer / 3600, ' hours ago')
          WHEN ch.call_date >= NOW() - INTERVAL '7 days' THEN CONCAT(EXTRACT(EPOCH FROM (NOW() - ch.call_date))::integer / 86400, ' days ago')
          ELSE TO_CHAR(ch.call_date, 'Mon DD')
        END as time_ago,
        'call' as type
      FROM call_history ch
      JOIN leads l ON ch.lead_id = l.id
      ORDER BY ch.call_date DESC
      LIMIT $1
    `;

    const activities = await pool.query(query, [parseInt(limit)]);

    res.json({
      success: true,
      data: activities.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
});

// GET pending follow-ups list
router.get('/pending-followups', async (req, res) => {
  try {
    const query = `
      SELECT
        l.id,
        l.name,
        l.phone,
        l.email,
        l.city,
        l.status,
        l.next_followup_date,
        l.assigned_to_name,
        l.course,
        l.remark
      FROM leads l
      WHERE l.next_followup_date IS NOT NULL
      AND l.next_followup_date >= CURRENT_DATE
      ORDER BY l.next_followup_date ASC
      LIMIT 50
    `;

    const followups = await pool.query(query);

    res.json({
      success: true,
      data: followups.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending follow-ups',
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

    const progress = await pool.query(query);

    // Calculate total for percentage
    const total = progress.rows.reduce((sum, item) => sum + parseInt(item.count), 0);

    // Add percentage to each status
    const progressWithPercentage = progress.rows.map(item => ({
      status: item.status,
      count: parseInt(item.count),
      percentage: total > 0 ? Math.round((parseInt(item.count) / total) * 100) : 0
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
