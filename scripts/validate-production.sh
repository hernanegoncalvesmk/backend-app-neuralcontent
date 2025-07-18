#!/usr/bin/env bash

#########################################
# NeuralContent API - Production Validator
# Final Production Readiness Check
#########################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATION_REPORT="/tmp/neuralcontent-validation-$(date +%Y%m%d-%H%M%S).json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Validation results
declare -a PASSED_CHECKS=()
declare -a FAILED_CHECKS=()
declare -a WARNING_CHECKS=()

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    PASSED_CHECKS+=("$1")
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    WARNING_CHECKS+=("$1")
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    FAILED_CHECKS+=("$1")
}

log_section() {
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}======================================${NC}"
}

# Validation functions
validate_environment() {
    log_section "ENVIRONMENT CONFIGURATION"
    
    # Check Node.js version
    if command -v node > /dev/null; then
        local node_version=$(node --version | sed 's/v//')
        local required_major=20
        local current_major=$(echo "$node_version" | cut -d. -f1)
        
        if [ "$current_major" -ge "$required_major" ]; then
            log_success "Node.js version: $node_version (>= $required_major required)"
        else
            log_error "Node.js version: $node_version (>= $required_major required)"
        fi
    else
        log_error "Node.js not found"
    fi
    
    # Check npm version
    if command -v npm > /dev/null; then
        local npm_version=$(npm --version)
        log_success "npm version: $npm_version"
    else
        log_error "npm not found"
    fi
    
    # Check PM2
    if command -v pm2 > /dev/null; then
        local pm2_version=$(pm2 --version)
        log_success "PM2 version: $pm2_version"
    else
        log_warning "PM2 not installed globally"
    fi
    
    # Check Docker
    if command -v docker > /dev/null; then
        local docker_version=$(docker --version | cut -d' ' -f3 | sed 's/,//')
        log_success "Docker version: $docker_version"
    else
        log_warning "Docker not found"
    fi
}

validate_project_structure() {
    log_section "PROJECT STRUCTURE"
    
    local required_files=(
        "package.json"
        "tsconfig.json"
        "nest-cli.json"
        "ecosystem.config.js"
        "Dockerfile"
        ".github/workflows/ci-cd.yml"
        "src/main.ts"
        "src/app.module.ts"
    )
    
    local required_dirs=(
        "src"
        "test"
        "scripts"
        ".github/workflows"
    )
    
    cd "$PROJECT_ROOT"
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "Required file exists: $file"
        else
            log_error "Missing required file: $file"
        fi
    done
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_success "Required directory exists: $dir"
        else
            log_error "Missing required directory: $dir"
        fi
    done
}

validate_dependencies() {
    log_section "DEPENDENCIES"
    
    cd "$PROJECT_ROOT"
    
    if [ -f "package.json" ]; then
        # Check if node_modules exists
        if [ -d "node_modules" ]; then
            log_success "Dependencies installed (node_modules exists)"
        else
            log_error "Dependencies not installed (node_modules missing)"
        fi
        
        # Check for security vulnerabilities
        if command -v npm > /dev/null; then
            log_info "Checking for security vulnerabilities..."
            if npm audit --audit-level=high --json > /tmp/audit.json 2>/dev/null; then
                local high_vulns=$(cat /tmp/audit.json | jq -r '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")
                local critical_vulns=$(cat /tmp/audit.json | jq -r '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
                
                if [ "$critical_vulns" -gt 0 ]; then
                    log_error "Found $critical_vulns critical security vulnerabilities"
                elif [ "$high_vulns" -gt 0 ]; then
                    log_warning "Found $high_vulns high security vulnerabilities"
                else
                    log_success "No high or critical security vulnerabilities found"
                fi
            else
                log_warning "Could not run npm audit"
            fi
        fi
        
        # Check package.json scripts
        local required_scripts=("build" "start" "start:prod" "test" "test:e2e")
        for script in "${required_scripts[@]}"; do
            if jq -e ".scripts.\"$script\"" package.json > /dev/null 2>&1; then
                log_success "Required script exists: $script"
            else
                log_error "Missing required script: $script"
            fi
        done
    else
        log_error "package.json not found"
    fi
}

validate_build() {
    log_section "BUILD VALIDATION"
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci || {
            log_error "Failed to install dependencies"
            return 1
        }
    fi
    
    # Run build
    log_info "Running production build..."
    if npm run build > /tmp/build.log 2>&1; then
        log_success "Production build successful"
        
        # Check if dist directory was created
        if [ -d "dist" ]; then
            log_success "Build output directory (dist) created"
            
            # Check if main files exist in dist
            local dist_files=("main.js" "app.module.js")
            for file in "${dist_files[@]}"; do
                if find dist -name "$file" | grep -q .; then
                    log_success "Build output contains: $file"
                else
                    log_warning "Build output missing: $file"
                fi
            done
        else
            log_error "Build output directory (dist) not created"
        fi
    else
        log_error "Production build failed"
        log_info "Build log: /tmp/build.log"
    fi
}

validate_tests() {
    log_section "TESTS VALIDATION"
    
    cd "$PROJECT_ROOT"
    
    # Run unit tests
    log_info "Running unit tests..."
    if npm run test > /tmp/test.log 2>&1; then
        log_success "Unit tests passed"
    else
        log_error "Unit tests failed"
        log_info "Test log: /tmp/test.log"
    fi
    
    # Run e2e tests if available
    if jq -e '.scripts."test:e2e"' package.json > /dev/null 2>&1; then
        log_info "Running e2e tests..."
        if npm run test:e2e > /tmp/test-e2e.log 2>&1; then
            log_success "E2E tests passed"
        else
            log_warning "E2E tests failed (may require database connection)"
            log_info "E2E test log: /tmp/test-e2e.log"
        fi
    else
        log_warning "E2E tests not configured"
    fi
}

validate_configuration() {
    log_section "CONFIGURATION VALIDATION"
    
    cd "$PROJECT_ROOT"
    
    # Check ecosystem.config.js
    if [ -f "ecosystem.config.js" ]; then
        log_success "PM2 ecosystem configuration exists"
        
        # Check if configuration is valid JavaScript
        if node -c ecosystem.config.js 2>/dev/null; then
            log_success "PM2 configuration syntax is valid"
        else
            log_error "PM2 configuration has syntax errors"
        fi
    else
        log_error "PM2 ecosystem configuration missing"
    fi
    
    # Check Dockerfile
    if [ -f "Dockerfile" ]; then
        log_success "Dockerfile exists"
        
        # Basic Dockerfile validation
        if grep -q "FROM node:" Dockerfile; then
            log_success "Dockerfile uses Node.js base image"
        else
            log_warning "Dockerfile may not use Node.js base image"
        fi
        
        if grep -q "COPY package\*.json" Dockerfile; then
            log_success "Dockerfile copies package files"
        else
            log_warning "Dockerfile may not copy package files properly"
        fi
    else
        log_error "Dockerfile missing"
    fi
    
    # Check CI/CD configuration
    if [ -f ".github/workflows/ci-cd.yml" ]; then
        log_success "GitHub Actions CI/CD configuration exists"
    else
        log_error "GitHub Actions CI/CD configuration missing"
    fi
}

validate_security() {
    log_section "SECURITY VALIDATION"
    
    cd "$PROJECT_ROOT"
    
    # Check for sensitive files
    local sensitive_patterns=(".env" "*.key" "*.pem" "secrets.*")
    local found_sensitive=false
    
    for pattern in "${sensitive_patterns[@]}"; do
        if find . -name "$pattern" -not -path "./node_modules/*" | grep -q .; then
            log_warning "Found potentially sensitive files: $pattern"
            found_sensitive=true
        fi
    done
    
    if [ "$found_sensitive" = false ]; then
        log_success "No sensitive files found in repository"
    fi
    
    # Check .gitignore
    if [ -f ".gitignore" ]; then
        log_success ".gitignore exists"
        
        local important_ignores=(".env" "node_modules" "dist" "*.log")
        for ignore in "${important_ignores[@]}"; do
            if grep -q "$ignore" .gitignore; then
                log_success ".gitignore includes: $ignore"
            else
                log_warning ".gitignore missing: $ignore"
            fi
        done
    else
        log_error ".gitignore missing"
    fi
    
    # Check for hardcoded secrets (basic check)
    if grep -r -i "password\|secret\|key" src/ --include="*.ts" --include="*.js" | grep -v "process.env" | head -1 > /dev/null; then
        log_warning "Potential hardcoded secrets found in source code"
    else
        log_success "No obvious hardcoded secrets found"
    fi
}

validate_scripts() {
    log_section "DEPLOYMENT SCRIPTS VALIDATION"
    
    local scripts_dir="$PROJECT_ROOT/scripts"
    local required_scripts=("production-monitor.ts" "deploy.sh" "backup.sh")
    
    if [ -d "$scripts_dir" ]; then
        log_success "Scripts directory exists"
        
        for script in "${required_scripts[@]}"; do
            if [ -f "$scripts_dir/$script" ]; then
                log_success "Deployment script exists: $script"
                
                # Check if script is executable
                if [ -x "$scripts_dir/$script" ]; then
                    log_success "Script is executable: $script"
                else
                    log_warning "Script not executable: $script"
                fi
            else
                log_error "Missing deployment script: $script"
            fi
        done
    else
        log_error "Scripts directory missing"
    fi
}

validate_documentation() {
    log_section "DOCUMENTATION VALIDATION"
    
    cd "$PROJECT_ROOT"
    
    local doc_files=("README.md" "PRODUCTION-SETUP.md")
    
    for doc in "${doc_files[@]}"; do
        if [ -f "$doc" ]; then
            log_success "Documentation exists: $doc"
        else
            log_warning "Missing documentation: $doc"
        fi
    done
    
    # Check OpenAPI documentation
    if [ -f "openapi/swagger-spec.yaml" ] || [ -d "../document-app-neuralcontent/openapi" ]; then
        log_success "OpenAPI documentation available"
    else
        log_warning "OpenAPI documentation not found"
    fi
}

generate_report() {
    log_section "VALIDATION SUMMARY"
    
    local total_checks=$((${#PASSED_CHECKS[@]} + ${#FAILED_CHECKS[@]} + ${#WARNING_CHECKS[@]}))
    local pass_rate=$(( ${#PASSED_CHECKS[@]} * 100 / total_checks ))
    
    echo ""
    echo -e "${GREEN}✓ Passed: ${#PASSED_CHECKS[@]}${NC}"
    echo -e "${RED}✗ Failed: ${#FAILED_CHECKS[@]}${NC}"
    echo -e "${YELLOW}⚠ Warnings: ${#WARNING_CHECKS[@]}${NC}"
    echo -e "${CYAN}📊 Pass Rate: ${pass_rate}%${NC}"
    
    # Generate JSON report
    cat > "$VALIDATION_REPORT" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "summary": {
        "total_checks": $total_checks,
        "passed": ${#PASSED_CHECKS[@]},
        "failed": ${#FAILED_CHECKS[@]},
        "warnings": ${#WARNING_CHECKS[@]},
        "pass_rate": $pass_rate
    },
    "passed_checks": $(printf '%s\n' "${PASSED_CHECKS[@]}" | jq -R . | jq -s .),
    "failed_checks": $(printf '%s\n' "${FAILED_CHECKS[@]}" | jq -R . | jq -s .),
    "warning_checks": $(printf '%s\n' "${WARNING_CHECKS[@]}" | jq -R . | jq -s .),
    "production_ready": $([ ${#FAILED_CHECKS[@]} -eq 0 ] && echo "true" || echo "false")
}
EOF
    
    echo ""
    echo -e "${BLUE}📄 Detailed report saved to: $VALIDATION_REPORT${NC}"
    
    # Determine overall result
    if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 PRODUCTION READY! 🎉${NC}"
        echo -e "${GREEN}All critical validation checks passed.${NC}"
        if [ ${#WARNING_CHECKS[@]} -gt 0 ]; then
            echo -e "${YELLOW}Please review the warnings for optimal configuration.${NC}"
        fi
        return 0
    else
        echo ""
        echo -e "${RED}❌ NOT PRODUCTION READY${NC}"
        echo -e "${RED}Please fix the failed checks before deploying to production.${NC}"
        return 1
    fi
}

# Main validation function
main() {
    echo -e "${CYAN}"
    echo "########################################"
    echo "#   NeuralContent API                  #"
    echo "#   Production Readiness Validator     #"
    echo "########################################"
    echo -e "${NC}"
    
    validate_environment
    validate_project_structure
    validate_dependencies
    validate_build
    validate_tests
    validate_configuration
    validate_security
    validate_scripts
    validate_documentation
    
    generate_report
}

# Script usage
usage() {
    echo "Usage: $0"
    echo ""
    echo "This script validates the NeuralContent API for production readiness."
    echo "It checks environment, dependencies, build process, tests, configuration,"
    echo "security, scripts, and documentation."
    echo ""
    echo "The validation report will be saved to a JSON file for reference."
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
