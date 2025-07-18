/**
 * PM2 Ecosystem Configuration - Production Optimized
 * NeuralContent API - Production & Development Environments
 * 
 * @description Configuração profissional otimizada para deploy com PM2
 * @author NeuralContent Team
 * @version 1.0.0
 * @license MIT
 * @updated 2025-07-17
 */

module.exports = {
  apps: [
    {
      // 🚀 PRODUCTION CONFIGURATION - OPTIMIZED
      name: 'neuralcontent-api-prod',
      script: './dist/main.js',
      instances: 'max', // Utiliza todos os cores disponíveis
      exec_mode: 'cluster',
      autorestart: true,
      watch: false, // Desabilitado em produção
      max_memory_restart: '512M',
      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 10000,
      listen_timeout: 10000,
      
      // 📊 Logging Configuration
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/neuralcontent/error.log',
      out_file: '/var/log/neuralcontent/out.log',
      log_file: '/var/log/neuralcontent/combined.log',
      merge_logs: true,
      
      // 🌍 Production Environment Variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        API_PREFIX: 'v1',
        
        // 🔗 Production URLs
        FRONTEND_URL: 'https://app.neuralcontent.com',
        BACKEND_URL: 'https://api.neuralcontent.com',
        CORS_ORIGIN: 'https://app.neuralcontent.com,https://neuralcontent.com',
        
        // 🗄️ Database Production Settings
        DB_SYNCHRONIZE: 'false',
        DB_LOGGING: 'error',
        DB_POOL_SIZE: '20',
        DB_CONNECTION_TIMEOUT: '30000',
        DB_ACQUIRE_TIMEOUT: '30000',
        DB_IDLE_TIMEOUT: '300000',
        
        // 📝 Redis Production Settings
        REDIS_DB: '1',
        REDIS_KEY_PREFIX: 'neuralcontent:prod:',
        REDIS_TTL: '7200',
        REDIS_CONNECT_TIMEOUT: '10000',
        
        // 📊 Logging Production Settings
        LOG_LEVEL: 'warn',
        LOG_DIR: '/var/log/neuralcontent',
        ENABLE_FILE_LOGS: 'true',
        ENABLE_CONSOLE_LOGS: 'false',
        LOG_MAX_SIZE: '50m',
        LOG_MAX_FILES: '30d',
        
        // 🛡️ Security Production Settings
        RATE_LIMIT_LIMIT: '500',
        RATE_LIMIT_GLOBAL: '10000',
        BCRYPT_ROUNDS: '12',
        
        // 🔒 SSL Settings
        SSL_ENABLED: 'true',
        FORCE_HTTPS: 'true',
        TRUST_PROXY: 'true',
        
        // 📈 Monitoring Settings
        ENABLE_METRICS: 'true',
        METRICS_PORT: '9090',
        SWAGGER_ENABLED: 'false',
        PROMETHEUS_ENABLED: 'true',
        
        // 📦 Cache Settings
        CACHE_TTL_DEFAULT: '300',
        CACHE_TTL_USER: '600',
        CACHE_TTL_PLANS: '3600',
        CACHE_TTL_HEALTH: '60'
      }
    },

    {
      // 🧪 STAGING CONFIGURATION
      name: 'neuralcontent-api-staging',
      script: './dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      min_uptime: '10s',
      max_restarts: 15,
      restart_delay: 2000,
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3002,
        API_PREFIX: 'v1',
        
        FRONTEND_URL: 'https://staging.neuralcontent.com',
        BACKEND_URL: 'https://api-staging.neuralcontent.com',
        
        DB_SYNCHRONIZE: 'false',
        DB_LOGGING: 'warn',
        LOG_LEVEL: 'info',
        SWAGGER_ENABLED: 'true',
        ENABLE_METRICS: 'true'
      }
    },
        PORT: 3001,
        API_PREFIX: 'v1',
        FRONTEND_URL: 'https://app.neuralbook.app',
        BACKEND_URL: 'https://api.neuralbook.app',
        // Database Production
        DB_HOST: '167.235.253.236',
        DB_PORT: 3306,
        DB_USERNAME: 'app_NeuralContent_8785',
        DB_NAME: 'app_NeuralContent_8785',
        // Redis Production
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        // Security
        BCRYPT_ROUNDS: 12,
        RATE_LIMIT_TTL: 60,
        RATE_LIMIT_LIMIT: 100
      },
      // Logging Configuration
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Process Management
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Health Monitoring
      health_check_url: 'http://localhost:3001/v1/health',
      health_check_grace_period: 10000,
      // Performance
      node_args: '--max-old-space-size=2048',
      // Restart Policies
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Source Map Support
      source_map_support: true,
      // Time Zone
      time_zone: 'America/Sao_Paulo'
    },

    {
      // 🛠️ DEVELOPMENT CONFIGURATION
      name: 'neuralcontent-api-dev',
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: ['dist'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'logs', 'coverage', '.git'],
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        API_PREFIX: 'v1',
        FRONTEND_URL: 'http://localhost:3000',
        BACKEND_URL: 'http://localhost:3001'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        API_PREFIX: 'v1',
        FRONTEND_URL: 'http://localhost:3000',
        BACKEND_URL: 'http://localhost:3001',
        // Database Development (usando produção temporariamente)
        DB_HOST: '167.235.253.236',
        DB_PORT: 3306,
        DB_USERNAME: 'app_NeuralContent_8785',
        DB_NAME: 'app_NeuralContent_8785',
        // Redis Development
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        // Security (menos restritivo para dev)
        BCRYPT_ROUNDS: 8,
        RATE_LIMIT_TTL: 60,
        RATE_LIMIT_LIMIT: 1000
      },
      // Development Logging
      log_file: './logs/dev-app.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Development Process Management
      kill_timeout: 3000,
      listen_timeout: 3000,
      // Development Performance
      node_args: '--max-old-space-size=1024',
      // Development Restart Policies
      min_uptime: '5s',
      max_restarts: 50,
      restart_delay: 1000,
      // Source Map Support
      source_map_support: true,
      // Time Zone
      time_zone: 'America/Sao_Paulo'
    },

    {
      // 🧪 STAGING CONFIGURATION
      name: 'neuralcontent-api-staging',
      script: './dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '250M',
      env: {
        NODE_ENV: 'staging',
        PORT: 3002,
        API_PREFIX: 'v1',
        FRONTEND_URL: 'https://staging.neuralbook.app',
        BACKEND_URL: 'https://api-staging.neuralbook.app'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3002,
        API_PREFIX: 'v1',
        FRONTEND_URL: 'https://staging.neuralbook.app',
        BACKEND_URL: 'https://api-staging.neuralbook.app',
        // Database Staging
        DB_HOST: '167.235.253.236',
        DB_PORT: 3306,
        DB_USERNAME: 'app_NeuralContent_8785',
        DB_NAME: 'app_NeuralContent_8785',
        // Redis Staging
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        // Security
        BCRYPT_ROUNDS: 10,
        RATE_LIMIT_TTL: 60,
        RATE_LIMIT_LIMIT: 200
      },
      // Staging Logging
      log_file: './logs/staging-app.log',
      out_file: './logs/staging-out.log',
      error_file: './logs/staging-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Staging Process Management
      kill_timeout: 4000,
      listen_timeout: 3000,
      // Health Monitoring
      health_check_url: 'http://localhost:3002/v1/health',
      health_check_grace_period: 8000,
      // Performance
      node_args: '--max-old-space-size=1536',
      // Restart Policies
      min_uptime: '8s',
      max_restarts: 15,
      restart_delay: 3000,
      // Source Map Support
      source_map_support: true,
      // Time Zone
      time_zone: 'America/Sao_Paulo'
    }
  ],

  /**
   * 📋 DEPLOYMENT CONFIGURATION
   * Configurações para deploy automático
   */
  deploy: {
    // Production Deploy
    production: {
      user: 'root',
      host: ['api.neuralbook.app'],
      ref: 'origin/main',
      repo: 'https://github.com/hernanegoncalvesmk/backend-app-neuralcontent.git',
      path: '/var/www/neuralcontent-api',
      'post-deploy': 'npm install ; npm run build:prod ; pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update ; apt install git -y',
      'post-setup': 'ls -la',
      env: {
        NODE_ENV: 'production'
      }
    },

    // Staging Deploy
    staging: {
      user: 'root',
      host: ['api-staging.neuralbook.app'],
      ref: 'origin/develop',
      repo: 'https://github.com/hernanegoncalvesmk/backend-app-neuralcontent.git',
      path: '/var/www/neuralcontent-api-staging',
      'post-deploy': 'npm install ; npm run build:prod ; pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'apt update ; apt install git -y',
      'post-setup': 'ls -la',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};

/**
 * 🚀 PM2 USAGE COMMANDS:
 * 
 * # Start applications
 * pm2 start ecosystem.config.js --env production
 * pm2 start ecosystem.config.js --env development
 * pm2 start ecosystem.config.js --env staging
 * 
 * # Monitor applications
 * pm2 status
 * pm2 monit
 * pm2 logs neuralcontent-api-prod
 * 
 * # Manage applications
 * pm2 reload ecosystem.config.js --env production
 * pm2 restart ecosystem.config.js --env production
 * pm2 stop ecosystem.config.js
 * pm2 delete ecosystem.config.js
 * 
 * # Health checks
 * pm2 ping
 * curl http://localhost:3001/v1/health
 * 
 * # Deploy commands
 * pm2 deploy production setup
 * pm2 deploy production
 * pm2 deploy staging setup
 * pm2 deploy staging
 * 
 * # Startup script (para iniciar PM2 automaticamente no boot)
 * pm2 startup
 * pm2 save
 */
