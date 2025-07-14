#!/bin/bash

# 🚀 NeuralContent API Deploy Script
# Automated deployment script for production and development environments
# 
# Usage:
#   ./deploy.sh [env] [action]
#   
# Examples:
#   ./deploy.sh prod deploy
#   ./deploy.sh dev start
#   ./deploy.sh staging restart

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="NeuralContent API"
PROJECT_DIR="$(pwd)"
DIST_DIR="$PROJECT_DIR/dist"
LOG_DIR="$PROJECT_DIR/logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Installing PM2..."
        npm install -g pm2
    fi
}

# Check if build directory exists
check_build() {
    if [ ! -d "$DIST_DIR" ]; then
        log_warning "Build directory not found. Building application..."
        npm run build
    fi
}

# Create logs directory if it doesn't exist
check_logs() {
    if [ ! -d "$LOG_DIR" ]; then
        log_info "Creating logs directory..."
        mkdir -p "$LOG_DIR"
    fi
}

# Deploy function
deploy() {
    local env=$1
    local action=${2:-"start"}
    
    log_info "🚀 Deploying $APP_NAME to $env environment..."
    
    case $env in
        "prod"|"production")
            log_info "📦 Building for production..."
            npm run build:prod
            
            case $action in
                "start")
                    log_info "🟢 Starting production server..."
                    pm2 start ecosystem.config.js --env production
                    ;;
                "restart")
                    log_info "🔄 Restarting production server..."
                    pm2 restart ecosystem.config.js --env production
                    ;;
                "reload")
                    log_info "♻️ Reloading production server..."
                    pm2 reload ecosystem.config.js --env production
                    ;;
                "stop")
                    log_info "🛑 Stopping production server..."
                    pm2 stop ecosystem.config.js --env production
                    ;;
                "delete")
                    log_info "🗑️ Deleting production server..."
                    pm2 delete ecosystem.config.js --env production
                    ;;
                *)
                    log_error "Unknown action: $action"
                    exit 1
                    ;;
            esac
            ;;
            
        "dev"|"development")
            log_info "📦 Building for development..."
            npm run build
            
            case $action in
                "start")
                    log_info "🟢 Starting development server..."
                    pm2 start ecosystem.config.js --env development
                    ;;
                "restart")
                    log_info "🔄 Restarting development server..."
                    pm2 restart ecosystem.config.js --env development
                    ;;
                "reload")
                    log_info "♻️ Reloading development server..."
                    pm2 reload ecosystem.config.js --env development
                    ;;
                "stop")
                    log_info "🛑 Stopping development server..."
                    pm2 stop ecosystem.config.js --env development
                    ;;
                "delete")
                    log_info "🗑️ Deleting development server..."
                    pm2 delete ecosystem.config.js --env development
                    ;;
                *)
                    log_error "Unknown action: $action"
                    exit 1
                    ;;
            esac
            ;;
            
        "staging")
            log_info "📦 Building for staging..."
            npm run build:prod
            
            case $action in
                "start")
                    log_info "🟢 Starting staging server..."
                    pm2 start ecosystem.config.js --env staging
                    ;;
                "restart")
                    log_info "🔄 Restarting staging server..."
                    pm2 restart ecosystem.config.js --env staging
                    ;;
                "reload")
                    log_info "♻️ Reloading staging server..."
                    pm2 reload ecosystem.config.js --env staging
                    ;;
                "stop")
                    log_info "🛑 Stopping staging server..."
                    pm2 stop ecosystem.config.js --env staging
                    ;;
                "delete")
                    log_info "🗑️ Deleting staging server..."
                    pm2 delete ecosystem.config.js --env staging
                    ;;
                *)
                    log_error "Unknown action: $action"
                    exit 1
                    ;;
            esac
            ;;
            
        *)
            log_error "Unknown environment: $env"
            log_info "Available environments: prod, dev, staging"
            exit 1
            ;;
    esac
    
    # Show status
    log_info "📊 PM2 Status:"
    pm2 status
    
    # Show logs
    log_info "📝 Recent logs:"
    pm2 logs --lines 10
    
    log_success "✅ Deployment completed successfully!"
}

# Health check function
health_check() {
    local env=${1:-"dev"}
    local port
    
    case $env in
        "prod"|"production") port=3001 ;;
        "dev"|"development") port=3001 ;;
        "staging") port=3002 ;;
        *) port=3001 ;;
    esac
    
    log_info "🏥 Running health check for $env environment on port $port..."
    
    # Wait for server to start
    sleep 5
    
    # Check health endpoint
    if curl -f "http://localhost:$port/v1/health" > /dev/null 2>&1; then
        log_success "✅ Health check passed!"
        log_info "🌐 Server is running at: http://localhost:$port"
        log_info "📚 API Documentation: http://localhost:$port/api"
    else
        log_error "❌ Health check failed!"
        log_info "📝 Check logs for more information:"
        pm2 logs --lines 20
        exit 1
    fi
}

# Show help
show_help() {
    echo -e "${BLUE}🚀 NeuralContent API Deploy Script${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  prod, production  - Production environment"
    echo "  dev, development  - Development environment"
    echo "  staging          - Staging environment"
    echo ""
    echo "Actions:"
    echo "  start    - Start the application"
    echo "  restart  - Restart the application"
    echo "  reload   - Reload the application (zero-downtime)"
    echo "  stop     - Stop the application"
    echo "  delete   - Delete the application from PM2"
    echo ""
    echo "Special commands:"
    echo "  $0 health [env]  - Run health check"
    echo "  $0 status        - Show PM2 status"
    echo "  $0 logs          - Show PM2 logs"
    echo "  $0 help          - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 prod start"
    echo "  $0 dev restart"
    echo "  $0 staging reload"
    echo "  $0 health prod"
}

# Main script
main() {
    local env=$1
    local action=$2
    
    # Check prerequisites
    check_pm2
    check_logs
    
    # Handle special commands
    case $env in
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        "status")
            pm2 status
            exit 0
            ;;
        "logs")
            pm2 logs
            exit 0
            ;;
        "health")
            health_check $action
            exit 0
            ;;
    esac
    
    # Validate environment
    if [ -z "$env" ]; then
        log_error "Environment not specified!"
        show_help
        exit 1
    fi
    
    # Run deployment
    deploy $env $action
    
    # Run health check
    health_check $env
}

# Run main function
main "$@"
