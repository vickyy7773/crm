const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalLeadsRows] = await pool.query('SELECT COUNT(*) as count FROM leads');

    const [conversionsRows] = await pool.query(
      'SELECT COUNT(*) as count FROM leads WHERE status = ?',
      ['Converted']
    );

    const [pendingFollowupsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM leads
       WHERE next_followup_date IS NOT NULL
       AND next_followup_date >= CURRENT_DATE`
    );

    const [activeUsersRows] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE status = ?',
      ['active']
    );

    const [interestedRows] = await pool.query(
      "SELECT COUNT(*) as count FROM leads WHERE status = 'Interested'"
    );
    const [followUpRows] = await pool.query(
      "SELECT COUNT(*) as count FROM leads WHERE status = 'Follow Up'"
    );
    const [officeVisitRows] = await pool.query(
      "SELECT COUNT(*) as count FROM leads WHERE status = 'Office Visit'"
    );
    const [otherCourseRows] = await pool.query(
      "SELECT COUNT(*) as count FROM leads WHERE status = 'Other Course'"
    );

    res.json({
      success: true,
      data: {
        totalLeads: totalLeadsRows[0].count,
        conversions: conversionsRows[0].count,
        pendingFollowups: pendingFollowupsRows[0].count,
        activeUsers: activeUsersRows[0].count,
        interestedCount: parseInt(interestedRows[0].count),
        followUpCount: parseInt(followUpRows[0].count),
        officeVisitCount: parseInt(officeVisitRows[0].count),
        otherCourseCount: parseInt(otherCourseRows[0].count),
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

    const [rows] = await pool.query(query, [parseInt(limit)]);

    res.json({
      success: true,
      data: rows
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

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      data: rows
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

    const [rows] = await pool.query(query);

    // Calculate total for percentage
    const total = rows.reduce((sum, item) => sum + parseInt(item.count), 0);

    // Add percentage to each status
    const progressWithPercentage = rows.map(item => ({
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
