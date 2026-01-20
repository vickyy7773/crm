const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Helper function to create a notification (can be called from other routes)
async function createNotification({ userId = null, type, title, message, leadId = null, leadName = null }) {
  try {
    const query = `
      INSERT INTO notifications (user_id, type, title, message, lead_id, lead_name, unread, created_at)
      VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())
    `;

    const [result] = await pool.query(query, [userId, type, title, message, leadId, leadName]);
    return { success: true, notificationId: result.insertId };
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

    const [notifications] = await pool.query(query, [userId || null, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
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
      WHERE (user_id = ? OR user_id IS NULL) AND unread = TRUE
    `;

    const [result] = await pool.query(query, [userId || null]);

    res.json({
      success: true,
      count: result[0].count
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
      WHERE id = ?
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
      WHERE (user_id = ? OR user_id IS NULL) AND unread = TRUE
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

    const query = `DELETE FROM notifications WHERE id = ?`;

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
      WHERE (user_id = ? OR user_id IS NULL)
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

// Export both the router and the createNotification helper function
module.exports = router;
module.exports.createNotification = createNotification;
