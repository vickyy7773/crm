const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/analytics/telecaller-performance
router.get('/telecaller-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        u.id as telecaller_id,
        u.name as telecaller_name,
        COUNT(ch.id) as total_calls,
        SUM(CASE WHEN ch.call_outcome = 'Converted' THEN 1 ELSE 0 END) as conversions,
        ROUND(
          (SUM(CASE WHEN ch.call_outcome = 'Converted' THEN 1 ELSE 0 END) / COUNT(ch.id)) * 100,
          2
        ) as success_rate,
        SUM(CASE WHEN ch.call_outcome = 'Contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN ch.call_outcome = 'Interested' THEN 1 ELSE 0 END) as interested,
        SUM(CASE WHEN ch.call_outcome = 'Call Back' THEN 1 ELSE 0 END) as call_back,
        SUM(CASE WHEN ch.call_outcome = 'Not Interested' THEN 1 ELSE 0 END) as not_interested,
        SUM(CASE WHEN ch.call_outcome = 'Wrong Number' THEN 1 ELSE 0 END) as wrong_number,
        SUM(CASE WHEN ch.call_outcome = 'Not Reachable' THEN 1 ELSE 0 END) as not_reachable,
        SUM(CASE WHEN ch.call_outcome = 'Switched Off' THEN 1 ELSE 0 END) as switched_off,
        SUM(CASE WHEN ch.call_outcome = 'Busy' THEN 1 ELSE 0 END) as busy,
        SUM(CASE WHEN ch.call_outcome = 'No Answer' THEN 1 ELSE 0 END) as no_answer
      FROM users u
      LEFT JOIN call_history ch ON ch.caller_id = u.id
      WHERE u.role = 'Telecaller'
    `;

    const params = [];

    // Add date filters if provided
    if (startDate) {
      query += ' AND DATE(ch.call_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(ch.call_date) <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY u.id, u.name ORDER BY total_calls DESC';

    const [performance] = await pool.query(query, params);

    // Calculate outcomes for each telecaller
    const formattedData = performance.map(tel => ({
      telecaller_id: tel.telecaller_id,
      telecaller_name: tel.telecaller_name,
      total_calls: tel.total_calls || 0,
      conversions: tel.conversions || 0,
      success_rate: tel.success_rate || 0,
      outcomes: {
        Contacted: tel.contacted || 0,
        Interested: tel.interested || 0,
        'Call Back': tel.call_back || 0,
        'Not Interested': tel.not_interested || 0,
        Converted: tel.conversions || 0,
        'Wrong Number': tel.wrong_number || 0,
        'Not Reachable': tel.not_reachable || 0,
        'Switched Off': tel.switched_off || 0,
        Busy: tel.busy || 0,
        'No Answer': tel.no_answer || 0
      }
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching telecaller performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telecaller performance',
      error: error.message
    });
  }
});

// GET /api/analytics/performance-trend
router.get('/performance-trend', async (req, res) => {
  try {
    const { telecallerId, days = 7 } = req.query;

    let query = `
      SELECT
        DATE(ch.call_date) as date,
        COUNT(ch.id) as total_calls,
        SUM(CASE WHEN ch.call_outcome = 'Converted' THEN 1 ELSE 0 END) as conversions,
        SUM(CASE WHEN ch.call_outcome = 'Interested' THEN 1 ELSE 0 END) as interested
      FROM call_history ch
      WHERE ch.call_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;

    const params = [parseInt(days)];

    if (telecallerId) {
      query += ' AND ch.caller_id = ?';
      params.push(telecallerId);
    }

    query += ' GROUP BY DATE(ch.call_date) ORDER BY date ASC';

    const [trend] = await pool.query(query, params);

    res.json({
      success: true,
      data: trend
    });

  } catch (error) {
    console.error('Error fetching performance trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trend',
      error: error.message
    });
  }
});

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  try {
    // Get overall stats
    const [totalCalls] = await pool.query('SELECT COUNT(*) as count FROM call_history');
    const [totalConversions] = await pool.query(
      "SELECT COUNT(*) as count FROM call_history WHERE call_outcome = 'Converted'"
    );
    const [totalTelecallers] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Telecaller' AND status = 'active'"
    );

    // Get today's stats
    const [todayCalls] = await pool.query(
      'SELECT COUNT(*) as count FROM call_history WHERE DATE(call_date) = CURDATE()'
    );
    const [todayConversions] = await pool.query(
      "SELECT COUNT(*) as count FROM call_history WHERE DATE(call_date) = CURDATE() AND call_outcome = 'Converted'"
    );

    // Get top performer (most conversions this month)
    const [topPerformer] = await pool.query(`
      SELECT
        u.name,
        COUNT(ch.id) as conversions
      FROM users u
      INNER JOIN call_history ch ON ch.caller_id = u.id
      WHERE ch.call_outcome = 'Converted'
        AND MONTH(ch.call_date) = MONTH(CURDATE())
        AND YEAR(ch.call_date) = YEAR(CURDATE())
      GROUP BY u.id, u.name
      ORDER BY conversions DESC
      LIMIT 1
    `);

    res.json({
      success: true,
      data: {
        totalCalls: totalCalls[0].count,
        totalConversions: totalConversions[0].count,
        totalTelecallers: totalTelecallers[0].count,
        todayCalls: todayCalls[0].count,
        todayConversions: todayConversions[0].count,
        topPerformer: topPerformer[0] || null,
        overallSuccessRate: totalCalls[0].count > 0
          ? ((totalConversions[0].count / totalCalls[0].count) * 100).toFixed(2)
          : 0
      }
    });

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics summary',
      error: error.message
    });
  }
});

module.exports = router;
