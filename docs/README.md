# 🧠 NeuralContent API Documentation

> Documentação gerada automaticamente em 2025-07-17

## 📊 Estatísticas da API

- **Total de Endpoints:** 78
- **Total de Paths:** 66
- **Total de Schemas:** 40

### Endpoints por Método HTTP

- **GET:** 36 endpoints
- **POST:** 27 endpoints
- **PATCH:** 10 endpoints
- **DELETE:** 4 endpoints
- **PUT:** 1 endpoints

### Endpoints por Categoria

- **🏥 Monitoramento:** 8 endpoints
- **🔐 Autenticação:** 7 endpoints
- **👥 Usuários:** 16 endpoints
- **📋 Planos:** 14 endpoints
- **💰 Pagamentos:** 14 endpoints
- **🔵 Créditos:** 11 endpoints
- **⚙️ Administração:** 8 endpoints

## 🚀 Como usar

### 1. Swagger UI (Recomendado)
```
http://localhost:3001/api/docs
```

### 2. OpenAPI JSON
```
http://localhost:3001/api/docs-json
```

### 3. Arquivos Locais
- `openapi.json` - Especificação completa em JSON
- `openapi.yaml` - Resumo em YAML
- `README.md` - Este arquivo

## 🔧 Comandos Úteis

```bash
# Gerar documentação
npm run docs:generate

# Exportar OpenAPI JSON
npm run docs:export

# Visualizar no navegador
npm run docs:serve
```

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

```
Authorization: Bearer {seu_jwt_token}
```

## 📖 Recursos Adicionais

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [JWT Authentication](https://jwt.io/)

---

*Documentação gerada automaticamente pelo script `generate-openapi.ts`*
