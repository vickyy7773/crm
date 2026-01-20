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
