import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * DatabaseHealthService - Serviço para verificar a saúde do banco de dados
 *
 * Fornece métodos para verificar a conectividade e status do banco de dados
 */
@Injectable()
export class DatabaseHealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Verifica se a conexão com o banco está ativa
   */
  async isConnected(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) {
        return false;
      }

      // Executa uma query simples para testar a conexão
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Obtém informações detalhadas sobre o banco de dados
   */
  async getDatabaseInfo(): Promise<{
    isConnected: boolean;
    database: string;
    host: string;
    port: number;
    entities: number;
    migrations: number;
  }> {
    try {
      const isConnected = await this.isConnected();

      if (!isConnected) {
        return {
          isConnected: false,
          database: 'N/A',
          host: 'N/A',
          port: 0,
          entities: 0,
          migrations: 0,
        };
      }

      const options = this.dataSource.options as any; // Type assertion for MySQL options

      return {
        isConnected: true,
        database: (options.database as string) || 'unknown',
        host: options.host || 'localhost',
        port: options.port || 3306,
        entities: this.dataSource.entityMetadatas.length,
        migrations: (options.migrations?.length || 0) as number,
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      throw error;
    }
  }

  /**
   * Executa uma query de teste para verificar a performance
   */
  async performanceTest(): Promise<{
    responseTime: number;
    timestamp: Date;
  }> {
    const startTime = Date.now();

    try {
      await this.dataSource.query(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()',
      );
      const responseTime = Date.now() - startTime;

      return {
        responseTime,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Database performance test failed:', error);
      throw error;
    }
  }
}
