#!/usr/bin/env ts-node

/**
 * Script para gerar documentação OpenAPI/Swagger da API NeuralContent
 * 
 * Este script:
 * 1. Inicializa a aplicação NestJS
 * 2. Gera o documento OpenAPI
 * 3. Salva o arquivo JSON
 * 4. Exibe estatísticas da documentação
 * 
 * Usage: npm run docs:generate
 */

import { NestFactory } from '@nestjs/core';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { getOpenApiDocument } from '../src/config/swagger.config';

interface ApiStats {
  totalPaths: number;
  totalOperations: number;
  totalSchemas: number;
  operationsByMethod: Record<string, number>;
  operationsByTag: Record<string, number>;
}

async function generateOpenApiDocs() {
  console.log('🚀 Iniciando geração da documentação OpenAPI...\n');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: false, // Disable logging for script
    });

    // Generate OpenAPI document
    const document = getOpenApiDocument(app);

    // Ensure docs directory exists
    const docsDir = join(process.cwd(), 'docs');
    if (!existsSync(docsDir)) {
      mkdirSync(docsDir, { recursive: true });
    }

    // Write OpenAPI JSON
    const openApiPath = join(docsDir, 'openapi.json');
    writeFileSync(openApiPath, JSON.stringify(document, null, 2), 'utf8');

    // Generate YAML version
    const yamlContent = generateYamlFromJson(document);
    const yamlPath = join(docsDir, 'openapi.yaml');
    writeFileSync(yamlPath, yamlContent, 'utf8');

    // Generate API statistics
    const stats = generateApiStats(document);

    // Generate README
    const readmePath = join(docsDir, 'README.md');
    const readmeContent = generateApiReadme(stats);
    writeFileSync(readmePath, readmeContent, 'utf8');

    // Display results
    console.log('✅ Documentação gerada com sucesso!\n');
    console.log('📋 Arquivos gerados:');
    console.log(`   📄 ${openApiPath}`);
    console.log(`   📄 ${yamlPath}`);
    console.log(`   📄 ${readmePath}\n`);

    console.log('📊 Estatísticas da API:');
    console.log(`   🎯 Total de endpoints: ${stats.totalOperations}`);
    console.log(`   📍 Total de paths: ${stats.totalPaths}`);
    console.log(`   📦 Total de schemas: ${stats.totalSchemas}`);
    console.log(`   🏷️  Tags: ${Object.keys(stats.operationsByTag).join(', ')}\n`);

    console.log('🔗 Links úteis:');
    console.log('   📚 Swagger UI: http://localhost:3001/api/docs');
    console.log('   📄 OpenAPI JSON: http://localhost:3001/api/docs-json');
    console.log(`   📂 Documentação local: ${docsDir}\n`);

    await app.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao gerar documentação:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function generateApiStats(document: any): ApiStats {
  const stats: ApiStats = {
    totalPaths: 0,
    totalOperations: 0,
    totalSchemas: 0,
    operationsByMethod: {},
    operationsByTag: {}
  };

  if (document.paths) {
    stats.totalPaths = Object.keys(document.paths).length;

    Object.values(document.paths).forEach((path: any) => {
      Object.entries(path).forEach(([method, operation]: [string, any]) => {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          stats.totalOperations++;
          
          // Count by method
          stats.operationsByMethod[method.toUpperCase()] = 
            (stats.operationsByMethod[method.toUpperCase()] || 0) + 1;

          // Count by tag
          if (operation.tags && operation.tags.length > 0) {
            operation.tags.forEach((tag: string) => {
              stats.operationsByTag[tag] = (stats.operationsByTag[tag] || 0) + 1;
            });
          }
        }
      });
    });
  }

  if (document.components && document.components.schemas) {
    stats.totalSchemas = Object.keys(document.components.schemas).length;
  }

  return stats;
}

function generateYamlFromJson(document: any): string {
  // Simple JSON to YAML conversion for basic structure
  const yaml = `openapi: ${document.openapi}
info:
  title: "${document.info.title}"
  description: |
    ${document.info.description}
  version: "${document.info.version}"
  contact:
    name: "${document.info.contact?.name || 'API Support'}"
    url: "${document.info.contact?.url || ''}"
    email: "${document.info.contact?.email || ''}"
  license:
    name: "${document.info.license?.name || 'MIT'}"
    url: "${document.info.license?.url || ''}"

servers:
${document.servers?.map((server: any) => `  - url: ${server.url}\n    description: ${server.description}`).join('\n') || '  - url: http://localhost:3001/v1\n    description: Development'}

# Para o spec completo em YAML, use ferramentas como swagger-codegen
# Este é um resumo básico para referência rápida
`;

  return yaml;
}

function generateApiReadme(stats: ApiStats): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `# 🧠 NeuralContent API Documentation

> Documentação gerada automaticamente em ${currentDate}

## 📊 Estatísticas da API

- **Total de Endpoints:** ${stats.totalOperations}
- **Total de Paths:** ${stats.totalPaths}
- **Total de Schemas:** ${stats.totalSchemas}

### Endpoints por Método HTTP

${Object.entries(stats.operationsByMethod)
  .map(([method, count]) => `- **${method}:** ${count} endpoints`)
  .join('\n')}

### Endpoints por Categoria

${Object.entries(stats.operationsByTag)
  .map(([tag, count]) => `- **${tag}:** ${count} endpoints`)
  .join('\n')}

## 🚀 Como usar

### 1. Swagger UI (Recomendado)
\`\`\`
http://localhost:3001/api/docs
\`\`\`

### 2. OpenAPI JSON
\`\`\`
http://localhost:3001/api/docs-json
\`\`\`

### 3. Arquivos Locais
- \`openapi.json\` - Especificação completa em JSON
- \`openapi.yaml\` - Resumo em YAML
- \`README.md\` - Este arquivo

## 🔧 Comandos Úteis

\`\`\`bash
# Gerar documentação
npm run docs:generate

# Exportar OpenAPI JSON
npm run docs:export

# Visualizar no navegador
npm run docs:serve
\`\`\`

## 📚 Estrutura da API

A API está organizada nas seguintes categorias:

1. **🔐 Autenticação** - Login, registro e gestão de tokens
2. **👥 Usuários** - Gestão de usuários e perfis
3. **📋 Planos** - Gestão de planos e recursos
4. **💰 Pagamentos** - Processamento de pagamentos
5. **🔵 Créditos** - Sistema de créditos e transações
6. **⚙️ Administração** - Endpoints administrativos
7. **🏥 Monitoramento** - Health checks e métricas

## 🛡️ Autenticação

Todos os endpoints protegidos requerem autenticação via JWT:

\`\`\`
Authorization: Bearer {seu_jwt_token}
\`\`\`

## 📖 Recursos Adicionais

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [JWT Authentication](https://jwt.io/)

---

*Documentação gerada automaticamente pelo script \`generate-openapi.ts\`*
`;
}

// Execute the script
if (require.main === module) {
  generateOpenApiDocs();
}
