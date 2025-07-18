import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('🧠 NeuralContent API')
    .setDescription(`
## API completa para plataforma de geração de conteúdo com IA

### 🔐 Autenticação
Esta API utiliza **JWT Bearer tokens**. Para autenticar suas requisições:
\`\`\`
Authorization: Bearer {seu_jwt_token}
\`\`\`

### 📊 Rate Limiting
- **Usuários Free:** 100 req/min
- **Usuários Pro:** 500 req/min  
- **Usuários Enterprise:** 1000 req/min
- **Administradores:** Sem limite

### 🔄 Versionamento
- **Versão Atual:** v1.0.0
- **URL Base:** \`/v1\`
- **Suporte:** Versionamento semântico (SemVer)

### 📈 Funcionalidades Principais
- **Autenticação e Autorização** (JWT + Roles)
- **Gestão de Usuários** (CRUD + Perfis)
- **Sistema de Planos** (Free, Pro, Enterprise)
- **Gestão de Créditos** (Compra, Consumo, Histórico)
- **Processamento de Pagamentos** (Stripe Integration)
- **Monitoramento e Logs** (Health Checks + Analytics)

### 🛡️ Segurança
- Criptografia de senhas (bcrypt)
- Validação de entrada (class-validator)
- Proteção CORS configurável
- Headers de segurança (Helmet)
- Rate limiting por usuário
    `)
    .setVersion('1.0.0')
    .setContact(
      'NeuralContent Support',
      'https://neuralcontent.com/support',
      'api-support@neuralcontent.com'
    )
    .setLicense(
      'MIT License',
      'https://opensource.org/licenses/MIT'
    )
    .setTermsOfService('https://neuralcontent.com/terms')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT token obtido via /auth/login. Formato: Bearer {token}',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key para integração de sistemas externos'
      },
      'ApiKey-auth'
    )
    .addServer('http://localhost:3001/v1', 'Desenvolvimento Local')
    .addServer('https://staging-api.neuralcontent.com/v1', 'Staging')
    .addServer('https://api.neuralcontent.com/v1', 'Produção')
    .addTag('🔐 Autenticação', 'Endpoints de login, registro e gestão de tokens')
    .addTag('👥 Usuários', 'Gestão de usuários, perfis e permissões')
    .addTag('📋 Planos', 'Gestão de planos e recursos disponíveis')
    .addTag('💰 Pagamentos', 'Processamento de pagamentos e assinaturas')
    .addTag('🔵 Créditos', 'Sistema de créditos e transações')
    .addTag('⚙️ Administração', 'Endpoints administrativos')
    .addTag('🏥 Monitoramento', 'Health checks e status do sistema')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      return `${controllerKey}_${methodKey}`;
    },
    ignoreGlobalPrefix: false,
    include: [], // Include all modules
  });

  // Generate OpenAPI JSON file
  const openApiPath = join(process.cwd(), 'docs', 'openapi.json');
  try {
    writeFileSync(openApiPath, JSON.stringify(document, null, 2), 'utf8');
    console.log(`📋 OpenAPI specification generated: ${openApiPath}`);
  } catch (error) {
    console.warn(`⚠️  Could not write OpenAPI file: ${error.message}`);
  }

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      deepLinking: true,
      displayOperationId: false,
      showExtensions: true,
      showCommonExtensions: true,
      validatorUrl: null,
      presets: [
        'SwaggerUIBundle.presets.apis',
        'SwaggerUIBundle.presets.standalone'
      ],
      plugins: [
        'SwaggerUIBundle.plugins.DownloadUrl'
      ],
    },
    customSiteTitle: '🧠 NeuralContent API Documentation',
    customfavIcon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧠</text></svg>',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { background: #fafafa; padding: 10px; border-radius: 4px; margin: 20px 0; }
      .swagger-ui .btn.authorize { background-color: #4CAF50; border-color: #4CAF50; }
      .swagger-ui .btn.authorize:hover { background-color: #45a049; }
      .swagger-ui .opblock.opblock-post { border-color: #49cc90; background: rgba(73, 204, 144, 0.1); }
      .swagger-ui .opblock.opblock-get { border-color: #61affe; background: rgba(97, 175, 254, 0.1); }
      .swagger-ui .opblock.opblock-put { border-color: #fca130; background: rgba(252, 161, 48, 0.1); }
      .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; background: rgba(249, 62, 62, 0.1); }
      .swagger-ui .opblock.opblock-patch { border-color: #50e3c2; background: rgba(80, 227, 194, 0.1); }
      .swagger-ui .model-box { background: #f7f7f7; }
      .swagger-ui .model .property { padding: 5px 0; }
    `,
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js'
    ]
  });

  // Also setup a simple JSON endpoint for the OpenAPI spec
  app.getHttpAdapter().get('/api/docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  console.log(`📖 Swagger documentation available at: http://localhost:3001/api/docs`);
  console.log(`📄 OpenAPI JSON available at: http://localhost:3001/api/docs-json`);
}

/**
 * Export OpenAPI document for external tools
 */
export function getOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('🧠 NeuralContent API')
    .setVersion('1.0.0')
    .build();
    
  return SwaggerModule.createDocument(app, config);
}
