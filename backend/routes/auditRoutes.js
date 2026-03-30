const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/audit-logs - Get audit logs with filters
router.get('/', async (req, res) => {
  try {
    const {
      userId,
      action,
      entityType,
      startDate,
      endDate,
      search = '',
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT
        al.id,
        al.user_id,
        al.user_name,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.timestamp,
        CASE
          WHEN al.timestamp >= NOW() - INTERVAL 5 MINUTE THEN CONCAT(TIMESTAMPDIFF(MINUTE, al.timestamp, NOW()), ' mins ago')
          WHEN al.timestamp >= NOW() - INTERVAL 1 HOUR THEN CONCAT(TIMESTAMPDIFF(MINUTE, al.timestamp, NOW()), ' mins ago')
          WHEN al.timestamp >= NOW() - INTERVAL 24 HOUR THEN CONCAT(TIMESTAMPDIFF(HOUR, al.timestamp, NOW()), ' hours ago')
          WHEN al.timestamp >= NOW() - INTERVAL 7 DAY THEN CONCAT(TIMESTAMPDIFF(DAY, al.timestamp, NOW()), ' days ago')
          ELSE DATE_FORMAT(al.timestamp, '%b %d, %Y')
        END as time_ago
      FROM audit_logs al
      WHERE 1=1
    `;

    const params = [];

    if (userId) {
      query += ` AND al.user_id = ?`;
      params.push(userId);
    }

    if (action) {
      query += ` AND al.action = ?`;
      params.push(action);
    }

    if (entityType) {
      query += ` AND al.entity_type = ?`;
      params.push(entityType);
    }

    if (startDate) {
      query += ` AND DATE(al.timestamp) >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND DATE(al.timestamp) <= ?`;
      params.push(endDate);
    }

    if (search) {
      query += ` AND (al.user_name LIKE ? OR al.details LIKE ? OR al.ip_address LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
    const [countRows] = await pool.query(countQuery, params);
    const totalRecords = countRows[0].total;

    // Add sorting and pagination
    query += ` ORDER BY al.timestamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: totalRecords,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalRecords
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// GET /api/audit-logs/stats - Get audit statistics
router.get('/stats', async (req, res) => {
  try {
    const [todayRows] = await pool.query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE DATE(timestamp) = CURRENT_DATE
    `);

    const [actionsByTypeRows] = await pool.query(`
      SELECT
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL 7 DAY
      GROUP BY action
      ORDER BY count DESC
    `);

    const [actionsByEntityRows] = await pool.query(`
      SELECT
        entity_type,
        COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL 7 DAY
      GROUP BY entity_type
      ORDER BY count DESC
    `);

    const [mostActiveRows] = await pool.query(`
      SELECT
        user_name,
        COUNT(*) as action_count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL 7 DAY
        AND user_name IS NOT NULL
        AND user_name != 'System'
      GROUP BY user_name
      ORDER BY action_count DESC
      LIMIT 5
    `);

    const [last24HoursRows] = await pool.query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL 24 HOUR
    `);

    res.json({
      success: true,
      data: {
        todayCount: todayRows[0].count,
        last24HoursCount: last24HoursRows[0].count,
        actionsByType: actionsByTypeRows,
        actionsByEntity: actionsByEntityRows,
        mostActiveUsers: mostActiveRows
      }
    });

  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
});

// GET /api/audit-logs/:id - Get specific audit log
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM audit_logs WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
});

module.exports = router;
