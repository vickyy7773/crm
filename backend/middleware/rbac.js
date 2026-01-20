// Role-Based Access Control Middleware

// Check if user has required role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

// Check if user has specific permission
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions || [];

    // Super Admin has all permissions
    if (userPermissions.includes('all')) {
      return next();
    }

    // Check if user has the required permission
    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${requiredPermission}`
      });
    }

    next();
  };
};

// Check if user can access lead (assigned to them or admin)
const canAccessLead = async (req, res, next) => {
  const { pool } = require('../config/database');

  try {
    const leadId = req.params.id || req.params.leadId;
    const userId = req.user.id;

    // Super Admin can access all leads
    if (req.user.role === 'Super Admin') {
      return next();
    }

    // Get lead
    const [leads] = await pool.query(
      'SELECT assigned_to, is_transferred FROM leads WHERE id = ?',
      [leadId]
    );

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const lead = leads[0];

    // Telecaller can only access their assigned leads (and not transferred ones)
    if (req.user.role === 'Telecaller') {
      if (lead.assigned_to !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only access leads assigned to you'
        });
      }

      if (lead.is_transferred) {
        return res.status(403).json({
          success: false,
          message: 'This lead has been transferred and is read-only'
        });
      }
    }

    next();

  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during access check'
    });
  }
};

module.exports = {
  checkRole,
  checkPermission,
  canAccessLead
};
