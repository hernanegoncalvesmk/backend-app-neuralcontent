# 🐳 NeuralContent API - Configuração de Produção

## 📋 Visão Geral

Este documento detalha a implementação completa da **FASE 12.2: Configuração de Produção** do NeuralContent API, incluindo containerização Docker, orquestração de serviços e scripts de deploy automatizados.

## 🏗️ Arquivos Implementados

### 1. Configuração de Ambiente
- **`.env.production`** - Variáveis de ambiente para produção com 100+ configurações
- **`ecosystem.config.js`** - Configuração PM2 (já existente, otimizado)

### 2. Docker e Containerização
- **`Dockerfile`** - Build multi-stage otimizado para produção
- **`docker-compose.yml`** - Orquestração completa (API + MySQL + Redis + Nginx)
- **`.dockerignore`** - Otimização do contexto de build

### 3. Scripts de Deploy
- **`deploy-docker.ps1`** - Script PowerShell para deploy automatizado
- **`check-production.ps1`** - Verificação de prontidão para produção

## 🚀 Como Usar

### Pré-requisitos
```powershell
# Instalar Docker Desktop
# Download: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

# Verificar instalação
docker --version
docker-compose --version
```

### Deploy da API (Docker)
```powershell
# Executar script interativo
.\deploy-docker.ps1

# Ou comandos diretos:
.\deploy-docker.ps1 build    # Build e deploy
.\deploy-docker.ps1 start    # Apenas deploy
.\deploy-docker.ps1 stop     # Parar container
.\deploy-docker.ps1 logs     # Ver logs
```

### Deploy Completo (Docker Compose)
```powershell
# Script interativo
.\deploy-docker.ps1

# Ou comandos diretos:
.\deploy-docker.ps1 compose-build  # Build e deploy completo
.\deploy-docker.ps1 compose-start  # Deploy serviços
.\deploy-docker.ps1 compose-stop   # Parar todos
.\deploy-docker.ps1 compose-logs   # Ver logs
```

### Verificação de Produção
```powershell
# Executar verificação completa
.\check-production.ps1
```

## 🌐 Serviços Disponíveis

### Após deploy com Docker Compose:
- **API NeuralContent:** `http://localhost:3001`
- **Documentação Swagger:** `http://localhost:3001/api`
- **Health Check:** `http://localhost:3001/v1/health`
- **Nginx Load Balancer:** `http://localhost:80`
- **MySQL Database:** `localhost:3306`
- **Redis Cache:** `localhost:6379`
- **Grafana (Opcional):** `http://localhost:3000`
- **Prometheus (Opcional):** `http://localhost:9090`

## 🔧 Configurações de Produção

### Variáveis de Ambiente Críticas
```bash
NODE_ENV=production
PORT=3001
DB_HOST=mysql
DB_PORT=3306
DB_NAME=neuralcontent_prod
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=[PRODUCTION_SECRET]
```

### Segurança Implementada
- ✅ Usuário não-root nos containers
- ✅ Secrets seguros para JWT
- ✅ CORS configurado adequadamente
- ✅ Rate limiting habilitado
- ✅ SSL/HTTPS suporte
- ✅ Sanitização de dados
- ✅ Validação rigorosa

### Performance Otimizada
- ✅ Build multi-stage Docker
- ✅ Cache Redis configurado
- ✅ Connection pooling MySQL
- ✅ Compressão gzip
- ✅ PM2 cluster mode
- ✅ Memory optimization

## 📊 Monitoramento

### Health Checks
```bash
# API Health
curl http://localhost:3001/v1/health

# Container Health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Services Status
docker-compose ps
```

### Logs
```bash
# API Logs
docker logs neuralcontent-api-container

# All Services Logs
docker-compose logs -f

# Specific Service
docker-compose logs -f api
```

## 🔄 Comandos Úteis

### Docker Individual
```powershell
# Build
docker build -t neuralcontent-api:latest .

# Run
docker run -d --name neuralcontent-api -p 3001:3001 --env-file .env.production neuralcontent-api:latest

# Stop
docker stop neuralcontent-api

# Remove
docker rm neuralcontent-api

# Logs
docker logs -f neuralcontent-api
```

### Docker Compose
```powershell
# Start all services
docker-compose up -d

# Start with build
docker-compose up --build -d

# Stop all
docker-compose down

# Remove volumes
docker-compose down -v

# Restart specific service
docker-compose restart api

# Scale API instances
docker-compose up -d --scale api=3
```

### Development
```powershell
# Install dependencies
npm install

# Build
npm run build

# Start development
npm run start:dev

# Start production (PM2)
npm run start:prod
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Docker não encontrado**
   ```powershell
   # Instalar Docker Desktop
   # Reiniciar PowerShell após instalação
   ```

2. **Erro de permissão**
   ```powershell
   # Executar PowerShell como Administrador
   Set-ExecutionPolicy RemoteSigned
   ```

3. **Container não inicia**
   ```powershell
   # Verificar logs
   docker logs neuralcontent-api-container
   
   # Verificar variáveis
   docker exec -it neuralcontent-api-container env
   ```

4. **Porta em uso**
   ```powershell
   # Verificar processos na porta
   netstat -ano | findstr :3001
   
   # Matar processo
   taskkill /PID [PID] /F
   ```

### Debug Mode
```powershell
# Run container in interactive mode
docker run -it --rm --env-file .env.production neuralcontent-api:latest sh

# Exec into running container
docker exec -it neuralcontent-api-container sh
```

## 📋 Checklist de Deploy

### Antes do Deploy
- [ ] Verificar Docker instalado
- [ ] Configurar variáveis de ambiente
- [ ] Testar build local
- [ ] Backup do banco (se aplicável)
- [ ] Verificar conectividade externa

### Durante o Deploy
- [ ] Executar `.\check-production.ps1`
- [ ] Build da imagem Docker
- [ ] Iniciar containers
- [ ] Verificar health checks
- [ ] Testar endpoints críticos

### Após o Deploy
- [ ] Monitorar logs
- [ ] Verificar métricas
- [ ] Testar integrações
- [ ] Configurar alertas
- [ ] Documentar versão

## 🔗 Links Úteis

- **API Documentation:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/v1/health
- **Docker Hub:** [Link para imagem]
- **Monitoring Dashboard:** http://localhost:3000 (Grafana)

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs: `docker logs neuralcontent-api-container`
2. Executar health check: `.\check-production.ps1`
3. Consultar documentação da API
4. Contactar equipe de DevOps

---

**FASE 12.2: Configuração de Produção** ✅ **COMPLETA**

Implementado por: GitHub Copilot  
Data: $(Get-Date -Format "dd/MM/yyyy")  
Versão: 1.0.0
