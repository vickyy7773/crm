const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Helper function to create a notification (can be called from other routes)
async function createNotification({ userId = null, type, title, message, leadId = null, leadName = null }) {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, lead_id, lead_name, unread, created_at)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())`,
      [userId, type, title, message, leadId, leadName]
    );
    return { success: true, notificationId: result.insertId };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

// GET all notifications for a user (or all if no userId specified)
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT
        n.*,
        CASE
          WHEN n.created_at >= NOW() - INTERVAL 5 MINUTE THEN CONCAT(TIMESTAMPDIFF(MINUTE, n.created_at, NOW()), ' minutes ago')
          WHEN n.created_at >= NOW() - INTERVAL 1 HOUR THEN CONCAT(TIMESTAMPDIFF(MINUTE, n.created_at, NOW()), ' minutes ago')
          WHEN n.created_at >= NOW() - INTERVAL 24 HOUR THEN CONCAT(TIMESTAMPDIFF(HOUR, n.created_at, NOW()), ' hours ago')
          WHEN n.created_at >= NOW() - INTERVAL 7 DAY THEN CONCAT(TIMESTAMPDIFF(DAY, n.created_at, NOW()), ' days ago')
          ELSE DATE_FORMAT(n.created_at, '%b %d at %h:%i %p')
        END as time_ago,
        DATE_FORMAT(n.created_at, '%M %d, %Y at %h:%i %p') as formatted_date
      FROM notifications n
      WHERE (n.user_id = ? OR n.user_id IS NULL)
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [userId || null, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: rows,
      count: rows.length
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

    const [rows] = await pool.query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE (user_id = ? OR user_id IS NULL) AND unread = TRUE`,
      [userId || null]
    );

    res.json({
      success: true,
      count: rows[0].count
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

    await pool.query(
      `UPDATE notifications SET unread = FALSE, read_at = NOW() WHERE id = ?`,
      [id]
    );

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

    await pool.query(
      `UPDATE notifications
       SET unread = FALSE, read_at = NOW()
       WHERE (user_id = ? OR user_id IS NULL) AND unread = TRUE`,
      [userId || null]
    );

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

    await pool.query(`DELETE FROM notifications WHERE id = ?`, [id]);

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

    await pool.query(
      `DELETE FROM notifications WHERE (user_id = ? OR user_id IS NULL)`,
      [userId || null]
    );

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
            WHEN DATE(l.next_followup_date) = CURRENT_DATE THEN 'Today'
            WHEN DATE(l.next_followup_date) < CURRENT_DATE THEN 'Overdue'
            ELSE DATE_FORMAT(l.next_followup_date, '%b %d')
          END as time_ago,
          TRUE as unread,
          l.next_followup_date as created_at
        FROM leads l
        WHERE l.assigned_to = ?
          AND DATE(l.next_followup_date) <= CURRENT_DATE
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
            WHEN DATE(l.next_followup_date) = CURRENT_DATE THEN 'Today'
            WHEN DATE(l.next_followup_date) < CURRENT_DATE THEN 'Overdue'
            ELSE DATE_FORMAT(l.next_followup_date, '%b %d')
          END as time_ago,
          TRUE as unread,
          l.next_followup_date as created_at
        FROM leads l
        WHERE DATE(l.next_followup_date) <= CURRENT_DATE
          AND l.status NOT IN ('Converted', 'Drop', 'Not Interested')
        ORDER BY l.next_followup_date ASC
        LIMIT 20
      `;
      queryParams = [];
    }

    const [rows] = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: rows,
      count: rows.length
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
