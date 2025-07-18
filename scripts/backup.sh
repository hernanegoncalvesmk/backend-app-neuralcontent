#!/usr/bin/env bash

#####################################
# NeuralContent API - Backup Script
# Automated Database & Application Backup
#####################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_TYPE="${1:-full}"
BACKUP_BASE_DIR="${BACKUP_DIR:-/opt/backups/neuralcontent}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_FILE="/var/log/neuralcontent-backup-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log_error "$1"
    send_notification "FAILED" "Backup failed: $1"
    exit 1
}

# Load environment variables
load_config() {
    local env_file="$PROJECT_ROOT/.env.production"
    
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
        log_info "Loaded configuration from $env_file"
    else
        log_warning "Production environment file not found, using environment variables"
    fi
    
    # Validate required variables
    local required_vars=("DB_HOST" "DB_USERNAME" "DB_PASSWORD" "DB_NAME")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            error_exit "Required environment variable $var is not set"
        fi
    done
}

# Create backup directory structure
setup_backup_directories() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_type_dir="$BACKUP_BASE_DIR/$BACKUP_TYPE"
    
    export BACKUP_DIR="$backup_type_dir/$timestamp"
    export DB_BACKUP_DIR="$BACKUP_DIR/database"
    export APP_BACKUP_DIR="$BACKUP_DIR/application"
    export UPLOADS_BACKUP_DIR="$BACKUP_DIR/uploads"
    export LOGS_BACKUP_DIR="$BACKUP_DIR/logs"
    
    mkdir -p "$DB_BACKUP_DIR" "$APP_BACKUP_DIR" "$UPLOADS_BACKUP_DIR" "$LOGS_BACKUP_DIR"
    
    log_info "Backup directory created: $BACKUP_DIR"
}

# Database backup
backup_database() {
    log_info "Starting database backup..."
    
    local db_file="$DB_BACKUP_DIR/neuralcontent_$(date +%Y%m%d_%H%M%S).sql"
    local db_compressed="$db_file.gz"
    
    # Create database dump
    mysqldump \
        --host="$DB_HOST" \
        --port="${DB_PORT:-3306}" \
        --user="$DB_USERNAME" \
        --password="$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --quick \
        --lock-tables=false \
        --add-drop-table \
        --add-locks \
        --extended-insert \
        --disable-keys \
        "$DB_NAME" > "$db_file" || error_exit "Database backup failed"
    
    # Compress backup
    gzip "$db_file" || error_exit "Database backup compression failed"
    
    # Verify backup
    if [ ! -f "$db_compressed" ] || [ ! -s "$db_compressed" ]; then
        error_exit "Database backup verification failed"
    fi
    
    local size=$(du -h "$db_compressed" | cut -f1)
    log_success "Database backup completed: $db_compressed ($size)"
    
    # Create backup metadata
    cat > "$DB_BACKUP_DIR/metadata.json" << EOF
{
    "backup_type": "database",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "database": "$DB_NAME",
    "host": "$DB_HOST",
    "file": "$(basename "$db_compressed")",
    "size": "$size",
    "compressed": true,
    "checksum": "$(md5sum "$db_compressed" | cut -d' ' -f1)"
}
EOF
}

# Application backup
backup_application() {
    log_info "Starting application backup..."
    
    local app_archive="$APP_BACKUP_DIR/application_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    # Backup application files
    if [ -d "/opt/neuralcontent" ]; then
        tar -czf "$app_archive" \
            -C /opt/neuralcontent \
            --exclude='node_modules' \
            --exclude='logs' \
            --exclude='temp' \
            --exclude='*.log' \
            . || error_exit "Application backup failed"
    elif [ -d "$PROJECT_ROOT" ]; then
        tar -czf "$app_archive" \
            -C "$PROJECT_ROOT" \
            --exclude='node_modules' \
            --exclude='dist' \
            --exclude='logs' \
            --exclude='temp' \
            --exclude='*.log' \
            --exclude='.git' \
            . || error_exit "Application backup failed"
    else
        error_exit "Application directory not found"
    fi
    
    # Verify backup
    if [ ! -f "$app_archive" ] || [ ! -s "$app_archive" ]; then
        error_exit "Application backup verification failed"
    fi
    
    local size=$(du -h "$app_archive" | cut -f1)
    log_success "Application backup completed: $app_archive ($size)"
    
    # Create backup metadata
    cat > "$APP_BACKUP_DIR/metadata.json" << EOF
{
    "backup_type": "application",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "file": "$(basename "$app_archive")",
    "size": "$size",
    "compressed": true,
    "checksum": "$(md5sum "$app_archive" | cut -d' ' -f1)"
}
EOF
}

# Uploads backup
backup_uploads() {
    log_info "Starting uploads backup..."
    
    local uploads_dir="${UPLOADS_DIR:-/opt/neuralcontent/uploads}"
    local uploads_archive="$UPLOADS_BACKUP_DIR/uploads_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    if [ -d "$uploads_dir" ] && [ "$(ls -A "$uploads_dir" 2>/dev/null)" ]; then
        tar -czf "$uploads_archive" -C "$uploads_dir" . || error_exit "Uploads backup failed"
        
        local size=$(du -h "$uploads_archive" | cut -f1)
        log_success "Uploads backup completed: $uploads_archive ($size)"
        
        # Create backup metadata
        cat > "$UPLOADS_BACKUP_DIR/metadata.json" << EOF
{
    "backup_type": "uploads",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "source_dir": "$uploads_dir",
    "file": "$(basename "$uploads_archive")",
    "size": "$size",
    "compressed": true,
    "checksum": "$(md5sum "$uploads_archive" | cut -d' ' -f1)"
}
EOF
    else
        log_warning "Uploads directory is empty or doesn't exist: $uploads_dir"
    fi
}

# Logs backup
backup_logs() {
    log_info "Starting logs backup..."
    
    local logs_archive="$LOGS_BACKUP_DIR/logs_$(date +%Y%m%d_%H%M%S).tar.gz"
    local log_sources=("/opt/neuralcontent/logs" "/var/log/pm2" "$PROJECT_ROOT/logs")
    local found_logs=false
    
    # Create temporary directory for log collection
    local temp_logs_dir=$(mktemp -d)
    
    for log_dir in "${log_sources[@]}"; do
        if [ -d "$log_dir" ] && [ "$(ls -A "$log_dir" 2>/dev/null)" ]; then
            cp -r "$log_dir" "$temp_logs_dir/$(basename "$log_dir")" 2>/dev/null || true
            found_logs=true
        fi
    done
    
    if [ "$found_logs" = true ]; then
        tar -czf "$logs_archive" -C "$temp_logs_dir" . || error_exit "Logs backup failed"
        
        local size=$(du -h "$logs_archive" | cut -f1)
        log_success "Logs backup completed: $logs_archive ($size)"
        
        # Create backup metadata
        cat > "$LOGS_BACKUP_DIR/metadata.json" << EOF
{
    "backup_type": "logs",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "file": "$(basename "$logs_archive")",
    "size": "$size",
    "compressed": true,
    "checksum": "$(md5sum "$logs_archive" | cut -d' ' -f1)"
}
EOF
    else
        log_warning "No log files found to backup"
    fi
    
    # Cleanup temporary directory
    rm -rf "$temp_logs_dir"
}

# Create backup summary
create_backup_summary() {
    log_info "Creating backup summary..."
    
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    local file_count=$(find "$BACKUP_DIR" -type f | wc -l)
    
    cat > "$BACKUP_DIR/summary.json" << EOF
{
    "backup_info": {
        "type": "$BACKUP_TYPE",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "directory": "$BACKUP_DIR",
        "total_size": "$total_size",
        "file_count": $file_count,
        "retention_days": $RETENTION_DAYS
    },
    "components": {
        "database": $([ -f "$DB_BACKUP_DIR/metadata.json" ] && cat "$DB_BACKUP_DIR/metadata.json" || echo 'null'),
        "application": $([ -f "$APP_BACKUP_DIR/metadata.json" ] && cat "$APP_BACKUP_DIR/metadata.json" || echo 'null'),
        "uploads": $([ -f "$UPLOADS_BACKUP_DIR/metadata.json" ] && cat "$UPLOADS_BACKUP_DIR/metadata.json" || echo 'null'),
        "logs": $([ -f "$LOGS_BACKUP_DIR/metadata.json" ] && cat "$LOGS_BACKUP_DIR/metadata.json" || echo 'null')
    }
}
EOF
    
    log_success "Backup summary created: $BACKUP_DIR/summary.json"
    log_success "Total backup size: $total_size ($file_count files)"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    find "$BACKUP_BASE_DIR" -type d -name "20*-*" -mtime +$RETENTION_DAYS | while read -r old_backup; do
        if [ -d "$old_backup" ]; then
            log_info "Removing old backup: $old_backup"
            rm -rf "$old_backup"
            ((deleted_count++))
        fi
    done
    
    if [ $deleted_count -gt 0 ]; then
        log_success "Removed $deleted_count old backup directories"
    else
        log_info "No old backups to remove"
    fi
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    local backup_info=""
    
    if [ "$status" = "SUCCESS" ] && [ -f "$BACKUP_DIR/summary.json" ]; then
        local size=$(jq -r '.backup_info.total_size' "$BACKUP_DIR/summary.json" 2>/dev/null || echo "unknown")
        backup_info=" (Size: $size)"
    fi
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"💾 NeuralContent Backup $status: $message$backup_info\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Discord notification
    if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"💾 NeuralContent Backup $status: $message$backup_info\"}" \
            "$DISCORD_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Email notification (if configured)
    if [ -n "${EMAIL_RECIPIENT:-}" ] && command -v mail > /dev/null; then
        echo "$message$backup_info" | mail -s "NeuralContent Backup $status" "$EMAIL_RECIPIENT" || true
    fi
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."
    
    local issues=0
    
    # Check if backup directory exists and is not empty
    if [ ! -d "$BACKUP_DIR" ] || [ ! "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        log_error "Backup directory is empty or doesn't exist"
        ((issues++))
    fi
    
    # Verify database backup
    if [ -f "$DB_BACKUP_DIR/metadata.json" ]; then
        local db_file="$DB_BACKUP_DIR/$(jq -r '.file' "$DB_BACKUP_DIR/metadata.json" 2>/dev/null)"
        if [ ! -f "$db_file" ] || [ ! -s "$db_file" ]; then
            log_error "Database backup file is missing or empty"
            ((issues++))
        fi
    fi
    
    # Verify application backup
    if [ -f "$APP_BACKUP_DIR/metadata.json" ]; then
        local app_file="$APP_BACKUP_DIR/$(jq -r '.file' "$APP_BACKUP_DIR/metadata.json" 2>/dev/null)"
        if [ ! -f "$app_file" ] || [ ! -s "$app_file" ]; then
            log_error "Application backup file is missing or empty"
            ((issues++))
        fi
    fi
    
    if [ $issues -eq 0 ]; then
        log_success "Backup integrity verification passed"
        return 0
    else
        log_error "Backup integrity verification failed with $issues issues"
        return 1
    fi
}

# Main backup function
main() {
    local start_time=$(date +%s)
    
    log_info "Starting NeuralContent backup process..."
    log_info "Backup type: $BACKUP_TYPE"
    log_info "Retention period: $RETENTION_DAYS days"
    log_info "Log file: $LOG_FILE"
    
    # Load configuration
    load_config
    
    # Setup backup directories
    setup_backup_directories
    
    # Perform backup based on type
    case "$BACKUP_TYPE" in
        "full")
            backup_database
            backup_application
            backup_uploads
            backup_logs
            ;;
        "database"|"db")
            backup_database
            ;;
        "application"|"app")
            backup_application
            ;;
        "uploads")
            backup_uploads
            ;;
        "logs")
            backup_logs
            ;;
        *)
            error_exit "Invalid backup type: $BACKUP_TYPE. Use: full, database, application, uploads, logs"
            ;;
    esac
    
    # Create summary and verify
    create_backup_summary
    
    if verify_backup; then
        cleanup_old_backups
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "✅ Backup completed successfully in ${duration}s"
        send_notification "SUCCESS" "Backup ($BACKUP_TYPE) completed successfully in ${duration}s"
    else
        error_exit "Backup verification failed"
    fi
}

# Script usage
usage() {
    echo "Usage: $0 [backup_type]"
    echo ""
    echo "Backup Types:"
    echo "  full         Complete backup (database + application + uploads + logs) [default]"
    echo "  database     Database only"
    echo "  application  Application files only"
    echo "  uploads      User uploads only"
    echo "  logs         Log files only"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_DIR       Base backup directory [default: /opt/backups/neuralcontent]"
    echo "  RETENTION_DAYS   Backup retention period [default: 30]"
    echo "  UPLOADS_DIR      Uploads directory [default: /opt/neuralcontent/uploads]"
    echo "  SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL, EMAIL_RECIPIENT (optional)"
    echo ""
    echo "Examples:"
    echo "  $0               # Full backup"
    echo "  $0 database      # Database backup only"
    echo "  $0 application   # Application backup only"
}

# Command line argument handling
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
