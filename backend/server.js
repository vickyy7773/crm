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
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,
      'https://crm-frontend.onrender.com',
      /\.onrender\.com$/,
    ].filter(Boolean)
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
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
    // Check leads.status column type
    try {
      const [leadsStatusRows] = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'status'
        AND table_schema = DATABASE()
      `);

      if (leadsStatusRows.length > 0 && leadsStatusRows[0].data_type === 'enum') {
        await pool.query(`ALTER TABLE leads MODIFY COLUMN status VARCHAR(100)`);
        results.push({ step: 'Fix leads.status (ENUM to VARCHAR)', status: 'success' });
      } else {
        results.push({ step: 'leads.status already VARCHAR or not found', status: 'skipped' });
      }
    } catch (e) {
      results.push({ step: 'Fix leads.status', status: 'error', error: e.message });
    }

    // Check if call_history table exists
    const [tableRows] = await pool.query(`
      SELECT COUNT(*) as cnt FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'call_history'
    `);
    results.push({ step: 'Table check', exists: tableRows[0].cnt > 0 });

    // Fix call_reason column
    try {
      const [typeRows] = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'call_history' AND column_name = 'call_reason'
        AND table_schema = DATABASE()
      `);

      if (typeRows.length > 0 && typeRows[0].data_type === 'enum') {
        await pool.query(`ALTER TABLE call_history DROP COLUMN IF EXISTS call_reason`);
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_reason VARCHAR(100) NULL`);
        results.push({ step: 'Fix call_reason (ENUM to VARCHAR)', status: 'success' });
      } else if (typeRows.length === 0) {
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_reason VARCHAR(100) NULL`);
        results.push({ step: 'Add call_reason', status: 'success' });
      } else {
        results.push({ step: 'call_reason already VARCHAR', status: 'skipped' });
      }
    } catch (e) {
      results.push({ step: 'Fix call_reason', status: 'error', error: e.message });
    }

    // Fix call_outcome column
    try {
      const [outcomeRows] = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'call_history' AND column_name = 'call_outcome'
        AND table_schema = DATABASE()
      `);

      if (outcomeRows.length > 0 && outcomeRows[0].data_type === 'enum') {
        await pool.query(`ALTER TABLE call_history DROP COLUMN IF EXISTS call_outcome`);
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_outcome VARCHAR(100) NULL`);
        results.push({ step: 'Fix call_outcome (ENUM to VARCHAR)', status: 'success' });
      } else if (outcomeRows.length === 0) {
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
      await pool.query(`ALTER TABLE call_history ADD COLUMN created_ip VARCHAR(45) NULL`);
      results.push({ step: 'Add created_ip', status: 'success' });
    } catch (e) {
      results.push({ step: 'Add created_ip', status: 'error', error: e.message });
    }

    // Add user_agent column to call_history
    try {
      await pool.query(`ALTER TABLE call_history ADD COLUMN user_agent TEXT NULL`);
      results.push({ step: 'Add user_agent', status: 'success' });
    } catch (e) {
      results.push({ step: 'Add user_agent', status: 'error', error: e.message });
    }

    // Get current columns in call_history
    const [columnsRows] = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'call_history' AND table_schema = DATABASE()
      ORDER BY ordinal_position
    `);

    res.json({
      success: true,
      message: 'Migration completed!',
      results: results,
      currentColumns: columnsRows
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
    const [statusRows] = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'status'
      AND table_schema = DATABASE()
    `);

    // Try test update
    let testUpdate = 'Not tested';
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`UPDATE leads SET status = 'Office Meeting' WHERE id = 1`);
      testUpdate = 'UPDATE works!';
      await conn.rollback();
    } catch (updateErr) {
      await conn.rollback();
      testUpdate = 'UPDATE FAILED: ' + updateErr.message;
    } finally {
      conn.release();
    }

    res.json({
      statusColumn: statusRows,
      testUpdate: testUpdate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force fix leads status - modify column to VARCHAR if it is ENUM
app.get('/api/fix-leads-status', async (req, res) => {
  const { pool } = require('./config/database');
  try {
    const [checkRows] = await pool.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'status'
      AND table_schema = DATABASE()
    `);

    if (checkRows.length === 0) {
      return res.json({ message: 'status column not found' });
    }

    if (checkRows[0].data_type === 'enum') {
      await pool.query(`ALTER TABLE leads MODIFY COLUMN status VARCHAR(100)`);
      res.json({
        success: true,
        message: 'Fixed! status column converted from ENUM to VARCHAR',
        oldType: 'enum'
      });
    } else {
      res.json({
        success: true,
        message: 'status column is already VARCHAR',
        currentType: checkRows[0]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint - check call_history table structure
app.get('/api/debug/call-history', async (req, res) => {
  const { pool } = require('./config/database');
  try {
    // Get table columns
    const [columns] = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'call_history' AND table_schema = DATABASE()
      ORDER BY ordinal_position
    `);

    // Get table constraints
    const [constraints] = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'call_history' AND table_schema = DATABASE()
    `);

    // Try a test insert (will rollback)
    let testInsertResult = 'Not tested';
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`
        INSERT INTO call_history (lead_id, caller_id, caller_name, call_date, call_remark, call_outcome)
        VALUES (1, 1, 'Test', NOW(), 'Test remark for debugging', 'Contacted')
      `);
      testInsertResult = 'INSERT works!';
      await conn.rollback();
    } catch (insertErr) {
      await conn.rollback();
      testInsertResult = 'INSERT FAILED: ' + insertErr.message + ' | Code: ' + insertErr.code;
    } finally {
      conn.release();
    }

    res.json({
      success: true,
      columns: columns,
      constraints: constraints,
      testInsert: testInsertResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reset admin password endpoint (one-time use)
app.get('/api/reset-admin', async (req, res) => {
  const { pool } = require('./config/database');
  const bcrypt = require('bcrypt');
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `UPDATE users SET password = ? WHERE email = 'admin@pulseeducation.com'`,
      [hashedPassword]
    );
    res.json({ success: true, message: 'Admin password reset to admin123' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

// Auto-migrate: add missing columns on startup
const runStartupMigrations = async () => {
  const { pool } = require('./config/database');
  try {
    await pool.query(`ALTER TABLE leads ADD COLUMN father_name VARCHAR(100)`);
    console.log('✅ Startup migration: father_name column ensured');
  } catch (err) {
    console.error('⚠️ Startup migration warning:', err.message);
  }
};

// Start server and test database connection
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Run startup migrations
    await runStartupMigrations();

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
