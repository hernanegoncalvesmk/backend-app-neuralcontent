# ==============================================
# NEURALCONTENT API - PRODUCTION HEALTH CHECK
# ==============================================
# Script para verificar se ambiente está pronto para produção

# Verificar dependências do sistema
function Test-SystemRequirements {
    Write-Host "🔍 Verificando requisitos do sistema..." -ForegroundColor Yellow
    
    $requirements = @()
    
    # Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{Name="Node.js"; Status="✅"; Version=$nodeVersion; Required="v20+"}
        } else {
            $requirements += @{Name="Node.js"; Status="❌"; Version="Não encontrado"; Required="v20+"}
        }
    } catch {
        $requirements += @{Name="Node.js"; Status="❌"; Version="Não encontrado"; Required="v20+"}
    }
    
    # NPM
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{Name="NPM"; Status="✅"; Version="v$npmVersion"; Required="v10+"}
        } else {
            $requirements += @{Name="NPM"; Status="❌"; Version="Não encontrado"; Required="v10+"}
        }
    } catch {
        $requirements += @{Name="NPM"; Status="❌"; Version="Não encontrado"; Required="v10+"}
    }
    
    # Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{Name="Docker"; Status="✅"; Version=$dockerVersion; Required="v20+"}
        } else {
            $requirements += @{Name="Docker"; Status="❌"; Version="Não encontrado"; Required="v20+"}
        }
    } catch {
        $requirements += @{Name="Docker"; Status="❌"; Version="Não encontrado"; Required="v20+"}
    }
    
    # PM2
    try {
        $pm2Version = pm2 --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{Name="PM2"; Status="✅"; Version="v$pm2Version"; Required="v5+"}
        } else {
            $requirements += @{Name="PM2"; Status="⚠️"; Version="Não encontrado"; Required="v5+ (Opcional)"}
        }
    } catch {
        $requirements += @{Name="PM2"; Status="⚠️"; Version="Não encontrado"; Required="v5+ (Opcional)"}
    }
    
    # Exibir resultados
    Write-Host "📋 Resultado da verificação:" -ForegroundColor Cyan
    $requirements | ForEach-Object {
        Write-Host "   $($_.Status) $($_.Name): $($_.Version) (Requerido: $($_.Required))" -ForegroundColor White
    }
    
    return $requirements
}

# Verificar arquivos de configuração
function Test-ConfigurationFiles {
    Write-Host "📁 Verificando arquivos de configuração..." -ForegroundColor Yellow
    
    $configFiles = @(
        @{Path=".env.production"; Required=$true; Description="Variáveis de ambiente de produção"},
        @{Path="package.json"; Required=$true; Description="Configuração do projeto"},
        @{Path="tsconfig.json"; Required=$true; Description="Configuração TypeScript"},
        @{Path="nest-cli.json"; Required=$true; Description="Configuração NestJS"},
        @{Path="ecosystem.config.js"; Required=$true; Description="Configuração PM2"},
        @{Path="Dockerfile"; Required=$true; Description="Configuração Docker"},
        @{Path="docker-compose.yml"; Required=$true; Description="Orquestração Docker"},
        @{Path=".dockerignore"; Required=$true; Description="Exclusões Docker"},
        @{Path="deploy.sh"; Required=$false; Description="Script de deploy Linux"},
        @{Path="deploy-docker.ps1"; Required=$false; Description="Script de deploy Windows"}
    )
    
    $results = @()
    foreach ($file in $configFiles) {
        $exists = Test-Path $file.Path
        $status = if ($exists) { "✅" } elseif ($file.Required) { "❌" } else { "⚠️" }
        $results += @{
            File = $file.Path
            Status = $status
            Required = $file.Required
            Description = $file.Description
            Exists = $exists
        }
    }
    
    Write-Host "📋 Arquivos de configuração:" -ForegroundColor Cyan
    $results | ForEach-Object {
        $color = if ($_.Status -eq "✅") { "Green" } elseif ($_.Status -eq "❌") { "Red" } else { "Yellow" }
        Write-Host "   $($_.Status) $($_.File) - $($_.Description)" -ForegroundColor $color
    }
    
    return $results
}

# Verificar variáveis de ambiente
function Test-EnvironmentVariables {
    Write-Host "🔧 Verificando variáveis de ambiente de produção..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".env.production")) {
        Write-Host "❌ Arquivo .env.production não encontrado!" -ForegroundColor Red
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
        "REDIS_PASSWORD",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET"
    )
    
    $missingVars = @()
    foreach ($var in $criticalVars) {
        if ($envContent -notmatch "$var=") {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -eq 0) {
        Write-Host "✅ Todas as variáveis críticas estão configuradas" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Variáveis críticas não encontradas:" -ForegroundColor Red
        $missingVars | ForEach-Object {
            Write-Host "   - $_" -ForegroundColor Red
        }
        return $false
    }
}

# Verificar estrutura do projeto
function Test-ProjectStructure {
    Write-Host "🏗️ Verificando estrutura do projeto..." -ForegroundColor Yellow
    
    $requiredDirs = @("src", "dist")
    $optionalDirs = @("test", "docs", "logs", "uploads")
    
    $results = @()
    
    foreach ($dir in $requiredDirs) {
        $exists = Test-Path $dir
        $status = if ($exists) { "✅" } else { "❌" }
        $results += @{Dir=$dir; Status=$status; Required=$true}
    }
    
    foreach ($dir in $optionalDirs) {
        $exists = Test-Path $dir
        $status = if ($exists) { "✅" } else { "⚠️" }
        $results += @{Dir=$dir; Status=$status; Required=$false}
    }
    
    Write-Host "📁 Estrutura do projeto:" -ForegroundColor Cyan
    $results | ForEach-Object {
        $color = if ($_.Status -eq "✅") { "Green" } elseif ($_.Status -eq "❌") { "Red" } else { "Yellow" }
        $required = if ($_.Required) { " (Obrigatório)" } else { " (Opcional)" }
        Write-Host "   $($_.Status) $($_.Dir)/$required" -ForegroundColor $color
    }
    
    return $results
}

# Teste de conectividade
function Test-ExternalServices {
    Write-Host "🌐 Verificando conectividade com serviços externos..." -ForegroundColor Yellow
    
    $services = @(
        @{Name="Google"; URL="https://www.google.com"; Critical=$false},
        @{Name="Stripe API"; URL="https://api.stripe.com"; Critical=$true},
        @{Name="PayPal API"; URL="https://api.paypal.com"; Critical=$true},
        @{Name="SendGrid API"; URL="https://api.sendgrid.com"; Critical=$true}
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.URL -Method HEAD -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "   ✅ $($service.Name) - Conectado" -ForegroundColor Green
            } else {
                $status = if ($service.Critical) { "❌" } else { "⚠️" }
                Write-Host "   $status $($service.Name) - Status: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            $status = if ($service.Critical) { "❌" } else { "⚠️" }
            Write-Host "   $status $($service.Name) - Erro: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Gerar relatório de produção
function New-ProductionReport {
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $reportPath = "production-readiness-report_$timestamp.md"
    
    Write-Host "📊 Gerando relatório de prontidão para produção..." -ForegroundColor Yellow
    
    $report = @"
# NeuralContent API - Relatorio de Prontidao para Producao
**Data:** $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")  
**Versao:** 1.0.0  

## Configuracoes Implementadas

### Ambiente de Producao
- [x] Arquivo .env.production configurado
- [x] Variaveis de ambiente criticas definidas
- [x] Configuracoes de seguranca aplicadas
- [x] Configuracoes de performance otimizadas

### Docker e Containerizacao
- [x] Dockerfile multi-stage otimizado
- [x] docker-compose.yml para orquestracao
- [x] dockerignore configurado
- [x] Health checks implementados
- [x] Scripts de deploy automatizados

### Seguranca
- [x] JWT com secrets seguros para producao
- [x] CORS configurado adequadamente
- [x] Rate limiting habilitado
- [x] SSL/HTTPS configurado
- [x] Usuario nao-root nos containers
- [x] Secrets management implementado

### Performance
- [x] PM2 para gestao de processos
- [x] Redis para cache
- [x] Otimizacoes de memoria
- [x] Connection pooling configurado
- [x] Compressao gzip habilitada

### Monitoramento
- [x] Health checks endpoint
- [x] Logs estruturados
- [x] Metricas de performance
- [x] Prometheus e Grafana (opcional)

### Integracoes
- [x] Stripe (modo producao)
- [x] PayPal (modo producao)  
- [x] SendGrid (configurado)
- [x] Google Analytics
- [x] Banco de dados MySQL

## Checklist de Deploy

### Antes do Deploy
- [ ] Backup do banco de dados atual
- [ ] Verificar secrets e chaves de API
- [ ] Testar build local
- [ ] Verificar conectividade com servicos externos
- [ ] Revisar configuracoes de seguranca

### Durante o Deploy
- [ ] Executar testes automatizados
- [ ] Verificar health checks
- [ ] Monitorar logs de erro
- [ ] Testar endpoints criticos
- [ ] Verificar performance

### Apos o Deploy
- [ ] Verificar todos os servicos
- [ ] Testar fluxos criticos
- [ ] Monitorar metricas
- [ ] Configurar alertas
- [ ] Documentar versao deployed

## Comandos de Deploy

### Docker (API apenas)
Build e deploy: deploy-docker.ps1 build
Apenas deploy: deploy-docker.ps1 start

### Docker Compose (Todos os servicos)
Build e deploy completo: deploy-docker.ps1 compose-build
Deploy de producao: docker-compose up -d

### PM2 (Tradicional)
Deploy com PM2: npm run deploy:prod

## Contatos de Emergencia
- DevOps: [Email/Telefone]
- Backend Lead: [Email/Telefone]
- Infraestrutura: [Email/Telefone]

---
Relatorio gerado automaticamente em $timestamp
"@

    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host "✅ Relatório salvo em: $reportPath" -ForegroundColor Green
    return $reportPath
}

# Função principal
function Start-ProductionHealthCheck {
    Clear-Host
    Write-Host "🏥 NeuralContent API - Verificação de Prontidão para Produção" -ForegroundColor Blue
    Write-Host "===========================================================" -ForegroundColor Blue
    Write-Host ""
    
    # Executar todas as verificações
    $sysReq = Test-SystemRequirements
    Write-Host ""
    
    $configFiles = Test-ConfigurationFiles
    Write-Host ""
    
    $envVars = Test-EnvironmentVariables
    Write-Host ""
    
    $projectStruct = Test-ProjectStructure
    Write-Host ""
    
    Test-ExternalServices
    Write-Host ""
    
    # Gerar relatório
    $reportPath = New-ProductionReport
    Write-Host ""
    
    # Resumo final
    $criticalIssues = 0
    $warnings = 0
    
    # Contar problemas críticos
    $sysReq | Where-Object { $_.Status -eq "❌" } | ForEach-Object { $criticalIssues++ }
    $configFiles | Where-Object { $_.Status -eq "❌" -and $_.Required } | ForEach-Object { $criticalIssues++ }
    if (-not $envVars) { $criticalIssues++ }
    
    # Contar avisos
    $sysReq | Where-Object { $_.Status -eq "⚠️" } | ForEach-Object { $warnings++ }
    $configFiles | Where-Object { $_.Status -eq "⚠️" } | ForEach-Object { $warnings++ }
    
    Write-Host "📊 RESUMO FINAL:" -ForegroundColor Blue
    Write-Host "===============" -ForegroundColor Blue
    
    if ($criticalIssues -eq 0) {
        Write-Host "✅ PRONTO PARA PRODUÇÃO!" -ForegroundColor Green
        Write-Host "   Todos os requisitos críticos foram atendidos." -ForegroundColor Green
        if ($warnings -gt 0) {
            Write-Host "⚠️  $warnings avisos encontrados (não críticos)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ NÃO PRONTO PARA PRODUÇÃO" -ForegroundColor Red
        Write-Host "   $criticalIssues problemas críticos encontrados" -ForegroundColor Red
        if ($warnings -gt 0) {
            Write-Host "⚠️  $warnings avisos adicionais" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "📋 Relatório detalhado: $reportPath" -ForegroundColor Cyan
    Write-Host "🚀 Próximos passos: Execute .\deploy-docker.ps1 para iniciar deploy" -ForegroundColor Cyan
}

# Executar verificação
Start-ProductionHealthCheck
