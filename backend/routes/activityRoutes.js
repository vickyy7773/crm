const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all activities with search and filter
router.get('/', async (req, res) => {
  try {
    const { search = '', type = 'all', limit = 100 } = req.query;

    // Build the query based on filters
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
          WHEN ch.call_date >= NOW() - INTERVAL '5 minutes' THEN EXTRACT(EPOCH FROM (NOW() - ch.call_date))/60 || ' mins ago'
          WHEN ch.call_date >= NOW() - INTERVAL '1 hour' THEN EXTRACT(EPOCH FROM (NOW() - ch.call_date))/60 || ' mins ago'
          WHEN ch.call_date >= NOW() - INTERVAL '24 hours' THEN EXTRACT(EPOCH FROM (NOW() - ch.call_date))/3600 || ' hours ago'
          WHEN ch.call_date >= NOW() - INTERVAL '7 days' THEN EXTRACT(EPOCH FROM (NOW() - ch.call_date))/86400 || ' days ago'
          ELSE TO_CHAR(ch.call_date, 'Mon DD')
        END as time,
        TO_CHAR(ch.call_date, 'HH12:MI AM') as timestamp,
        'call' as type,
        'completed' as status
      FROM call_history ch
      JOIN leads l ON ch.lead_id = l.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Add search filter
    if (search && search.trim() !== '') {
      query += ` AND (ch.caller_name LIKE $${paramCount} OR l.name LIKE $${paramCount+1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramCount += 2;
    }

    // Type filter is handled in frontend for now since we only have call data
    // In future, we can add UNION with other activity types

    query += ` ORDER BY ch.call_date DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    // Format the activities
    const formattedActivities = result.rows.map(activity => ({
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
        TO_CHAR(ch.call_date, 'HH12:MI AM') as time,
        TO_CHAR(ch.call_date, 'YYYY-MM-DD') as call_day
      FROM call_history ch
      JOIN leads l ON ch.lead_id = l.id
      WHERE ch.caller_name = $1
      AND DATE(ch.call_date) = CURRENT_DATE
      ORDER BY ch.call_date DESC
    `;

    const result = await pool.query(query, [name]);

    // Format the activities for the timeline
    const formattedActivities = result.rows.map(activity => ({
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
    // Get total activities count
    const totalActivities = await pool.query(
      'SELECT COUNT(*) as count FROM call_history WHERE DATE(call_date) = CURRENT_DATE'
    );

    // Get unique team members who made calls today
    const teamMembers = await pool.query(
      'SELECT COUNT(DISTINCT caller_name) as count FROM call_history WHERE DATE(call_date) = CURRENT_DATE'
    );

    // Get activities by type (for now just calls)
    const callsCount = await pool.query(
      'SELECT COUNT(*) as count FROM call_history WHERE DATE(call_date) = CURRENT_DATE'
    );

    res.json({
      success: true,
      data: {
        totalActivities: totalActivities.rows[0].count,
        teamMembers: teamMembers.rows[0].count,
        calls: callsCount.rows[0].count,
        emails: 0, // Placeholder for future implementation
        meetings: 0 // Placeholder for future implementation
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
