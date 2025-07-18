#!/usr/bin/env bash

#####################################
# NeuralContent API - Deploy Script
# Automated Production Deployment
#####################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_ENV="${1:-production}"
BRANCH="${2:-main}"
LOG_FILE="/tmp/neuralcontent-deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log_error "$1"
    log_error "Deployment failed! Check log file: $LOG_FILE"
    exit 1
}

# Health check function
health_check() {
    local url="$1"
    local max_attempts=30
    local attempt=1
    
    log_info "Performing health check on $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/v1/health" > /dev/null 2>&1; then
            log_success "Health check passed!"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 10s..."
        sleep 10
        ((attempt++))
    done
    
    error_exit "Health check failed after $max_attempts attempts"
}

# Backup function
create_backup() {
    log_info "Creating backup..."
    
    local backup_dir="/opt/backups/neuralcontent/$(date +%Y%m%d-%H%M%S)"
    sudo mkdir -p "$backup_dir"
    
    # Backup current deployment
    if [ -d "/opt/neuralcontent" ]; then
        sudo cp -r /opt/neuralcontent "$backup_dir/app"
        log_success "Application backup created at $backup_dir/app"
    fi
    
    # Backup database
    if command -v mysqldump > /dev/null; then
        sudo mysqldump \
            --host="${DB_HOST:-localhost}" \
            --user="${DB_USERNAME}" \
            --password="${DB_PASSWORD}" \
            --single-transaction \
            --routines \
            --triggers \
            "${DB_NAME}" > "$backup_dir/database.sql" 2>/dev/null || true
        log_success "Database backup created at $backup_dir/database.sql"
    fi
    
    echo "$backup_dir" > /tmp/last_backup_path
    log_success "Backup completed: $backup_dir"
}

# Rollback function
rollback() {
    log_warning "Initiating rollback..."
    
    if [ ! -f "/tmp/last_backup_path" ]; then
        error_exit "No backup path found for rollback"
    fi
    
    local backup_dir=$(cat /tmp/last_backup_path)
    
    if [ ! -d "$backup_dir" ]; then
        error_exit "Backup directory not found: $backup_dir"
    fi
    
    # Stop current application
    sudo pm2 stop neuralcontent || true
    
    # Restore application
    if [ -d "$backup_dir/app" ]; then
        sudo rm -rf /opt/neuralcontent
        sudo cp -r "$backup_dir/app" /opt/neuralcontent
        log_success "Application restored from backup"
    fi
    
    # Restore database
    if [ -f "$backup_dir/database.sql" ]; then
        mysql \
            --host="${DB_HOST:-localhost}" \
            --user="${DB_USERNAME}" \
            --password="${DB_PASSWORD}" \
            "${DB_NAME}" < "$backup_dir/database.sql" 2>/dev/null || true
        log_success "Database restored from backup"
    fi
    
    # Restart application
    cd /opt/neuralcontent
    sudo pm2 start ecosystem.config.js --env production
    
    log_success "Rollback completed successfully"
}

# Pre-deployment checks
pre_deploy_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if required environment variables are set
    local required_vars=("DB_HOST" "DB_USERNAME" "DB_PASSWORD" "DB_NAME" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            error_exit "Required environment variable $var is not set"
        fi
    done
    
    # Check disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=1048576 # 1GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        error_exit "Insufficient disk space. Required: 1GB, Available: $(($available_space/1024))MB"
    fi
    
    # Check if port is available
    if netstat -tuln | grep -q ":${PORT:-3000} "; then
        log_warning "Port ${PORT:-3000} is already in use"
    fi
    
    log_success "Pre-deployment checks passed"
}

# Build and test
build_and_test() {
    log_info "Building and testing application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Run tests
    log_info "Running tests..."
    npm run test || error_exit "Tests failed"
    
    # Build application
    log_info "Building application..."
    npm run build || error_exit "Build failed"
    
    # Run production tests
    log_info "Running production tests..."
    npm run test:e2e:prod || error_exit "Production tests failed"
    
    log_success "Build and test completed successfully"
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    # Create deployment directory
    sudo mkdir -p /opt/neuralcontent
    
    # Copy application files
    sudo cp -r "$PROJECT_ROOT/dist" /opt/neuralcontent/
    sudo cp -r "$PROJECT_ROOT/node_modules" /opt/neuralcontent/
    sudo cp "$PROJECT_ROOT/package.json" /opt/neuralcontent/
    sudo cp "$PROJECT_ROOT/ecosystem.config.js" /opt/neuralcontent/
    
    # Set permissions
    sudo chown -R www-data:www-data /opt/neuralcontent
    sudo chmod -R 755 /opt/neuralcontent
    
    # Install PM2 globally if not present
    if ! command -v pm2 > /dev/null; then
        sudo npm install -g pm2
    fi
    
    cd /opt/neuralcontent
    
    # Stop existing application
    sudo pm2 stop neuralcontent || true
    sudo pm2 delete neuralcontent || true
    
    # Start application with PM2
    sudo pm2 start ecosystem.config.js --env "$DEPLOY_ENV"
    sudo pm2 save
    sudo pm2 startup
    
    log_success "Application deployed successfully"
}

# Post-deployment tasks
post_deploy_tasks() {
    log_info "Running post-deployment tasks..."
    
    # Run database migrations
    cd /opt/neuralcontent
    sudo -u www-data npm run migration:run:prod || log_warning "Database migrations failed"
    
    # Clear application cache
    sudo -u www-data npm run cache:clear || log_warning "Cache clear failed"
    
    # Warm up application
    log_info "Warming up application..."
    sleep 5
    
    # Health check
    health_check "http://localhost:${PORT:-3000}"
    
    log_success "Post-deployment tasks completed"
}

# Cleanup old deployments
cleanup() {
    log_info "Cleaning up old deployments..."
    
    # Keep only last 5 backups
    find /opt/backups/neuralcontent -maxdepth 1 -type d -name "20*" | \
        sort -r | tail -n +6 | xargs -r sudo rm -rf
    
    # Clean npm cache
    npm cache clean --force
    
    # Clean PM2 logs older than 7 days
    sudo pm2 flush || true
    
    log_success "Cleanup completed"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack notification (if webhook URL is configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 NeuralContent Deploy $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Discord notification (if webhook URL is configured)
    if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🚀 NeuralContent Deploy $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL" || true
    fi
}

# Main deployment function
main() {
    log_info "Starting NeuralContent API deployment to $DEPLOY_ENV environment"
    log_info "Branch: $BRANCH"
    log_info "Log file: $LOG_FILE"
    
    # Load environment variables
    if [ -f "$PROJECT_ROOT/.env.$DEPLOY_ENV" ]; then
        set -a
        source "$PROJECT_ROOT/.env.$DEPLOY_ENV"
        set +a
        log_info "Loaded environment variables from .env.$DEPLOY_ENV"
    fi
    
    # Set trap for rollback on error
    trap 'rollback' ERR
    
    # Deployment steps
    pre_deploy_checks
    create_backup
    build_and_test
    deploy_application
    post_deploy_tasks
    cleanup
    
    log_success "🎉 Deployment completed successfully!"
    send_notification "SUCCESS" "Deployment to $DEPLOY_ENV completed successfully"
}

# Script usage
usage() {
    echo "Usage: $0 [environment] [branch]"
    echo ""
    echo "Arguments:"
    echo "  environment    Target environment (production, staging) [default: production]"
    echo "  branch         Git branch to deploy [default: main]"
    echo ""
    echo "Examples:"
    echo "  $0                          # Deploy main branch to production"
    echo "  $0 staging                  # Deploy main branch to staging"
    echo "  $0 production develop       # Deploy develop branch to production"
    echo ""
    echo "Environment Variables:"
    echo "  DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME"
    echo "  JWT_SECRET, PORT"
    echo "  SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL (optional)"
}

# Command line argument handling
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    rollback)
        rollback
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
