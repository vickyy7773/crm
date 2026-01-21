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
          WHEN al.timestamp >= NOW() - INTERVAL '5 minutes' THEN EXTRACT(EPOCH FROM (NOW() - al.timestamp))/60 || ' mins ago'
          WHEN al.timestamp >= NOW() - INTERVAL '1 hour' THEN EXTRACT(EPOCH FROM (NOW() - al.timestamp))/60 || ' mins ago'
          WHEN al.timestamp >= NOW() - INTERVAL '24 hours' THEN EXTRACT(EPOCH FROM (NOW() - al.timestamp))/3600 || ' hours ago'
          WHEN al.timestamp >= NOW() - INTERVAL '7 days' THEN EXTRACT(EPOCH FROM (NOW() - al.timestamp))/86400 || ' days ago'
          ELSE TO_CHAR(al.timestamp, 'Mon DD, YYYY')
        END as time_ago
      FROM audit_logs al
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Apply filters
    if (userId) {
      query += ` AND al.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (action) {
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (entityType) {
      query += ` AND al.entity_type = $${paramCount}`;
      params.push(entityType);
      paramCount++;
    }

    if (startDate) {
      query += ` AND DATE(al.timestamp) >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND DATE(al.timestamp) <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (search) {
      query += ` AND (al.user_name LIKE $${paramCount} OR al.details::text LIKE $${paramCount+1} OR al.ip_address LIKE $${paramCount+2})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      paramCount += 3;
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = countResult.rows[0].total;

    // Add sorting and pagination
    query += ` ORDER BY al.timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount+1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
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
    // Total actions today
    const todayCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE DATE(timestamp) = CURRENT_DATE
    `);

    // Actions by type (last 7 days)
    const actionsByType = await pool.query(`
      SELECT
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY action
      ORDER BY count DESC
    `);

    // Actions by entity type (last 7 days)
    const actionsByEntity = await pool.query(`
      SELECT
        entity_type,
        COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY entity_type
      ORDER BY count DESC
    `);

    // Most active users (last 7 days)
    const mostActiveUsers = await pool.query(`
      SELECT
        user_name,
        COUNT(*) as action_count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL '7 days'
        AND user_name IS NOT NULL
        AND user_name != 'System'
      GROUP BY user_name
      ORDER BY action_count DESC
      LIMIT 5
    `);

    // Recent activity (last 24 hours)
    const last24Hours = await pool.query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    `);

    res.json({
      success: true,
      data: {
        todayCount: todayCount.rows[0].count,
        last24HoursCount: last24Hours.rows[0].count,
        actionsByType: actionsByType.rows,
        actionsByEntity: actionsByEntity.rows,
        mostActiveUsers: mostActiveUsers.rows
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

    const result = await pool.query(
      'SELECT * FROM audit_logs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
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
