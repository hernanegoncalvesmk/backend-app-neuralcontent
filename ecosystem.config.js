/**
 * PM2 Ecosystem Configuration
 * NeuralContent API - Production & Development Environments
 * Enhanced for PASSO 3.3 - Production Ready Configuration
 * 
 * @description Configuração profissional para deploy com PM2
 * @author NeuralContent Team
 * @version 1.0.0
 * @license MIT
 */

module.exports = {
  apps: [
    {
      // 🚀 PRODUCTION CONFIGURATION
      name: 'neuralcontent-api-prod',
      script: './dist/main.js',
      instances: 'max', // Utiliza todos os cores disponíveis
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        API_PREFIX: 'v1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        API_PREFIX: 'v1',
        // Load from .env.production file
        env_file: '.env.production'
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
