#!/usr/bin/env bash

# ============================================
# 🚀 NEURALCONTENT API - PRODUCTION DEPLOY
# ============================================
# Automated deployment script for production
# Author: NeuralContent Team
# Version: 1.0.0
# ============================================

set -euo pipefail

# ========================================
# 🎯 CONFIGURATION
# ========================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_NAME="neuralcontent-api"
readonly DEPLOY_ENV="${DEPLOY_ENV:-production}"
readonly BUILD_DIR="dist"
readonly LOG_FILE="/var/log/deploy-${PROJECT_NAME}.log"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# ========================================
# 📝 LOGGING FUNCTIONS
# ========================================
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# ========================================
# 🔍 PRE-DEPLOYMENT CHECKS
# ========================================
check_requirements() {
    log "🔍 Checking deployment requirements..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        warn "PM2 is not installed globally. Installing..."
        npm install -g pm2
    fi
    
    # Check Node.js version
    local node_version=$(node -v | cut -d'v' -f2)
    log "Node.js version: $node_version"
    
    # Check if .env.production exists
    if [[ ! -f ".env.production" ]]; then
        error ".env.production file not found"
    fi
    
    log "✅ All requirements satisfied"
}

# ========================================
# 🧹 CLEANUP FUNCTIONS
# ========================================
cleanup_old_builds() {
    log "🧹 Cleaning up old builds..."
    
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
        log "Removed old build directory"
    fi
    
    if [[ -d "node_modules/.cache" ]]; then
        rm -rf "node_modules/.cache"
        log "Cleared npm cache"
    fi
    
    log "✅ Cleanup completed"
}

# ========================================
# 📦 BUILD FUNCTIONS
# ========================================
install_dependencies() {
    log "📦 Installing production dependencies..."
    
    # Install dependencies with exact versions
    npm ci --only=production --silent
    
    # Install dev dependencies for building
    npm install --only=dev --silent
    
    log "✅ Dependencies installed"
}

build_application() {
    log "🔨 Building application for production..."
    
    # Set NODE_ENV for build
    export NODE_ENV=production
    
    # Run production build
    npm run build:prod
    
    # Verify build was successful
    if [[ ! -d "$BUILD_DIR" ]]; then
        error "Build failed - no dist directory found"
    fi
    
    if [[ ! -f "$BUILD_DIR/main.js" ]]; then
        error "Build failed - main.js not found"
    fi
    
    log "✅ Application built successfully"
}

# ========================================
# 🧪 TESTING FUNCTIONS
# ========================================
run_tests() {
    log "🧪 Running production tests..."
    
    # Run linting
    npm run lint
    
    # Run type checking
    npm run typecheck
    
    # Run unit tests
    npm run test:unit
    
    # Run integration tests if available
    if npm run | grep -q "test:e2e:prod"; then
        npm run test:e2e:prod
    fi
    
    log "✅ All tests passed"
}

# ========================================
# 🚀 DEPLOYMENT FUNCTIONS
# ========================================
backup_current_deployment() {
    log "💾 Creating backup of current deployment..."
    
    local backup_dir="/var/backups/${PROJECT_NAME}/$(date +'%Y%m%d_%H%M%S')"
    
    if pm2 list | grep -q "$PROJECT_NAME"; then
        mkdir -p "$backup_dir"
        
        # Backup current application
        if [[ -d "$BUILD_DIR" ]]; then
            cp -r "$BUILD_DIR" "$backup_dir/"
        fi
        
        # Backup PM2 config
        pm2 save
        cp ~/.pm2/dump.pm2 "$backup_dir/"
        
        log "Backup created at: $backup_dir"
    else
        log "No existing deployment found, skipping backup"
    fi
}

deploy_with_pm2() {
    log "🚀 Deploying with PM2..."
    
    # Stop existing processes
    if pm2 list | grep -q "$PROJECT_NAME"; then
        pm2 stop "$PROJECT_NAME" || true
        pm2 delete "$PROJECT_NAME" || true
    fi
    
    # Start new deployment
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup || true
    
    log "✅ Deployment completed with PM2"
}

# ========================================
# 🔍 POST-DEPLOYMENT VERIFICATION
# ========================================
verify_deployment() {
    log "🔍 Verifying deployment..."
    
    # Wait for application to start
    sleep 10
    
    # Check if PM2 process is running
    if ! pm2 list | grep -q "$PROJECT_NAME.*online"; then
        error "Application is not running in PM2"
    fi
    
    # Check if application is responding
    local health_url="http://localhost:3001/v1/health"
    local retries=5
    local delay=5
    
    for i in $(seq 1 $retries); do
        if curl -s -f "$health_url" > /dev/null; then
            log "✅ Application is responding to health checks"
            break
        else
            warn "Health check failed (attempt $i/$retries), retrying in ${delay}s..."
            sleep $delay
            
            if [[ $i -eq $retries ]]; then
                error "Application is not responding to health checks"
            fi
        fi
    done
    
    # Display deployment status
    pm2 status
    pm2 logs "$PROJECT_NAME" --lines 20
    
    log "✅ Deployment verification completed"
}

# ========================================
# 📊 MONITORING SETUP
# ========================================
setup_monitoring() {
    log "📊 Setting up monitoring..."
    
    # Setup log rotation
    if command -v logrotate &> /dev/null; then
        cat > "/etc/logrotate.d/${PROJECT_NAME}" << EOF
/var/log/neuralcontent/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload ${PROJECT_NAME}
    endscript
}
EOF
        log "Log rotation configured"
    fi
    
    # Setup PM2 monitoring
    pm2 install pm2-logrotate || true
    
    log "✅ Monitoring setup completed"
}

# ========================================
# 🎯 MAIN DEPLOYMENT FUNCTION
# ========================================
main() {
    log "🚀 Starting production deployment of $PROJECT_NAME"
    log "Environment: $DEPLOY_ENV"
    log "Timestamp: $(date)"
    
    # Change to script directory
    cd "$SCRIPT_DIR"
    
    # Execute deployment steps
    check_requirements
    cleanup_old_builds
    install_dependencies
    build_application
    run_tests
    backup_current_deployment
    deploy_with_pm2
    verify_deployment
    setup_monitoring
    
    log "🎉 Production deployment completed successfully!"
    log "🔗 Application URL: https://api.neuralcontent.com"
    log "📊 Monitoring: pm2 monit"
    log "📝 Logs: pm2 logs $PROJECT_NAME"
}

# ========================================
# 🔄 ROLLBACK FUNCTION
# ========================================
rollback() {
    log "🔄 Rolling back deployment..."
    
    local backup_dir=$(ls -1t /var/backups/${PROJECT_NAME}/ | head -n 1)
    
    if [[ -z "$backup_dir" ]]; then
        error "No backup found for rollback"
    fi
    
    log "Rolling back to: $backup_dir"
    
    # Stop current deployment
    pm2 stop "$PROJECT_NAME" || true
    pm2 delete "$PROJECT_NAME" || true
    
    # Restore backup
    rm -rf "$BUILD_DIR"
    cp -r "/var/backups/${PROJECT_NAME}/$backup_dir/dist" "$BUILD_DIR"
    
    # Restore PM2 config
    cp "/var/backups/${PROJECT_NAME}/$backup_dir/dump.pm2" ~/.pm2/
    pm2 resurrect
    
    log "✅ Rollback completed"
}

# ========================================
# 🎛️ COMMAND LINE INTERFACE
# ========================================
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "check")
        check_requirements
        ;;
    "build")
        cleanup_old_builds
        install_dependencies
        build_application
        ;;
    "test")
        run_tests
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|check|build|test}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full production deployment"
        echo "  rollback - Rollback to previous version"
        echo "  check    - Check deployment requirements"
        echo "  build    - Build application only"
        echo "  test     - Run tests only"
        exit 1
        ;;
esac
