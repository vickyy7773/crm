const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Helper function to create a notification (can be called from other routes)
async function createNotification({ userId = null, type, title, message, leadId = null, leadName = null }) {
  try {
    const query = `
      INSERT INTO notifications (user_id, type, title, message, lead_id, lead_name, unread, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
      RETURNING id
    `;

    const result = await pool.query(query, [userId, type, title, message, leadId, leadName]);
    return { success: true, notificationId: result.rows[0].id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

// Note: Function will be exported at the end of file

// GET all notifications for a user (or all if no userId specified)
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        n.*,
        CASE
          WHEN n.created_at >= NOW() - INTERVAL '5 minutes' THEN CONCAT(EXTRACT(EPOCH FROM (NOW() - n.created_at))::integer / 60, ' minutes ago')
          WHEN n.created_at >= NOW() - INTERVAL '1 hour' THEN CONCAT(EXTRACT(EPOCH FROM (NOW() - n.created_at))::integer / 60, ' minutes ago')
          WHEN n.created_at >= NOW() - INTERVAL '24 hours' THEN CONCAT(EXTRACT(EPOCH FROM (NOW() - n.created_at))::integer / 3600, ' hours ago')
          WHEN n.created_at >= NOW() - INTERVAL '7 days' THEN CONCAT(EXTRACT(EPOCH FROM (NOW() - n.created_at))::integer / 86400, ' days ago')
          ELSE TO_CHAR(n.created_at, 'Mon DD at HH12:MI PM')
        END as time_ago,
        TO_CHAR(n.created_at, 'Month DD, YYYY at HH12:MI PM') as formatted_date
      FROM notifications n
      WHERE (n.user_id = $1 OR n.user_id IS NULL)
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const notifications = await pool.query(query, [userId || null, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: notifications.rows,
      count: notifications.rows.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// GET unread count for a user
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;

    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE (user_id = $1 OR user_id IS NULL) AND unread = TRUE
    `;

    const result = await pool.query(query, [userId || null]);

    res.json({
      success: true,
      count: result.rows[0].count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

// PUT mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE notifications
      SET unread = FALSE, read_at = NOW()
      WHERE id = $1
    `;

    await pool.query(query, [id]);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// PUT mark all notifications as read for a user
router.put('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;

    const query = `
      UPDATE notifications
      SET unread = FALSE, read_at = NOW()
      WHERE (user_id = $1 OR user_id IS NULL) AND unread = TRUE
    `;

    await pool.query(query, [userId || null]);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// DELETE a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM notifications WHERE id = $1`;

    await pool.query(query, [id]);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// DELETE clear all notifications for a user
router.delete('/clear-all', async (req, res) => {
  try {
    const { userId } = req.query;

    const query = `
      DELETE FROM notifications
      WHERE (user_id = $1 OR user_id IS NULL)
    `;

    await pool.query(query, [userId || null]);

    res.json({
      success: true,
      message: 'All notifications cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all notifications',
      error: error.message
    });
  }
});

// GET today's follow-ups as notifications
router.get('/followups-today', async (req, res) => {
  try {
    const { userId, userRole } = req.query;

    // Query for today's follow-ups
    // If telecaller, show only their assigned leads
    // If admin, show all leads
    let query;
    let queryParams;

    if (userRole === 'telecaller') {
      query = `
        SELECT
          l.id,
          l.name,
          l.phone,
          l.next_followup_date,
          l.assigned_to_name,
          'followup' as type,
          'Follow-up Reminder' as title,
          CONCAT('Follow-up with ', l.name, ' (', l.phone, ')') as message,
          CASE
            WHEN l.next_followup_date::date = CURRENT_DATE THEN 'Today'
            WHEN l.next_followup_date::date < CURRENT_DATE THEN 'Overdue'
            ELSE TO_CHAR(l.next_followup_date, 'Mon DD')
          END as time_ago,
          TRUE as unread,
          l.next_followup_date as created_at
        FROM leads l
        WHERE l.assigned_to = $1
          AND l.next_followup_date::date <= CURRENT_DATE
          AND l.status NOT IN ('Converted', 'Drop', 'Not Interested')
        ORDER BY l.next_followup_date ASC
        LIMIT 10
      `;
      queryParams = [userId];
    } else {
      // Admin sees all follow-ups
      query = `
        SELECT
          l.id,
          l.name,
          l.phone,
          l.next_followup_date,
          l.assigned_to_name,
          'followup' as type,
          'Follow-up Reminder' as title,
          CONCAT('Follow-up with ', l.name, ' (', l.phone, ')',
            CASE WHEN l.assigned_to_name IS NOT NULL
            THEN CONCAT(' - Assigned to ', l.assigned_to_name)
            ELSE '' END) as message,
          CASE
            WHEN l.next_followup_date::date = CURRENT_DATE THEN 'Today'
            WHEN l.next_followup_date::date < CURRENT_DATE THEN 'Overdue'
            ELSE TO_CHAR(l.next_followup_date, 'Mon DD')
          END as time_ago,
          TRUE as unread,
          l.next_followup_date as created_at
        FROM leads l
        WHERE l.next_followup_date::date <= CURRENT_DATE
          AND l.status NOT IN ('Converted', 'Drop', 'Not Interested')
        ORDER BY l.next_followup_date ASC
        LIMIT 20
      `;
      queryParams = [];
    }

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching followup notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followup notifications',
      error: error.message
    });
  }
});

// Export both the router and the createNotification helper function
module.exports = router;
module.exports.createNotification = createNotification;
