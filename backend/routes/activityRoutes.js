const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all activities with search and filter
router.get('/', async (req, res) => {
  try {
    const { search = '', type = 'all', limit = 100 } = req.query;

    let query = `
      SELECT
        ch.id,
        ch.caller_name as person,
        ch.call_outcome as action,
        l.name as lead_name,
        l.id as lead_id,
        ch.call_date as activity_date,
        ch.duration,
        CASE
          WHEN ch.call_date >= NOW() - INTERVAL 5 MINUTE THEN CONCAT(TIMESTAMPDIFF(MINUTE, ch.call_date, NOW()), ' mins ago')
          WHEN ch.call_date >= NOW() - INTERVAL 1 HOUR THEN CONCAT(TIMESTAMPDIFF(MINUTE, ch.call_date, NOW()), ' mins ago')
          WHEN ch.call_date >= NOW() - INTERVAL 24 HOUR THEN CONCAT(TIMESTAMPDIFF(HOUR, ch.call_date, NOW()), ' hours ago')
          WHEN ch.call_date >= NOW() - INTERVAL 7 DAY THEN CONCAT(TIMESTAMPDIFF(DAY, ch.call_date, NOW()), ' days ago')
          ELSE DATE_FORMAT(ch.call_date, '%b %d')
        END as time,
        DATE_FORMAT(ch.call_date, '%h:%i %p') as timestamp,
        'call' as type,
        'completed' as status
      FROM call_history ch
      JOIN leads l ON ch.lead_id = l.id
      WHERE 1=1
    `;

    const params = [];

    // Add search filter
    if (search && search.trim() !== '') {
      query += ` AND (ch.caller_name LIKE ? OR l.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY ch.call_date DESC LIMIT ?`;
    params.push(parseInt(limit));

    const [rows] = await pool.query(query, params);

    // Format the activities
    const formattedActivities = rows.map(activity => ({
      id: activity.id,
      person: activity.person,
      avatar: getInitials(activity.person),
      action: `called lead`,
      leadName: activity.lead_name,
      leadId: activity.lead_id,
      time: activity.time,
      timestamp: activity.timestamp,
      type: 'call',
      status: 'completed',
      duration: activity.duration,
      result: activity.action
    }));

    res.json({
      success: true,
      data: formattedActivities,
      count: formattedActivities.length
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
});

// GET person-specific daily activities
router.get('/person/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const query = `
      SELECT
        ch.id,
        ch.caller_name,
        ch.call_outcome,
        ch.call_date,
        ch.duration,
        ch.call_remark,
        l.name as lead_name,
        l.id as lead_id,
        DATE_FORMAT(ch.call_date, '%h:%i %p') as time,
        DATE_FORMAT(ch.call_date, '%Y-%m-%d') as call_day
      FROM call_history ch
      JOIN leads l ON ch.lead_id = l.id
      WHERE ch.caller_name = ?
      AND DATE(ch.call_date) = CURRENT_DATE
      ORDER BY ch.call_date DESC
    `;

    const [rows] = await pool.query(query, [name]);

    const formattedActivities = rows.map(activity => ({
      time: activity.time,
      action: `Called lead ${activity.lead_name}`,
      duration: activity.duration || '-',
      result: activity.call_outcome || 'Call completed'
    }));

    res.json({
      success: true,
      data: formattedActivities,
      count: formattedActivities.length
    });
  } catch (error) {
    console.error('Error fetching person activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch person activities',
      error: error.message
    });
  }
});

// GET activity statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalRows] = await pool.query(
      'SELECT COUNT(*) as count FROM call_history WHERE DATE(call_date) = CURRENT_DATE'
    );

    const [teamRows] = await pool.query(
      'SELECT COUNT(DISTINCT caller_name) as count FROM call_history WHERE DATE(call_date) = CURRENT_DATE'
    );

    const [callsRows] = await pool.query(
      'SELECT COUNT(*) as count FROM call_history WHERE DATE(call_date) = CURRENT_DATE'
    );

    res.json({
      success: true,
      data: {
        totalActivities: totalRows[0].count,
        teamMembers: teamRows[0].count,
        calls: callsRows[0].count,
        emails: 0,
        meetings: 0
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
});

// Helper function to generate initials from name
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

module.exports = router;
