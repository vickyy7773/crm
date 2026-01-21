const { pool } = require('../config/database');

/**
 * Log audit trail for user actions
 * @param {Object} params - Audit log parameters
 * @param {number} params.userId - ID of the user performing the action
 * @param {string} params.userName - Name of the user performing the action
 * @param {string} params.action - Action type: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
 * @param {string} params.entityType - Entity type: Lead, User, CallHistory, Auth, Setting
 * @param {number} params.entityId - ID of the entity being acted upon
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.ipAddress - IP address of the requester
 * @param {string} params.userAgent - User agent string from the request
 */
async function logAudit({
  userId = null,
  userName = 'System',
  action,
  entityType,
  entityId = null,
  details = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    // Validate required fields
    if (!action || !entityType) {
      console.error('❌ Audit log error: action and entityType are required');
      return false;
    }

    // Convert details object to JSON string if it's an object
    const detailsJSON = details && typeof details === 'object'
      ? JSON.stringify(details)
      : details;

    // Insert audit log
    await pool.query(
      `INSERT INTO audit_logs
       (user_id, user_name, action, entity_type, entity_id, details, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [userId, userName, action, entityType, entityId, detailsJSON, ipAddress, userAgent]
    );

    return true;
  } catch (error) {
    // Log error but don't throw - audit logging should not break main operations
    console.error('❌ Audit logging failed:', error.message);
    return false;
  }
}

/**
 * Get user info from request body or params (helper function)
 * @param {Object} req - Express request object
 * @returns {Object} User info object with id and name
 */
function getUserFromRequest(req) {
  return {
    userId: req.body.userId || req.query.userId || req.params.userId || null,
    userName: req.body.userName || req.query.userName || 'Unknown User'
  };
}

/**
 * Get IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
function getIpAddress(req) {
  return req.ip ||
         req.headers['x-forwarded-for'] ||
         req.connection.remoteAddress ||
         'Unknown';
}

module.exports = {
  logAudit,
  getUserFromRequest,
  getIpAddress
};
