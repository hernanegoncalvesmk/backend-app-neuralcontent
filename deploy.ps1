#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy script for NeuralContent API

.DESCRIPTION
    Comprehensive deployment script supporting multiple environments (prod, dev, staging)
    with PM2 process management, health checks, and automated deployment workflows.

.PARAMETER Environment
    Target environment (prod, dev, staging)

.PARAMETER Action
    Action to perform (start, restart, reload, stop, delete)

.PARAMETER Help
    Show help information

.EXAMPLE
    .\deploy.ps1 -Environment prod -Action start
    Deploy to production and start the application

.EXAMPLE
    .\deploy.ps1 -Environment dev -Action restart
    Restart development environment

.EXAMPLE
    .\deploy.ps1 -Help
    Show help information
#>

param(
    [Parameter()]
    [ValidateSet("prod", "production", "dev", "development", "staging")]
    [string]$Environment = "dev",
    
    [Parameter()]
    [ValidateSet("start", "restart", "reload", "stop", "delete")]
    [string]$Action = "start",
    
    [Parameter()]
    [switch]$Help
)

# Global configuration
$Script:AppName = "NeuralContent API"
$Script:LogFile = "deploy.log"

# Color functions for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    # Write to console with color
    Write-Host $logMessage -ForegroundColor $Color
    
    # Write to log file
    Add-Content -Path $Script:LogFile -Value $logMessage -ErrorAction SilentlyContinue
}

function Log-Info {
    param([string]$Message)
    Write-ColorOutput $Message "Cyan"
}

function Log-Success {
    param([string]$Message)
    Write-ColorOutput $Message "Green"
}

function Log-Warning {
    param([string]$Message)
    Write-ColorOutput $Message "Yellow"
}

function Log-Error {
    param([string]$Message)
    Write-ColorOutput $Message "Red"
}

function Invoke-Deploy {
    param(
        [string]$Env,
        [string]$Action
    )
    
    Log-Info "🚀 Deploying $Script:AppName to $Env environment..."
    
    switch ($Env.ToLower()) {
        { $_ -in "prod", "production" } {
            Log-Info "📦 Building for production..."
            npm run build:prod
            
            switch ($Action.ToLower()) {
                "start" {
                    Log-Info "🟢 Starting production server..."
                    pm2 start ecosystem.config.js --env production
                }
                "restart" {
                    Log-Info "🔄 Restarting production server..."
                    pm2 restart ecosystem.config.js --env production
                }
                "reload" {
                    Log-Info "♻️ Reloading production server..."
                    pm2 reload ecosystem.config.js --env production
                }
                "stop" {
                    Log-Info "🛑 Stopping production server..."
                    pm2 stop ecosystem.config.js --env production
                }
                "delete" {
                    Log-Info "🗑️ Deleting production server..."
                    pm2 delete ecosystem.config.js --env production
                }
                default {
                    Log-Error "Unknown action: $Action"
                    exit 1
                }
            }
        }
        
        { $_ -in "dev", "development" } {
            Log-Info "📦 Building for development..."
            npm run build
            
            switch ($Action.ToLower()) {
                "start" {
                    Log-Info "🟢 Starting development server..."
                    pm2 start ecosystem.config.js --env development
                }
                "restart" {
                    Log-Info "🔄 Restarting development server..."
                    pm2 restart ecosystem.config.js --env development
                }
                "reload" {
                    Log-Info "♻️ Reloading development server..."
                    pm2 reload ecosystem.config.js --env development
                }
                "stop" {
                    Log-Info "🛑 Stopping development server..."
                    pm2 stop ecosystem.config.js --env development
                }
                "delete" {
                    Log-Info "🗑️ Deleting development server..."
                    pm2 delete ecosystem.config.js --env development
                }
                default {
                    Log-Error "Unknown action: $Action"
                    exit 1
                }
            }
        }
        
        "staging" {
            Log-Info "📦 Building for staging..."
            npm run build:prod
            
            switch ($Action.ToLower()) {
                "start" {
                    Log-Info "🟢 Starting staging server..."
                    pm2 start ecosystem.config.js --env staging
                }
                "restart" {
                    Log-Info "🔄 Restarting staging server..."
                    pm2 restart ecosystem.config.js --env staging
                }
                "reload" {
                    Log-Info "♻️ Reloading staging server..."
                    pm2 reload ecosystem.config.js --env staging
                }
                "stop" {
                    Log-Info "🛑 Stopping staging server..."
                    pm2 stop ecosystem.config.js --env staging
                }
                "delete" {
                    Log-Info "🗑️ Deleting staging server..."
                    pm2 delete ecosystem.config.js --env staging
                }
                default {
                    Log-Error "Unknown action: $Action"
                    exit 1
                }
            }
        }
        
        default {
            Log-Error "Unknown environment: $Env"
            Log-Info "Available environments: prod, dev, staging"
            Show-Help
            exit 1
        }
    }
    
    # Show status
    Log-Info "📊 PM2 Status:"
    pm2 status
    
    Log-Success "✅ Deployment completed successfully!"
}

function Test-Health {
    param([string]$Env = "dev")
    
    $port = switch ($Env.ToLower()) {
        { $_ -in "prod", "production" } { 3001 }
        { $_ -in "dev", "development" } { 3001 }
        "staging" { 3002 }
        default { 3001 }
    }
    
    Log-Info "🏥 Running health check for $Env environment on port $port..."
    
    # Wait for server to start
    Start-Sleep -Seconds 5
    
    # Check health endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/v1/health" -Method GET -TimeoutSec 10
        Log-Success "✅ Health check passed!"
        Log-Info "🌐 Server is running at: http://localhost:$port"
        Log-Info "📚 API Documentation: http://localhost:$port/api"
        
        # Display health info
        if ($response.status) {
            Log-Info "📊 Server Status: $($response.status)"
        }
    }
    catch {
        Log-Error "❌ Health check failed!"
        Log-Info "📝 Check logs for more information:"
        pm2 logs --lines 20
        exit 1
    }
}

function Show-Help {
    Write-Host @"
🚀 NeuralContent API Deployment Script

USAGE:
    .\deploy.ps1 -Environment <env> -Action <action>

PARAMETERS:
    -Environment    Target environment (prod|dev|staging)
    -Action         Action to perform (start|restart|reload|stop|delete)
    -Help           Show this help message

EXAMPLES:
    .\deploy.ps1 -Environment prod -Action start      # Deploy to production
    .\deploy.ps1 -Environment dev -Action restart     # Restart development
    .\deploy.ps1 -Environment staging -Action reload  # Reload staging

AVAILABLE ENVIRONMENTS:
    - prod/production: Production environment with cluster mode
    - dev/development: Development environment with watch mode
    - staging:         Staging environment for testing

AVAILABLE ACTIONS:
    - start:    Start the application
    - restart:  Restart the application (faster than stop+start)
    - reload:   Reload the application (zero-downtime)
    - stop:     Stop the application
    - delete:   Remove the application from PM2
"@ -ForegroundColor Cyan
}

function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    # Validate environment
    if (-not $Environment) {
        Log-Error "Environment parameter is required"
        Show-Help
        exit 1
    }
    
    # Pre-deployment checks
    Log-Info "🔍 Running pre-deployment checks..."
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Log-Success "✅ Node.js version: $nodeVersion"
    }
    catch {
        Log-Error "❌ Node.js is not installed or not in PATH"
        exit 1
    }
    
    # Check if npm is available
    try {
        $npmVersion = npm --version
        Log-Success "✅ npm version: $npmVersion"
    }
    catch {
        Log-Error "❌ npm is not installed or not in PATH"
        exit 1
    }
    
    # Check if PM2 is installed
    try {
        $pm2Version = pm2 --version
        Log-Success "✅ PM2 version: $pm2Version"
    }
    catch {
        Log-Error "❌ PM2 is not installed. Installing PM2..."
        npm install -g pm2
    }
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Log-Error "❌ package.json not found. Are you in the correct directory?"
        exit 1
    }
    
    Log-Success "✅ All pre-deployment checks passed!"
    
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Log-Info "📦 Installing dependencies..."
        npm install
    }
    
    # Perform deployment
    Invoke-Deploy -Env $Environment -Action $Action
    
    # Run health check after deployment
    if ($Action -eq "start") {
        Test-Health -Env $Environment
    }
}

# Script entry point
try {
    Main
}
catch {
    Log-Error "❌ Deployment failed: $($_.Exception.Message)"
    Log-Error "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}
