// Role-Based Access Control Permissions

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  TELECALLER: 'Telecaller',
  COUNSELLOR: 'Counsellor',
  MANAGER: 'Manager',
  SALES_REP: 'Sales Representative'
};

export const PERMISSIONS = {
  // Super Admin - Full access
  [ROLES.SUPER_ADMIN]: {
    leads: {
      viewAll: true,
      viewAssigned: true,
      create: true,
      edit: true,
      delete: true,
      assign: true,
      import: true,
      export: true,
      transfer: true,
      viewTransferred: true
    },
    users: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      manageRoles: true
    },
    reports: {
      viewAll: true,
      viewOwn: true,
      export: true
    },
    settings: {
      view: true,
      edit: true
    },
    callLogs: {
      viewAll: true,
      viewOwn: true,
      create: true,
      edit: true
    },
    dashboard: {
      viewAdmin: true,
      viewTelecaller: false
    }
  },

  // Telecaller - Limited access
  [ROLES.TELECALLER]: {
    leads: {
      viewAll: false,
      viewAssigned: true,
      create: false,
      edit: false,
      delete: false,
      assign: false,
      import: false,
      export: false,
      transfer: true, // Only interested leads
      viewTransferred: false
    },
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      manageRoles: false
    },
    reports: {
      viewAll: false,
      viewOwn: true,
      export: false
    },
    settings: {
      view: false,
      edit: false
    },
    callLogs: {
      viewAll: false,
      viewOwn: true,
      create: true,
      edit: false
    },
    dashboard: {
      viewAdmin: false,
      viewTelecaller: true
    }
  },

  // Counsellor - Access to transferred leads
  [ROLES.COUNSELLOR]: {
    leads: {
      viewAll: false,
      viewAssigned: true,
      create: false,
      edit: true,
      delete: false,
      assign: false,
      import: false,
      export: true,
      transfer: false,
      viewTransferred: true
    },
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      manageRoles: false
    },
    reports: {
      viewAll: false,
      viewOwn: true,
      export: true
    },
    settings: {
      view: false,
      edit: false
    },
    callLogs: {
      viewAll: false,
      viewOwn: true,
      create: true,
      edit: true
    },
    dashboard: {
      viewAdmin: false,
      viewTelecaller: false
    }
  },

  // Manager - View access to reports
  [ROLES.MANAGER]: {
    leads: {
      viewAll: true,
      viewAssigned: true,
      create: true,
      edit: true,
      delete: false,
      assign: true,
      import: true,
      export: true,
      transfer: true,
      viewTransferred: true
    },
    users: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      manageRoles: false
    },
    reports: {
      viewAll: true,
      viewOwn: true,
      export: true
    },
    settings: {
      view: true,
      edit: false
    },
    callLogs: {
      viewAll: true,
      viewOwn: true,
      create: false,
      edit: false
    },
    dashboard: {
      viewAdmin: true,
      viewTelecaller: false
    }
  }
};

// Helper Functions

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role property
 * @param {string} resource - Resource name (e.g., 'leads', 'users')
 * @param {string} action - Action name (e.g., 'viewAll', 'create')
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, resource, action) => {
  if (!user || !user.role) return false;

  const userPermissions = PERMISSIONS[user.role];
  if (!userPermissions) return false;

  return userPermissions[resource]?.[action] === true;
};

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object with role property
 * @param {Array<string>} allowedRoles - Array of allowed role names
 * @returns {boolean} - True if user has one of the allowed roles
 */
export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};

/**
 * Check if user is Super Admin
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is Super Admin
 */
export const isSuperAdmin = (user) => {
  return user?.role === ROLES.SUPER_ADMIN;
};

/**
 * Check if user is Telecaller
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is Telecaller
 */
export const isTelecaller = (user) => {
  return user?.role === ROLES.TELECALLER;
};

/**
 * Check if user is Counsellor
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is Counsellor
 */
export const isCounsellor = (user) => {
  return user?.role === ROLES.COUNSELLOR;
};

/**
 * Get dashboard route for user role
 * @param {Object} user - User object with role property
 * @returns {string} - Dashboard route path
 */
export const getDashboardRoute = (user) => {
  if (!user || !user.role) return '/login';

  switch (user.role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.MANAGER:
      return '/dashboard';

    case ROLES.TELECALLER:
      return '/telecaller/dashboard';

    case ROLES.COUNSELLOR:
      return '/counsellor/dashboard';

    default:
      return '/login';
  }
};

/**
 * Get all permissions for a user
 * @param {Object} user - User object with role property
 * @returns {Object} - Permissions object
 */
export const getUserPermissions = (user) => {
  if (!user || !user.role) return {};
  return PERMISSIONS[user.role] || {};
};

/**
 * Check if user can access a route
 * @param {Object} user - User object with role property
 * @param {string} path - Route path
 * @returns {boolean} - True if user can access route
 */
export const canAccessRoute = (user, path) => {
  if (!user) return false;

  // Super Admin can access everything
  if (isSuperAdmin(user)) return true;

  // Telecaller routes
  if (path.startsWith('/telecaller/')) {
    return isTelecaller(user);
  }

  // Counsellor routes
  if (path.startsWith('/counsellor/')) {
    return isCounsellor(user);
  }

  // Admin routes (dashboard, users, settings, etc.)
  if (['/dashboard', '/users', '/settings', '/leads'].some(route => path.startsWith(route))) {
    return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.MANAGER]);
  }

  // Default deny
  return false;
};
