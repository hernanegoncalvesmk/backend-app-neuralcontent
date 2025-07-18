# ==============================================
# NEURALCONTENT API - PRODUCTION DOCKERFILE
# ==============================================
# Multi-stage build para otimizar tamanho e segurança
# Enhanced for PASSO 3.3 - Production Ready Deployment
# Baseado em Node.js 20 LTS Alpine para menor footprint

# ==============================================
# STAGE 1: Build Stage
# ==============================================
FROM node:20-alpine AS builder

# Metadata da imagem
LABEL maintainer="NeuralContent Team"
LABEL version="1.0.0"
LABEL description="NeuralContent API Production Build"
LABEL stage="builder"

# Instalar dependências do sistema necessárias para build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && ln -sf python3 /usr/bin/python

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache layer)
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar todas as dependências para build
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY src/ ./src/
COPY test/ ./test/
COPY scripts/ ./scripts/

# Build da aplicação otimizado para produção
ENV NODE_ENV=production
RUN npm run build:prod

# Instalar apenas dependências de produção em pasta separada
RUN npm ci --only=production --prefix ./prod_modules

# ==============================================
# STAGE 2: Production Stage
# ==============================================
FROM node:20-alpine AS production

# Instalar dependências de runtime necessárias
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas as dependências de produção do stage anterior
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Copiar arquivos de configuração
COPY --chown=nestjs:nodejs .env.production ./.env.production
COPY --chown=nestjs:nodejs ecosystem.config.js ./ecosystem.config.js

# Criar diretórios necessários
RUN mkdir -p logs uploads tmp && \
    chown -R nestjs:nodejs logs uploads tmp

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NODE_OPTIONS="--max-old-space-size=512"

# Expor porta da aplicação
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/v1/health || exit 1

# Mudar para usuário não-root
USER nestjs

# Usar dumb-init para handle signals corretamente
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"]

# ==============================================
# METADATA E LABELS
# ==============================================
LABEL org.opencontainers.image.title="NeuralContent API"
LABEL org.opencontainers.image.description="Backend API for NeuralContent application"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="NeuralContent Team"
LABEL org.opencontainers.image.source="https://github.com/hernanegoncalvesmk/backend-app-neuralcontent"
LABEL org.opencontainers.image.documentation="https://api.neuralbook.app/api"
LABEL org.opencontainers.image.created="2025-07-14"
