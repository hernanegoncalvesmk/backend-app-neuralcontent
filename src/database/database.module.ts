import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './database.config';
import { DatabaseHealthService } from './database-health.service';

/**
 * DatabaseModule - Módulo global para configuração do banco de dados
 * 
 * Este módulo configura o TypeORM com MySQL usando as configurações
 * definidas no arquivo de configuração do banco de dados.
 * 
 * @Global - Torna o módulo disponível globalmente
 */
@Global()
@Module({
  imports: [
    // Import database configuration
    ConfigModule.forFeature(databaseConfig),
    
    // Configure TypeORM with async configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        
        // Log connection info (without sensitive data)
        console.log('🔗 Connecting to database:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          synchronize: dbConfig.synchronize,
          logging: dbConfig.logging,
        });
        
        return {
          ...dbConfig,
          // Ensure entities are loaded correctly
          autoLoadEntities: true,
          
          // Connection error handling
          connectTimeoutMS: 60000,
          acquireTimeoutMillis: 60000,
          
          // Pool configuration
          extra: {
            ...dbConfig.extra,
            // Additional MySQL specific options
            dateStrings: false,
            typeCast: true,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseHealthService],
  exports: [TypeOrmModule, DatabaseHealthService],
})
export class DatabaseModule {
  constructor(private configService: ConfigService) {
    this.logDatabaseInfo();
  }

  private logDatabaseInfo() {
    const dbConfig = this.configService.get('database');
    const nodeEnv = this.configService.get('app.nodeEnv');
    
    console.log('📊 Database Module initialized');
    console.log(`🌍 Environment: ${nodeEnv}`);
    console.log(`🗄️  Database: ${dbConfig.database}`);
    console.log(`🔄 Synchronize: ${dbConfig.synchronize}`);
    console.log(`📝 Logging: ${dbConfig.logging}`);
  }
}
