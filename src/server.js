const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const disposalRoutes = require('./routes/disposalRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const chwRoutes = require('./routes/chwRoutes');
const educationRoutes = require('./routes/educationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static files if available (built Vite app copied to backend/public)
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/disposals', disposalRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/chws', chwRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'UmutiSafe API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  // If frontend exists, serve it. Otherwise return API root info JSON.
  const indexFile = path.join(publicPath, 'index.html');
  res.status(200);
  if (require('fs').existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  return res.json({
    success: true,
    message: 'Welcome to UmutiSafe API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      disposals: '/api/disposals',
      pickups: '/api/pickups',
      medicines: '/api/medicines',
      chws: '/api/chws',
      education: '/api/education',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  // For SPA routing: return index.html when client-side route is requested
  const indexFile = path.join(publicPath, 'index.html');
  if (require('fs').existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    // Note: Database tables are created via migration script (npm run db:migrate)
    // Uncomment the line below only if you want to sync on every server start
    // await syncDatabase(false);

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

module.exports = app;

