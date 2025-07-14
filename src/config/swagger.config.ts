import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

/**
 * Configuração do Swagger/OpenAPI 3.0 para documentação da API
 * 
 * @description Configuração profissional do Swagger seguindo padrões OpenAPI 3.0
 * @author NeuralContent Team
 * @since 1.0.0
 * 
 * @features
 * - Documentação completa da API
 * - Autenticação JWT nos endpoints
 * - Schemas automáticos dos DTOs
 * - Exemplos de request/response
 * - Versionamento da API
 * - Tags organizadas por módulos
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('🧠 NeuralContent API')
    .setDescription(`
## 🎯 API NeuralContent - Documentação Completa

**Backend NestJS** para plataforma de geração de conteúdo com IA

### 🚀 Funcionalidades Principais:

#### 🔐 **Autenticação & Autorização**
- Sistema JWT com refresh tokens
- Controle de acesso baseado em roles (RBAC)
- Verificação de email e recuperação de senha
- Sessões de usuário com rastreamento

#### 👥 **Gestão de Usuários**
- CRUD completo de usuários
- Perfis personalizáveis
- Sistema de permissões granular
- Auditoria de ações

#### 💳 **Sistema de Pagamentos**
- Integração com Stripe e PayPal
- Processamento de webhooks
- Gestão de assinaturas
- Histórico de transações

#### 📋 **Planos e Funcionalidades**
- Planos flexíveis (Básico, Premium, Enterprise)
- Features modulares por plano
- Upgrades e downgrades automáticos
- Controle de limites de uso

#### 🪙 **Sistema de Créditos**
- Créditos por uso/consumo
- Transações detalhadas
- Recarga automática
- Relatórios de consumo

#### 🔧 **Painel Administrativo**
- Dashboard com métricas em tempo real
- Gestão de usuários e permissões
- Relatórios avançados
- Logs e auditoria do sistema

### 🔧 **Tecnologias Utilizadas:**
- **Framework:** NestJS 11+ com TypeScript
- **Database:** MySQL 8.0 com TypeORM
- **Cache:** Redis
- **Documentação:** Swagger/OpenAPI 3.0
- **Deploy:** PM2 Cluster Mode
- **Testing:** Jest + Supertest

### 🌍 **Ambientes:**
- **Desenvolvimento:** http://localhost:3001
- **Produção:** https://api.neuralbook.app

### 📚 **Padrões da API:**
- **REST:** Endpoints padronizados
- **HTTP Status:** Códigos semânticos
- **Validation:** class-validator automático
- **Error Handling:** Respostas estruturadas
- **Rate Limiting:** Proteção contra spam
- **Security:** Headers de segurança + CORS

### 📊 **Monitoramento:**
- Health checks em /health
- Métricas de performance
- Logs estruturados
- Error tracking

### 🔐 **Autenticação:**
Para acessar endpoints protegidos, use o header:
\`\`\`
Authorization: Bearer <JWT_TOKEN>
\`\`\`

Obtenha o token através do endpoint \`POST /auth/login\`
    `)
    .setVersion('1.0.0')
    .setContact(
      'NeuralContent Team',
      'https://neuralbook.app',
      'contato@neuralbook.app'
    )
    .setLicense(
      'MIT License',
      'https://opensource.org/licenses/MIT'
    )
    .addServer('http://localhost:3001', 'Desenvolvimento')
    .addServer('https://api.neuralbook.app', 'Produção')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT para autenticação. Obtenha através do endpoint POST /auth/login',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API Key para acesso sem autenticação JWT (apenas para integrações)',
      },
      'API-Key'
    )
    .addTag('🔐 Auth', 'Endpoints de autenticação e autorização')
    .addTag('👥 Users', 'Gestão de usuários e perfis')
    .addTag('📋 Plans', 'Planos e funcionalidades disponíveis')
    .addTag('💳 Payments', 'Processamento de pagamentos e assinaturas')
    .addTag('🪙 Credits', 'Sistema de créditos por uso')
    .addTag('🔧 Admin', 'Painel administrativo (apenas admins)')
    .addTag('📊 Health', 'Health checks e status do sistema')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Customizações adicionais do documento
  (document.info as any)['x-logo'] = {
    url: 'https://neuralbook.app/logo.png',
    altText: 'NeuralContent Logo'
  };

  // Adicionar exemplos globais de responses de erro
  if (!document.components) {
    document.components = {};
  }
  document.components.responses = {
    BadRequest: {
      description: 'Dados de entrada inválidos',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              statusCode: { type: 'number', example: 400 },
              message: { 
                oneOf: [
                  { type: 'string', example: 'Dados inválidos' },
                  { 
                    type: 'array',
                    items: { type: 'string' },
                    example: ['email deve ser um email válido', 'password é obrigatório']
                  }
                ]
              },
              error: { type: 'string', example: 'Bad Request' },
              timestamp: { type: 'string', format: 'date-time' },
              path: { type: 'string', example: '/api/v1/auth/login' }
            }
          }
        }
      }
    },
    Unauthorized: {
      description: 'Não autorizado - Token inválido ou expirado',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              statusCode: { type: 'number', example: 401 },
              message: { type: 'string', example: 'Token inválido ou expirado' },
              error: { type: 'string', example: 'Unauthorized' },
              timestamp: { type: 'string', format: 'date-time' },
              path: { type: 'string', example: '/api/v1/users/profile' }
            }
          }
        }
      }
    },
    Forbidden: {
      description: 'Acesso negado - Permissões insuficientes',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              statusCode: { type: 'number', example: 403 },
              message: { type: 'string', example: 'Acesso negado - Permissões insuficientes' },
              error: { type: 'string', example: 'Forbidden' },
              timestamp: { type: 'string', format: 'date-time' },
              path: { type: 'string', example: '/api/v1/admin/users' }
            }
          }
        }
      }
    },
    NotFound: {
      description: 'Recurso não encontrado',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              statusCode: { type: 'number', example: 404 },
              message: { type: 'string', example: 'Usuário não encontrado' },
              error: { type: 'string', example: 'Not Found' },
              timestamp: { type: 'string', format: 'date-time' },
              path: { type: 'string', example: '/api/v1/users/123' }
            }
          }
        }
      }
    },
    InternalServerError: {
      description: 'Erro interno do servidor',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              statusCode: { type: 'number', example: 500 },
              message: { type: 'string', example: 'Erro interno do servidor' },
              error: { type: 'string', example: 'Internal Server Error' },
              timestamp: { type: 'string', format: 'date-time' },
              path: { type: 'string', example: '/api/v1/users' }
            }
          }
        }
      }
    }
  };

  // Configurar o Swagger UI com customizações
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Manter autorização entre reloads
      tagsSorter: 'alpha', // Ordenar tags alfabeticamente
      operationsSorter: 'alpha', // Ordenar operações alfabeticamente
      docExpansion: 'none', // Não expandir por padrão
      filter: true, // Habilitar filtro de busca
      showRequestDuration: true, // Mostrar tempo de resposta
      tryItOutEnabled: true, // Habilitar "Try it out"
      displayRequestDuration: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
    },
    customSiteTitle: 'NeuralContent API Documentation',
    customfavIcon: 'https://neuralbook.app/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #1f2937; }
      .swagger-ui .info .description { color: #4b5563; }
      .swagger-ui .opblock.opblock-post { border-color: #10b981; }
      .swagger-ui .opblock.opblock-get { border-color: #3b82f6; }
      .swagger-ui .opblock.opblock-put { border-color: #f59e0b; }
      .swagger-ui .opblock.opblock-delete { border-color: #ef4444; }
      .swagger-ui .info .description p { margin: 0.5rem 0; }
      .swagger-ui .info .description h3 { color: #1f2937; margin: 1rem 0 0.5rem 0; }
      .swagger-ui .info .description h4 { color: #374151; margin: 0.75rem 0 0.25rem 0; }
      .swagger-ui .info .description ul { margin: 0.25rem 0; }
      .swagger-ui .info .description code { 
        background: #f3f4f6; 
        padding: 0.125rem 0.25rem; 
        border-radius: 0.25rem;
        font-size: 0.875rem;
      }
    `,
  });

  // Rota para download do OpenAPI JSON
  SwaggerModule.setup('api/docs/json', app, document);
}

/**
 * Configuração do Swagger para desenvolvimento
 */
export function setupSwaggerDev(app: INestApplication): void {
  console.log('🔗 Swagger Documentation available at:');
  console.log('📚 Interactive Docs: http://localhost:3001/api/docs');
  console.log('📄 OpenAPI JSON: http://localhost:3001/api/docs/json');
  console.log('📋 OpenAPI YAML: http://localhost:3001/api/docs-yaml');
}
