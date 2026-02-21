const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const userRoutes = require('./routes/userRoutes');
const exportRoutes = require('./routes/exportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const auditRoutes = require('./routes/auditRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const studentApplicationRoutes = require('./routes/studentApplicationRoutes');
const otherCoursesApplicationRoutes = require('./routes/otherCoursesApplicationRoutes');
const { initDailyStatsJob } = require('./services/dailyStatsJob');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS Configuration for Production and Development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://yourdomain.com'
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/student-applications', studentApplicationRoutes);
app.use('/api/other-courses-applications', otherCoursesApplicationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM Backend API is running' });
});

// Auto-setup endpoint - creates all tables if they don't exist
app.get('/api/setup', async (req, res) => {
  const { pool } = require('./config/database');
  const fs = require('fs');
  const path = require('path');

  try {
    const migrationPath = path.join(__dirname, 'migrations', 'full_migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pool.query(sql);
    res.json({ success: true, message: 'Database setup completed! All tables created.' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, message: 'Setup failed', error: error.message });
  }
});

// Database migration endpoint - adds missing columns
app.get('/api/migrate', async (req, res) => {
  const { pool } = require('./config/database');
  const results = [];

  try {
    // FIX LEADS TABLE - Convert status from ENUM to VARCHAR
    try {
      const leadsStatusCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'status'
      `);

      if (leadsStatusCheck.rows.length > 0 && leadsStatusCheck.rows[0].data_type === 'USER-DEFINED') {
        // Create temp column, copy data, drop old, rename new
        await pool.query(`ALTER TABLE leads ADD COLUMN status_new VARCHAR(100)`);
        await pool.query(`UPDATE leads SET status_new = status::text`);
        await pool.query(`ALTER TABLE leads DROP COLUMN status`);
        await pool.query(`ALTER TABLE leads RENAME COLUMN status_new TO status`);
        results.push({ step: 'Fix leads.status (ENUM to VARCHAR)', status: 'success' });
      } else {
        results.push({ step: 'leads.status already VARCHAR or not found', status: 'skipped' });
      }
    } catch (e) {
      results.push({ step: 'Fix leads.status', status: 'error', error: e.message });
    }

    // Check if call_history table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'call_history'
      )
    `);
    results.push({ step: 'Table check', exists: tableCheck.rows[0].exists });

    // Fix call_reason column - change from ENUM to VARCHAR if it exists as ENUM
    try {
      const typeCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'call_history' AND column_name = 'call_reason'
      `);

      if (typeCheck.rows.length > 0 && typeCheck.rows[0].data_type === 'USER-DEFINED') {
        await pool.query(`ALTER TABLE call_history DROP COLUMN IF EXISTS call_reason`);
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_reason VARCHAR(100) NULL`);
        results.push({ step: 'Fix call_reason (ENUM to VARCHAR)', status: 'success' });
      } else if (typeCheck.rows.length === 0) {
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_reason VARCHAR(100) NULL`);
        results.push({ step: 'Add call_reason', status: 'success' });
      } else {
        results.push({ step: 'call_reason already VARCHAR', status: 'skipped' });
      }
    } catch (e) {
      results.push({ step: 'Fix call_reason', status: 'error', error: e.message });
    }

    // Fix call_outcome column - change from ENUM to VARCHAR if it exists as ENUM
    try {
      const outcomeCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'call_history' AND column_name = 'call_outcome'
      `);

      if (outcomeCheck.rows.length > 0 && outcomeCheck.rows[0].data_type === 'USER-DEFINED') {
        await pool.query(`ALTER TABLE call_history DROP COLUMN IF EXISTS call_outcome`);
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_outcome VARCHAR(100) NULL`);
        results.push({ step: 'Fix call_outcome (ENUM to VARCHAR)', status: 'success' });
      } else if (outcomeCheck.rows.length === 0) {
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_outcome VARCHAR(100) NULL`);
        results.push({ step: 'Add call_outcome', status: 'success' });
      } else {
        results.push({ step: 'call_outcome already VARCHAR', status: 'skipped' });
      }
    } catch (e) {
      results.push({ step: 'Fix call_outcome', status: 'error', error: e.message });
    }

    // Add created_ip column to call_history
    try {
      await pool.query(`ALTER TABLE call_history ADD COLUMN IF NOT EXISTS created_ip VARCHAR(45) NULL`);
      results.push({ step: 'Add created_ip', status: 'success' });
    } catch (e) {
      results.push({ step: 'Add created_ip', status: 'error', error: e.message });
    }

    // Add user_agent column to call_history
    try {
      await pool.query(`ALTER TABLE call_history ADD COLUMN IF NOT EXISTS user_agent TEXT NULL`);
      results.push({ step: 'Add user_agent', status: 'success' });
    } catch (e) {
      results.push({ step: 'Add user_agent', status: 'error', error: e.message });
    }

    // Get current columns in call_history
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'call_history'
      ORDER BY ordinal_position
    `);

    res.json({
      success: true,
      message: 'Migration completed!',
      results: results,
      currentColumns: columnsResult.rows
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      results: results
    });
  }
});

// Debug endpoint - check leads table status column
app.get('/api/debug/leads-status', async (req, res) => {
  const { pool } = require('./config/database');
  try {
    // Get status column info
    const statusInfo = await pool.query(`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'status'
    `);

    // Check if lead_status enum exists
    const enumCheck = await pool.query(`
      SELECT typname, enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE typname = 'lead_status'
      ORDER BY enumsortorder
    `);

    // Try test update
    let testUpdate = 'Not tested';
    try {
      await pool.query('BEGIN');
      await pool.query(`UPDATE leads SET status = 'Office Meeting' WHERE id = 1`);
      testUpdate = 'UPDATE works!';
      await pool.query('ROLLBACK');
    } catch (updateErr) {
      await pool.query('ROLLBACK');
      testUpdate = 'UPDATE FAILED: ' + updateErr.message;
    }

    res.json({
      statusColumn: statusInfo.rows,
      enumValues: enumCheck.rows,
      testUpdate: testUpdate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force fix leads status - drop and recreate
app.get('/api/fix-leads-status', async (req, res) => {
  const { pool } = require('./config/database');
  try {
    // Check current type
    const check = await pool.query(`
      SELECT data_type, udt_name FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'status'
    `);

    if (check.rows.length === 0) {
      return res.json({ message: 'status column not found', check: check.rows });
    }

    const udtName = check.rows[0].udt_name;

    if (udtName === 'lead_status' || check.rows[0].data_type === 'USER-DEFINED') {
      // It's still an ENUM, force convert
      await pool.query(`ALTER TABLE leads ADD COLUMN status_temp VARCHAR(100)`);
      await pool.query(`UPDATE leads SET status_temp = status::text`);
      await pool.query(`ALTER TABLE leads DROP COLUMN status`);
      await pool.query(`ALTER TABLE leads RENAME COLUMN status_temp TO status`);

      // Also drop the enum type
      try {
        await pool.query(`DROP TYPE IF EXISTS lead_status`);
      } catch (e) {
        // Ignore if can't drop
      }

      res.json({
        success: true,
        message: 'Fixed! status column converted from ENUM to VARCHAR',
        oldType: udtName
      });
    } else {
      res.json({
        success: true,
        message: 'status column is already VARCHAR',
        currentType: check.rows[0]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

// Debug endpoint - check call_history table structure
app.get('/api/debug/call-history', async (req, res) => {
  const { pool } = require('./config/database');
  try {
    // Get table columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'call_history'
      ORDER BY ordinal_position
    `);

    // Get table constraints
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'call_history'
    `);

    // Try a test insert (will rollback)
    let testInsertResult = 'Not tested';
    try {
      await pool.query('BEGIN');
      await pool.query(`
        INSERT INTO call_history (lead_id, caller_id, caller_name, call_date, call_remark, call_outcome)
        VALUES (1, 1, 'Test', NOW(), 'Test remark for debugging', 'Contacted')
      `);
      testInsertResult = 'INSERT works!';
      await pool.query('ROLLBACK');
    } catch (insertErr) {
      await pool.query('ROLLBACK');
      testInsertResult = 'INSERT FAILED: ' + insertErr.message + ' | Code: ' + insertErr.code + ' | Detail: ' + insertErr.detail;
    }

    res.json({
      success: true,
      columns: columns.rows,
      constraints: constraints.rows,
      testInsert: testInsertResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

// Database health check endpoint
app.get('/api/health/db', async (req, res) => {
  const isConnected = await testConnection();
  if (isConnected) {
    res.json({ status: 'OK', message: 'Database connection successful' });
  } else {
    res.status(500).json({ status: 'ERROR', message: 'Database connection failed' });
  }
});

// Start server and test database connection
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Initialize daily stats cron job
    initDailyStatsJob();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`💾 Database check: http://localhost:${PORT}/api/health/db`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
