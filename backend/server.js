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

// Database migration endpoint - adds missing columns
app.get('/api/migrate', async (req, res) => {
  const { pool } = require('./config/database');
  const results = [];

  try {
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
      // First check if it's an ENUM type
      const typeCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'call_history' AND column_name = 'call_reason'
      `);

      if (typeCheck.rows.length > 0 && typeCheck.rows[0].data_type === 'USER-DEFINED') {
        // Drop and recreate as VARCHAR
        await pool.query(`ALTER TABLE call_history DROP COLUMN IF EXISTS call_reason`);
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_reason VARCHAR(100) NULL`);
        results.push({ step: 'Fix call_reason (ENUM to VARCHAR)', status: 'success' });
      } else if (typeCheck.rows.length === 0) {
        // Column doesn't exist, add it
        await pool.query(`ALTER TABLE call_history ADD COLUMN call_reason VARCHAR(100) NULL`);
        results.push({ step: 'Add call_reason', status: 'success' });
      } else {
        results.push({ step: 'call_reason already VARCHAR', status: 'skipped' });
      }
    } catch (e) {
      results.push({ step: 'Fix call_reason', status: 'error', error: e.message });
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
