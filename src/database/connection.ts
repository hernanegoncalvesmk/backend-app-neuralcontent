import { AppDataSource, DatabaseService } from '../config/database';

// Export the configured data source and service
export { AppDataSource, DatabaseService };

// Initialize database connection with retry logic
export const initializeDatabase = async (retries = 5, delay = 5000): Promise<void> => {
  const databaseService = DatabaseService.getInstance();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Attempting database connection (${attempt}/${retries})...`);
      await databaseService.initialize();
      console.log('🎉 Database initialized successfully');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        console.error('💀 All database connection attempts failed');
        throw new Error(`Failed to connect to database after ${retries} attempts: ${error}`);
      }
      
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Graceful shutdown handler
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    const databaseService = DatabaseService.getInstance();
    await databaseService.close();
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Health check function for database
export const checkDatabaseHealth = async (): Promise<{ status: string; details?: any }> => {
  try {
    const databaseService = DatabaseService.getInstance();
    
    if (!databaseService.isConnected()) {
      return {
        status: 'disconnected',
        details: 'Database connection is not initialized'
      };
    }
    
    const isHealthy = await databaseService.testConnection();
    
    if (isHealthy) {
      return {
        status: 'healthy',
        details: {
          connected: true,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME
        }
      };
    } else {
      return {
        status: 'unhealthy',
        details: 'Database connection test failed'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
};
