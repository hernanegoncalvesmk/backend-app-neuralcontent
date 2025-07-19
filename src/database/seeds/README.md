# Sistema de Seeds - NeuralContent

## 📋 Visão Geral

O sistema de seeds do NeuralContent é responsável por popular o banco de dados com dados iniciais essenciais para o funcionamento da aplicação. Ele segue uma arquitetura bem estruturada com separação de responsabilidades e execução ordenada.

## 🏗️ Arquitetura

```
src/database/seeds/
├── seed-runner.ts         # Script executável (CLI)
├── run-seeds.ts          # Orquestrador principal
├── 001-users.seed.ts     # Seed de usuários
├── 002-plans.seed.ts     # Seed de planos
├── 003-plan-features.seed.ts  # Seed de features dos planos
├── 004-credit-balances.seed.ts  # Seed de saldos de crédito
├── 005-user-sessions.seed.ts    # Seed de sessões de usuário
└── 006-system-config.seed.ts   # Seed de configurações do sistema
```

## 🚀 Como Usar

### Executar Todos os Seeds

```bash
# Usando npm
npm run db:seed

# Usando yarn
yarn db:seed

# Diretamente com ts-node
ts-node src/database/seeds/seed-runner.ts
```

### Testar Seeds (Após Build)

```bash
# Compilar primeiro
npm run build

# Executar teste
npm run seed:test
```

## 📦 Seeds Disponíveis

### 1. **UserSeeder** (001-users.seed.ts)
- **Propósito**: Cria usuários iniciais do sistema
- **Dados**: 3 usuários (admin, test, demo)
- **Credenciais**:
  - Admin: `admin@neuralcontent.com` / `admin123`
  - Teste: `test@test.com` / `123456`
  - Demo: `demo@neuralcontent.com` / `demo123`

### 2. **PlanSeeder** (002-plans.seed.ts)
- **Propósito**: Cria planos de assinatura
- **Dados**: 4 planos (Grátis, Basic, Premium, Enterprise)
- **Preços**: R$ 0,00 a R$ 199,90

### 3. **PlanFeatureSeeder** (003-plan-features.seed.ts)
- **Propósito**: Cria features específicas de cada plano
- **Dados**: Features detalhadas para cada plano
- **Limites**: Define limites por plano

### 4. **CreditBalanceSeeder** (004-credit-balances.seed.ts)
- **Propósito**: Cria saldos iniciais de crédito
- **Dados**: 
  - Admin: 10.000 créditos
  - Test: 1.000 créditos
  - Demo: 500 créditos

### 5. **UserSessionSeeder** (005-user-sessions.seed.ts)
- **Propósito**: Cria sessões de exemplo
- **Dados**: Sessões ativas para usuários de teste

### 6. **SystemConfigSeeder** (006-system-config.seed.ts)
- **Propósito**: Configurações do sistema
- **Dados**: Configurações básicas da aplicação

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Banco de dados
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=neuralcontent
```

### Pré-requisitos

1. **Banco de dados criado**:
   ```sql
   CREATE DATABASE neuralcontent;
   ```

2. **Migrations executadas**:
   ```bash
   npm run migration:run
   ```

3. **Dependências instaladas**:
   ```bash
   npm install
   ```

## 📊 Ordem de Execução

Os seeds são executados na seguinte ordem para garantir integridade referencial:

1. **Usuários** → Base para tudo
2. **Planos** → Necessário para features
3. **Features dos Planos** → Dependem dos planos
4. **Saldos de Crédito** → Dependem dos usuários
5. **Sessões de Usuário** → Dependem dos usuários
6. **Configurações** → Independente

## 🛡️ Segurança

- **Verificação de Duplicatas**: Cada seed verifica se os dados já existem
- **Transações**: Operações críticas usam transações
- **Logs**: Todas as operações são logadas
- **Validação**: Dados são validados antes da inserção

## 🐛 Troubleshooting

### Erro de Conexão
```
❌ Erro: connect ECONNREFUSED 127.0.0.1:3306
```
**Solução**: Verifique se o MySQL está rodando e as credenciais estão corretas.

### Erro de Migração
```
❌ Erro: Table 'users' doesn't exist
```
**Solução**: Execute as migrations primeiro:
```bash
npm run migration:run
```

### Erro de Duplicata
```
❌ Erro: Duplicate entry for key 'email_UNIQUE'
```
**Solução**: Os seeds detectam duplicatas automaticamente. Se necessário, limpe o banco:
```sql
TRUNCATE TABLE users;
```

## 📝 Logs

Os seeds geram logs detalhados:

```
🌱 Iniciando execução de todos os seeds...
==========================================

1️⃣ Executando UserSeeder...
✅ Usuário criado: admin@neuralcontent.com
✅ Usuário criado: test@test.com
✅ Usuário criado: demo@neuralcontent.com
🎉 Seed de usuários concluído! 3 usuários criados.

2️⃣ Executando PlanSeeder...
✅ Plano criado: Plano Grátis
✅ Plano criado: Plano Basic
✅ Plano criado: Plano Premium
✅ Plano criado: Plano Enterprise
🎉 Seed de planos concluído! 4 planos criados.

==========================================
🎉 Todos os seeds foram executados com sucesso!
==========================================

📊 Resumo da execução:
------------------------
👥 Usuários: 3
📋 Planos: 4
⚙️ Features: 20
💰 Transações de crédito: 3
🔐 Sessões: 3
🔧 Configurações: 13

🔑 Credenciais de acesso:
-------------------------
Admin: admin@neuralcontent.com / admin123
Teste: test@test.com / 123456
Demo: demo@neuralcontent.com / demo123
```

## 🔄 Ambiente de Desenvolvimento

Para facilitar o desenvolvimento, você pode:

1. **Executar seeds específicos**:
   ```bash
   ts-node src/database/seeds/001-users.seed.ts
   ```

2. **Resetar dados**:
   ```bash
   npm run migration:revert
   npm run migration:run
   npm run db:seed
   ```

3. **Monitorar logs**:
   ```bash
   npm run db:seed 2>&1 | tee seeds.log
   ```

## 🤝 Contribuindo

Ao adicionar novos seeds:

1. Siga o padrão `XXX-nome.seed.ts`
2. Implemente a interface `Seeder`
3. Adicione ao `run-seeds.ts`
4. Documente no README
5. Teste a execução

## 📄 Licença

Este projeto está sob a licença MIT.


# 1. Executar migrations
npm run migration:run

# 2. Executar seeds
npm run db:seed

# 3. Validar sistema (opcional)
npm run seed:validate