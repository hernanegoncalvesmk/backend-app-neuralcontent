module.exports = {
  apps: [
    {
      name: 'neuralcontent-api',
      script: 'dist/main.js',
      instances: 'max', // ou número específico como 4
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_NAME: 'neuralcontent_dev',
        DB_USERNAME: 'root',
        DB_PASSWORD: 'password',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        JWT_SECRET: 'development-jwt-secret-key',
        ENABLE_SWAGGER: 'true',
        SWAGGER_PATH: 'docs'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || 3306,
        DB_NAME: process.env.DB_NAME || 'neuralcontent',
        DB_USERNAME: process.env.DB_USERNAME,
        DB_PASSWORD: process.env.DB_PASSWORD,
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        ENABLE_SWAGGER: 'false',
        FRONTEND_URL: process.env.FRONTEND_URL
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        DB_HOST: process.env.STAGING_DB_HOST,
        DB_PORT: process.env.STAGING_DB_PORT || 3306,
        DB_NAME: process.env.STAGING_DB_NAME,
        DB_USERNAME: process.env.STAGING_DB_USERNAME,
        DB_PASSWORD: process.env.STAGING_DB_PASSWORD,
        REDIS_HOST: process.env.STAGING_REDIS_HOST,
        REDIS_PORT: process.env.STAGING_REDIS_PORT || 6379,
        JWT_SECRET: process.env.STAGING_JWT_SECRET,
        ENABLE_SWAGGER: 'true',
        SWAGGER_PATH: 'docs'
      },
      
      // PM2 Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // PM2 Process Management
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // PM2 Health Monitoring
      health_check_grace_period: 10000,
      health_check_fatal_exceptions: true,
      
      // PM2 Advanced Options
      node_args: [
        '--max-old-space-size=1024',
        '--expose-gc'
      ],
      
      // PM2 Deployment tracking
      increment_var: 'INSTANCE_ID',
      
      // PM2 Source map support
      source_map_support: true,
      
      // PM2 Instance variables
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // PM2 Deploy configuration (opcional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/hernanegoncalvesmk/backend-app-neuralcontent.git',
      path: '/var/www/neuralcontent-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && npm run migration:run && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/hernanegoncalvesmk/backend-app-neuralcontent.git',
      path: '/var/www/neuralcontent-api-staging',
      'post-deploy': 'npm install && npm run build && npm run migration:run && pm2 reload ecosystem.config.js --env staging'
    }
  }
};
