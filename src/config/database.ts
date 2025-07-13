import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import { entities } from '../models/entities';

// Load environment variables
dotenv.config();

// Database configuration
export const databaseConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'neuralcontent',
  
  // Connection pool settings
  extra: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    acquireTimeout: parseInt(process.env.DB_TIMEOUT || '60000'),
    timeout: parseInt(process.env.DB_TIMEOUT || '60000'),
    reconnect: true,
    charset: 'utf8mb4',
  },
  
  // TypeORM specific settings
  synchronize: false, // Never true in production
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  entities: entities,
  migrations: [
    // Temporarily disabled for testing
    // process.env.NODE_ENV === 'production' 
    //   ? 'dist/database/migrations/*.js'
    //   : 'src/database/migrations/*.ts'
  ],
  subscribers: [
    process.env.NODE_ENV === 'production' 
      ? 'dist/database/subscribers/*.js'
      : 'src/database/subscribers/*.ts'
  ],
  
  // Connection options
  connectTimeout: 60000,
  acquireTimeout: 60000,
  
  // Pool settings for better performance
  poolSize: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  
  // SSL configuration (disabled for development)
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Cache settings
  cache: {
    duration: 30000, // 30 seconds
  },
  
  // Debug mode
  debug: false, // Disabled to reduce logs
};

// Create and export the data source
export const AppDataSource = new DataSource(databaseConfig);

// Database connection utility functions
export class DatabaseService {
  private static instance: DatabaseService;
  private dataSource: DataSource;
  
  private constructor() {
    this.dataSource = AppDataSource;
  }
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  /**
   * Initialize database connection
   */
  public async initialize(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
        console.log('✅ Database connected successfully');
        
        // Test connection
        await this.testConnection();
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }
  
  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1 as test');
      console.log('✅ Database connection test passed');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw error;
    }
  }
  
  /**
   * Get data source instance
   */
  public getDataSource(): DataSource {
    return this.dataSource;
  }
  
  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
  
  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.dataSource.isInitialized;
  }
  
  /**
   * Run migrations
   */
  public async runMigrations(): Promise<void> {
    try {
      const migrations = await this.dataSource.runMigrations();
      console.log(`✅ Ran ${migrations.length} migrations successfully`);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Revert last migration
   */
  public async revertMigration(): Promise<void> {
    try {
      await this.dataSource.undoLastMigration();
      console.log('✅ Last migration reverted successfully');
    } catch (error) {
      console.error('❌ Migration revert failed:', error);
      throw error;
    }
  }
}

export default DatabaseService;
