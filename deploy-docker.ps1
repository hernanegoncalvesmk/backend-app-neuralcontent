# ==============================================
# NEURALCONTENT API - DOCKER DEPLOYMENT SCRIPT
# ==============================================
# Script PowerShell para deploy com Docker

# Verificar se Docker está instalado
function Test-DockerInstalled {
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Docker não está instalado ou não está no PATH" -ForegroundColor Red
        Write-Host "📋 Instruções de instalação:" -ForegroundColor Yellow
        Write-Host "   1. Baixe Docker Desktop: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -ForegroundColor Cyan
        Write-Host "   2. Execute o instalador como administrador" -ForegroundColor Cyan
        Write-Host "   3. Reinicie o sistema" -ForegroundColor Cyan
        Write-Host "   4. Execute este script novamente" -ForegroundColor Cyan
        return $false
    }
}

# Função principal de deploy
function Start-DockerDeploy {
    param(
        [string]$Environment = "production",
        [switch]$Build = $false,
        [switch]$Logs = $false,
        [switch]$Stop = $false
    )

    Write-Host "🐳 NeuralContent API - Docker Deployment" -ForegroundColor Blue
    Write-Host "===========================================" -ForegroundColor Blue

    # Verificar Docker
    if (-not (Test-DockerInstalled)) {
        return
    }

    # Definir variáveis
    $imageName = "neuralcontent-api"
    $containerName = "neuralcontent-api-container"
    $port = "3001"

    try {
        if ($Stop) {
            Write-Host "🛑 Parando containers..." -ForegroundColor Yellow
            docker stop $containerName 2>$null
            docker rm $containerName 2>$null
            Write-Host "✅ Container parado e removido" -ForegroundColor Green
            return
        }

        if ($Build) {
            Write-Host "🔨 Construindo imagem Docker..." -ForegroundColor Yellow
            docker build -t ${imageName}:latest .
            if ($LASTEXITCODE -ne 0) {
                throw "Erro no build da imagem"
            }
            Write-Host "✅ Imagem construída com sucesso" -ForegroundColor Green
        }

        # Parar container existente
        docker stop $containerName 2>$null
        docker rm $containerName 2>$null

        Write-Host "🚀 Iniciando container..." -ForegroundColor Yellow
        docker run -d `
            --name $containerName `
            -p ${port}:${port} `
            --env-file .env.production `
            --restart unless-stopped `
            --health-cmd="curl -f http://localhost:${port}/v1/health || exit 1" `
            --health-interval=30s `
            --health-timeout=10s `
            --health-retries=3 `
            ${imageName}:latest

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Container iniciado com sucesso!" -ForegroundColor Green
            Write-Host "🌐 API disponível em: http://localhost:${port}" -ForegroundColor Cyan
            Write-Host "📋 Health check: http://localhost:${port}/v1/health" -ForegroundColor Cyan
            Write-Host "📖 Documentação: http://localhost:${port}/api" -ForegroundColor Cyan
        } else {
            throw "Erro ao iniciar container"
        }

        if ($Logs) {
            Write-Host "📋 Mostrando logs do container..." -ForegroundColor Yellow
            docker logs -f $containerName
        }

    } catch {
        Write-Host "❌ Erro no deployment: $_" -ForegroundColor Red
        Write-Host "💡 Comandos úteis:" -ForegroundColor Yellow
        Write-Host "   docker logs $containerName" -ForegroundColor Cyan
        Write-Host "   docker exec -it $containerName sh" -ForegroundColor Cyan
        Write-Host "   docker stop $containerName" -ForegroundColor Cyan
    }
}

# Função para Docker Compose
function Start-DockerCompose {
    param(
        [string]$Environment = "production",
        [switch]$Build = $false,
        [switch]$Down = $false,
        [switch]$Logs = $false
    )

    Write-Host "🐳 NeuralContent - Docker Compose Deployment" -ForegroundColor Blue
    Write-Host "=============================================" -ForegroundColor Blue

    if (-not (Test-DockerInstalled)) {
        return
    }

    try {
        if ($Down) {
            Write-Host "🛑 Parando todos os serviços..." -ForegroundColor Yellow
            docker-compose down --remove-orphans
            Write-Host "✅ Serviços parados" -ForegroundColor Green
            return
        }

        if ($Build) {
            Write-Host "🔨 Construindo e iniciando serviços..." -ForegroundColor Yellow
            docker-compose up --build -d
        } else {
            Write-Host "🚀 Iniciando serviços..." -ForegroundColor Yellow
            docker-compose up -d
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Todos os serviços iniciados!" -ForegroundColor Green
            Write-Host "🌐 Serviços disponíveis:" -ForegroundColor Cyan
            Write-Host "   - API: http://localhost:3001" -ForegroundColor Cyan
            Write-Host "   - Nginx: http://localhost:80" -ForegroundColor Cyan
            Write-Host "   - MySQL: localhost:3306" -ForegroundColor Cyan
            Write-Host "   - Redis: localhost:6379" -ForegroundColor Cyan
            Write-Host "   - Grafana: http://localhost:3000 (opcional)" -ForegroundColor Cyan
            Write-Host "   - Prometheus: http://localhost:9090 (opcional)" -ForegroundColor Cyan
        } else {
            throw "Erro ao iniciar serviços"
        }

        if ($Logs) {
            Write-Host "📋 Mostrando logs de todos os serviços..." -ForegroundColor Yellow
            docker-compose logs -f
        }

    } catch {
        Write-Host "❌ Erro no deployment: $_" -ForegroundColor Red
        Write-Host "💡 Comandos úteis:" -ForegroundColor Yellow
        Write-Host "   docker-compose logs" -ForegroundColor Cyan
        Write-Host "   docker-compose ps" -ForegroundColor Cyan
        Write-Host "   docker-compose down" -ForegroundColor Cyan
    }
}

# Menu interativo
function Show-DeployMenu {
    while ($true) {
        Clear-Host
        Write-Host "🐳 NeuralContent API - Menu de Deploy" -ForegroundColor Blue
        Write-Host "=====================================" -ForegroundColor Blue
        Write-Host "1. Build e Deploy Docker (API apenas)" -ForegroundColor White
        Write-Host "2. Deploy Docker (API apenas)" -ForegroundColor White
        Write-Host "3. Build e Deploy Docker Compose (Todos os serviços)" -ForegroundColor White
        Write-Host "4. Deploy Docker Compose (Todos os serviços)" -ForegroundColor White
        Write-Host "5. Parar Docker API" -ForegroundColor White
        Write-Host "6. Parar Docker Compose" -ForegroundColor White
        Write-Host "7. Ver logs Docker API" -ForegroundColor White
        Write-Host "8. Ver logs Docker Compose" -ForegroundColor White
        Write-Host "9. Status dos containers" -ForegroundColor White
        Write-Host "0. Sair" -ForegroundColor White
        Write-Host ""

        $choice = Read-Host "Escolha uma opção (0-9)"

        switch ($choice) {
            "1" { Start-DockerDeploy -Build }
            "2" { Start-DockerDeploy }
            "3" { Start-DockerCompose -Build }
            "4" { Start-DockerCompose }
            "5" { Start-DockerDeploy -Stop }
            "6" { Start-DockerCompose -Down }
            "7" { Start-DockerDeploy -Logs }
            "8" { Start-DockerCompose -Logs }
            "9" { 
                Write-Host "📊 Status dos containers:" -ForegroundColor Yellow
                docker ps -a
                Read-Host "Pressione Enter para continuar"
            }
            "0" { 
                Write-Host "👋 Saindo..." -ForegroundColor Green
                break 
            }
            default { 
                Write-Host "❌ Opção inválida!" -ForegroundColor Red
                Start-Sleep 2
            }
        }
    }
}

# Verificar se foi chamado com parâmetros ou mostrar menu
if ($args.Count -eq 0) {
    Show-DeployMenu
} else {
    # Executar baseado em parâmetros
    switch ($args[0]) {
        "build" { Start-DockerDeploy -Build }
        "start" { Start-DockerDeploy }
        "stop" { Start-DockerDeploy -Stop }
        "logs" { Start-DockerDeploy -Logs }
        "compose-build" { Start-DockerCompose -Build }
        "compose-start" { Start-DockerCompose }
        "compose-stop" { Start-DockerCompose -Down }
        "compose-logs" { Start-DockerCompose -Logs }
        default { Show-DeployMenu }
    }
}
