import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import database connection
import { initializeDatabase, closeDatabaseConnection, checkDatabaseHealth } from './database/connection';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: dbHealth,
    });
  } catch (error) {
    res.status(503).json({
      status: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      database: { status: 'error', details: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'NeuralContent API v1.0.0',
    documentation: '/docs',
    health: '/health',
    database: 'MySQL with TypeORM',
  });
});

// Database info endpoint
app.get('/db-info', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.json({
      databaseType: 'MySQL',
      orm: 'TypeORM',
      host: process.env.DB_HOST,
      databaseName: process.env.DB_NAME,
      status: dbHealth.status,
      details: dbHealth.details,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database info unavailable',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 NeuralContent API server running on port ${PORT}`);
      console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`💾 Database: MySQL connected successfully`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(): Promise<void> {
  console.log('🔄 Received shutdown signal, closing server gracefully...');
  
  try {
    await closeDatabaseConnection();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();

export default app;
