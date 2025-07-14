# ==============================================
# NEURALCONTENT API - PRODUCTION HEALTH CHECK
# ==============================================

function Test-SystemRequirements {
    Write-Host "Verificando requisitos do sistema..." -ForegroundColor Yellow
    
    $requirements = @()
    
    # Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{Name="Node.js"; Status="OK"; Version=$nodeVersion}
        } else {
            $requirements += @{Name="Node.js"; Status="ERRO"; Version="Nao encontrado"}
        }
    } catch {
        $requirements += @{Name="Node.js"; Status="ERRO"; Version="Nao encontrado"}
    }
    
    # NPM
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{Name="NPM"; Status="OK"; Version="v$npmVersion"}
        } else {
            $requirements += @{Name="NPM"; Status="ERRO"; Version="Nao encontrado"}
        }
    } catch {
        $requirements += @{Name="NPM"; Status="ERRO"; Version="Nao encontrado"}
    }
    
    # Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{Name="Docker"; Status="OK"; Version=$dockerVersion}
        } else {
            $requirements += @{Name="Docker"; Status="ERRO"; Version="Nao encontrado"}
        }
    } catch {
        $requirements += @{Name="Docker"; Status="ERRO"; Version="Nao encontrado"}
    }
    
    Write-Host "Resultado da verificacao:" -ForegroundColor Cyan
    $requirements | ForEach-Object {
        $status = if ($_.Status -eq "OK") { "[OK]" } else { "[ERRO]" }
        Write-Host "   $status $($_.Name): $($_.Version)" -ForegroundColor White
    }
    
    return $requirements
}

function Test-ConfigurationFiles {
    Write-Host "Verificando arquivos de configuracao..." -ForegroundColor Yellow
    
    $configFiles = @(
        ".env.production",
        "package.json", 
        "tsconfig.json",
        "nest-cli.json",
        "ecosystem.config.js",
        "Dockerfile",
        "docker-compose.yml",
        ".dockerignore"
    )
    
    $results = @()
    foreach ($file in $configFiles) {
        $exists = Test-Path $file
        $status = if ($exists) { "[OK]" } else { "[ERRO]" }
        $results += @{File = $file; Status = $status; Exists = $exists}
        
        $color = if ($exists) { "Green" } else { "Red" }
        Write-Host "   $status $file" -ForegroundColor $color
    }
    
    return $results
}

function Test-EnvironmentVariables {
    Write-Host "Verificando variaveis de ambiente..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".env.production")) {
        Write-Host "   [ERRO] Arquivo .env.production nao encontrado!" -ForegroundColor Red
        return $false
    }
    
    $envContent = Get-Content ".env.production" -Raw
    $criticalVars = @(
        "NODE_ENV",
        "PORT", 
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
        "REDIS_HOST",
        "REDIS_PORT",
        "JWT_SECRET"
    )
    
    $missingVars = @()
    foreach ($var in $criticalVars) {
        if ($envContent -notmatch "$var=") {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -eq 0) {
        Write-Host "   [OK] Todas as variaveis criticas configuradas" -ForegroundColor Green
        return $true
    } else {
        Write-Host "   [ERRO] Variaveis nao encontradas:" -ForegroundColor Red
        $missingVars | ForEach-Object {
            Write-Host "     - $_" -ForegroundColor Red
        }
        return $false
    }
}

function Test-ProjectStructure {
    Write-Host "Verificando estrutura do projeto..." -ForegroundColor Yellow
    
    $requiredDirs = @("src", "dist")
    $allGood = $true
    
    foreach ($dir in $requiredDirs) {
        $exists = Test-Path $dir
        $status = if ($exists) { "[OK]" } else { "[ERRO]" }
        $color = if ($exists) { "Green" } else { "Red" }
        Write-Host "   $status $dir/" -ForegroundColor $color
        
        if (-not $exists) { $allGood = $false }
    }
    
    return $allGood
}

function Start-ProductionHealthCheck {
    Clear-Host
    Write-Host "NEURALCONTENT API - VERIFICACAO DE PRODUCAO" -ForegroundColor Blue
    Write-Host "===========================================" -ForegroundColor Blue
    Write-Host ""
    
    $sysReq = Test-SystemRequirements
    Write-Host ""
    
    $configFiles = Test-ConfigurationFiles  
    Write-Host ""
    
    $envVars = Test-EnvironmentVariables
    Write-Host ""
    
    $projectStruct = Test-ProjectStructure
    Write-Host ""
    
    # Contagem de problemas
    $criticalIssues = 0
    
    $sysReq | Where-Object { $_.Status -eq "ERRO" } | ForEach-Object { $criticalIssues++ }
    $configFiles | Where-Object { -not $_.Exists } | ForEach-Object { $criticalIssues++ }
    if (-not $envVars) { $criticalIssues++ }
    if (-not $projectStruct) { $criticalIssues++ }
    
    Write-Host "RESUMO FINAL:" -ForegroundColor Blue
    Write-Host "=============" -ForegroundColor Blue
    
    if ($criticalIssues -eq 0) {
        Write-Host "[OK] PRONTO PARA PRODUCAO!" -ForegroundColor Green
        Write-Host "Todos os requisitos foram atendidos." -ForegroundColor Green
    } else {
        Write-Host "[ERRO] NAO PRONTO PARA PRODUCAO" -ForegroundColor Red
        Write-Host "$criticalIssues problemas encontrados" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "1. Execute: deploy-docker.ps1 para iniciar deploy" -ForegroundColor Cyan
    Write-Host "2. Verifique: PRODUCTION-SETUP.md para documentacao" -ForegroundColor Cyan
    
    Write-Host ""
    Read-Host "Pressione Enter para continuar"
}

# Executar verificacao
Start-ProductionHealthCheck
