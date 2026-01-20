# Implementation Plan: Analytics & Audit Log Features

## Overview
Adding two major features to the CRM:
1. **Analytics Dashboard** - Telecaller performance comparison with Chart.js
2. **Audit Log System** - Track Lead operations, User login/logout, and Call logging

---

## FEATURE 1: ANALYTICS DASHBOARD 📊

### Frontend Implementation

#### Step 1: Install Chart.js Dependencies
```bash
npm install chart.js react-chartjs-2
```

#### Step 2: Create Analytics Page
**File:** `src/pages/Analytics.jsx`

Components to include:
- **Telecaller Performance Comparison** section
  - Bar chart: Total calls per telecaller
  - Bar chart: Total conversions per telecaller
  - Bar chart: Success rate (%) per telecaller
  - Line chart: Performance trend over last 7/30 days
- **Filters:** Date range picker, Telecaller selector
- **Stats Cards:** Top performer, Most improved, Avg success rate

#### Step 3: Add Routing
**File:** `src/App.jsx`
- Import Analytics component
- Add route: `/analytics` (Super Admin & Manager only)
```jsx
<Route path="analytics" element={
  <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
    <Analytics />
  </RoleBasedRoute>
} />
```

#### Step 4: Add Navigation Item
**File:** `src/components/Layout.jsx`
- Add Analytics to the Reports submenu (around line 267-276)
```jsx
{reportsOpen && (
  <>
    <SubNavItem to="/reports" icon={BarChart3}>Reports</SubNavItem>
    <SubNavItem to="/admin/daily-stats" icon={Calendar}>Daily Stats History</SubNavItem>
    <SubNavItem to="/analytics" icon={TrendingUp}>Analytics</SubNavItem>
  </>
)}
```
- Import TrendingUp icon from lucide-react

### Backend Implementation

#### Step 1: Create Analytics Routes
**File:** `backend/routes/analyticsRoutes.js`

Endpoints:
- `GET /api/analytics/telecaller-performance`
  - Query: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  - Returns:
    ```json
    {
      "success": true,
      "data": [
        {
          "telecaller_id": 1,
          "telecaller_name": "John Doe",
          "total_calls": 150,
          "conversions": 25,
          "success_rate": 16.67,
          "outcomes": {
            "Contacted": 50,
            "Interested": 30,
            "Call Back": 20,
            "Not Interested": 25,
            "Converted": 25
          }
        }
      ]
    }
    ```

SQL Query Strategy:
- Join `call_history` with `users` table
- Group by `caller_id` or `caller_name`
- Count total calls, conversions
- Calculate success rate as (conversions/total_calls * 100)
- Aggregate outcomes using CASE statements

#### Step 2: Register Route
**File:** `backend/server.js`
```javascript
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);
```

---

## FEATURE 2: AUDIT LOG SYSTEM 📜

### Database Implementation

#### Step 1: Create Audit Logs Table
**SQL Script:**
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  user_name VARCHAR(255),
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
  entity_type ENUM('Lead', 'User', 'CallHistory', 'Auth') NOT NULL,
  entity_id INT NULL,
  details TEXT NULL,  -- JSON string with before/after values
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity_type (entity_type),
  INDEX idx_timestamp (timestamp)
);
```

### Backend Implementation

#### Step 1: Create Audit Logger Utility
**File:** `backend/utils/auditLogger.js`

Function signature:
```javascript
async function logAudit({
  userId,
  userName,
  action,      // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  entityType,  // 'Lead', 'User', 'CallHistory', 'Auth'
  entityId,
  details,     // Object with changes
  ipAddress,
  userAgent
})
```

#### Step 2: Create Audit Routes
**File:** `backend/routes/auditRoutes.js`

Endpoints:
- `GET /api/audit-logs`
  - Query params: `?userId=X&action=Y&entityType=Z&startDate=&endDate=&limit=50&offset=0`
  - Returns paginated audit logs
- `GET /api/audit-logs/stats`
  - Returns stats: Total actions today, Actions by type, Most active users

#### Step 3: Integrate Audit Logging into Existing Routes

**File:** `backend/routes/leadRoutes.js`
- Import auditLogger
- Add logging to:
  - POST `/` (CREATE lead)
  - PUT `/:id` (UPDATE lead)
  - DELETE `/:id` (DELETE lead)

Example:
```javascript
const { logAudit } = require('../utils/auditLogger');

// After successful lead creation
await logAudit({
  userId: req.body.createdBy || null,
  userName: req.body.createdByName || 'System',
  action: 'CREATE',
  entityType: 'Lead',
  entityId: result.insertId,
  details: JSON.stringify({ leadData }),
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
});
```

**File:** `backend/routes/authRoutes.js`
- Add logging to:
  - POST `/login` (LOGIN)
  - POST `/logout` (LOGOUT)

**Note:** Call history is already tracked in `call_history` table, so we can optionally add audit logging for it or just reference the existing table.

#### Step 4: Register Route
**File:** `backend/server.js`
```javascript
const auditRoutes = require('./routes/auditRoutes');
app.use('/api/audit-logs', auditRoutes);
```

### Frontend Implementation

#### Step 1: Create Audit Log Page
**File:** `src/pages/AuditLog.jsx`

Components:
- **Stats Cards:** Total actions today, Last 24h activity, Most active user
- **Filters Bar:**
  - User dropdown
  - Action type dropdown (All, Create, Update, Delete, Login, Logout)
  - Entity type dropdown (All, Lead, User, CallHistory)
  - Date range picker
  - Search box (search in details)
- **Audit Log Table:**
  - Columns: Timestamp, User, Action, Entity Type, Entity ID, Details, IP Address
  - Color coding by action type
  - Expandable row to show full details JSON
  - Pagination (50 per page)

#### Step 2: Add Routing
**File:** `src/App.jsx`
```jsx
import AuditLog from './pages/AuditLog';

<Route path="audit-log" element={
  <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
    <AuditLog />
  </RoleBasedRoute>
} />
```

#### Step 3: Add Navigation Item
**File:** `src/components/Layout.jsx`
- Add Audit Log to Super Admin menu (around line 299-303)
```jsx
{isSuperAdmin(user) && (
  <>
    <NavItem to="/settings" icon={Settings}>Settings</NavItem>
    <NavItem to="/audit-log" icon={FileText}>Audit Log</NavItem>
  </>
)}
```
- Import FileText icon from lucide-react

---

## Implementation Order

### Phase 1: Database Setup
1. Create `audit_logs` table
2. Test table creation

### Phase 2: Backend - Audit System
1. Create `auditLogger.js` utility
2. Create `auditRoutes.js`
3. Update `leadRoutes.js` to add logging
4. Update `authRoutes.js` to add logging
5. Register audit routes in `server.js`
6. Test audit logging endpoints

### Phase 3: Frontend - Audit Log Page
1. Create `AuditLog.jsx` page
2. Add route to `App.jsx`
3. Add navigation to `Layout.jsx`
4. Test audit log display

### Phase 4: Frontend - Analytics Setup
1. Install Chart.js packages
2. Create `Analytics.jsx` page
3. Add route to `App.jsx`
4. Add navigation to `Layout.jsx`

### Phase 5: Backend - Analytics
1. Create `analyticsRoutes.js`
2. Register routes in `server.js`
3. Test analytics endpoints

### Phase 6: Final Integration & Testing
1. Test all analytics charts with real data
2. Test audit log filtering and search
3. Test role-based access
4. Performance testing
5. UI/UX polish

---

## Technical Considerations

### Chart.js Configuration
- Use responsive: true
- Add tooltips with detailed info
- Color scheme matching existing UI (purple/pink gradient)
- Add export functionality (optional)

### Audit Log Performance
- Add database indexes on frequently queried columns
- Implement pagination (limit 50 per page)
- Consider archiving old logs after 6 months (optional)
- Efficient JSON parsing for details column

### Security
- Ensure only Super Admin can view audit logs
- Never log sensitive data (passwords, API keys)
- Sanitize IP addresses if needed for GDPR compliance

### Error Handling
- Audit logging failures should not break main operations
- Use try-catch around audit logger calls
- Log audit failures to console but continue execution

---

## Files to Create

### Frontend
- `src/pages/Analytics.jsx`
- `src/pages/AuditLog.jsx`

### Backend
- `backend/routes/analyticsRoutes.js`
- `backend/routes/auditRoutes.js`
- `backend/utils/auditLogger.js`

### Database
- SQL script for `audit_logs` table

---

## Files to Modify

### Frontend
- `src/App.jsx` - Add 2 new routes
- `src/components/Layout.jsx` - Add 2 navigation items
- `package.json` - Add Chart.js dependencies

### Backend
- `backend/server.js` - Register 2 new routes
- `backend/routes/leadRoutes.js` - Add audit logging
- `backend/routes/authRoutes.js` - Add audit logging

---

## Testing Checklist

### Analytics
- [ ] Charts display correctly with sample data
- [ ] Filters work (date range, telecaller selection)
- [ ] Data updates when filters change
- [ ] Charts are responsive on different screen sizes
- [ ] No console errors
- [ ] Loading states work properly

### Audit Log
- [ ] Table displays audit logs correctly
- [ ] Filters work (user, action, entity, date)
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Audit entries created for lead operations
- [ ] Audit entries created for login/logout
- [ ] Only Super Admin can access
- [ ] IP addresses captured correctly

---

## Estimated Implementation Time

1. Database setup: 15 minutes
2. Audit backend: 1 hour
3. Audit frontend: 1.5 hours
4. Analytics backend: 45 minutes
5. Analytics frontend: 2 hours
6. Testing & polish: 1 hour

**Total: ~6.5 hours**
