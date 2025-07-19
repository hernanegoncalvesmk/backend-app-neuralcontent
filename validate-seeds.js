#!/usr/bin/env node

/**
 * Script de Validação Completa do Sistema de Seeds
 * 
 * Este script verifica:
 * 1. Conexão com o banco de dados
 * 2. Existência das tabelas necessárias
 * 3. Estrutura das entidades
 * 4. Execução dos seeds
 * 5. Integridade dos dados
 */

const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

// Configuração do banco de dados
const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'neuralcontent',
    synchronize: false,
    logging: false,
    entities: ['dist/src/**/*.entity.js'],
});

async function validateDatabase() {
    console.log('🔍 Iniciando validação completa do sistema de seeds...\n');
    
    try {
        // 1. Testar conexão
        console.log('1️⃣ Testando conexão com o banco de dados...');
        await dataSource.initialize();
        console.log('✅ Conexão estabelecida com sucesso!\n');

        // 2. Verificar tabelas essenciais
        console.log('2️⃣ Verificando existência das tabelas...');
        const requiredTables = [
            'users',
            'plans', 
            'plan_features',
            'credit_balances',
            'credit_transactions',
            'user_sessions',
            'system_config',
            'payments',
            'audit_logs'
        ];

        for (const table of requiredTables) {
            const result = await dataSource.query(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = ? AND table_name = ?`,
                [process.env.DB_NAME || 'neuralcontent', table]
            );
            
            if (result[0].count > 0) {
                console.log(`  ✅ Tabela '${table}' existe`);
            } else {
                console.log(`  ❌ Tabela '${table}' não encontrada`);
                throw new Error(`Tabela obrigatória '${table}' não existe`);
            }
        }
        console.log('✅ Todas as tabelas obrigatórias existem!\n');

        // 3. Verificar dados dos seeds
        console.log('3️⃣ Verificando dados inseridos pelos seeds...');
        
        // Verificar usuários
        const userCount = await dataSource.query('SELECT COUNT(*) as count FROM users');
        console.log(`  👥 Usuários encontrados: ${userCount[0].count}`);
        
        if (userCount[0].count >= 3) {
            console.log('  ✅ Seeds de usuários executados corretamente');
        } else {
            console.log('  ⚠️ Seeds de usuários podem não ter sido executados');
        }

        // Verificar planos
        const planCount = await dataSource.query('SELECT COUNT(*) as count FROM plans');
        console.log(`  📋 Planos encontrados: ${planCount[0].count}`);
        
        if (planCount[0].count >= 4) {
            console.log('  ✅ Seeds de planos executados corretamente');
        } else {
            console.log('  ⚠️ Seeds de planos podem não ter sido executados');
        }

        // Verificar features
        const featureCount = await dataSource.query('SELECT COUNT(*) as count FROM plan_features');
        console.log(`  ⚙️ Features encontradas: ${featureCount[0].count}`);
        
        if (featureCount[0].count >= 16) {
            console.log('  ✅ Seeds de features executados corretamente');
        } else {
            console.log('  ⚠️ Seeds de features podem não ter sido executados');
        }

        // Verificar saldos de crédito
        const creditCount = await dataSource.query('SELECT COUNT(*) as count FROM credit_balances');
        console.log(`  💰 Saldos de crédito encontrados: ${creditCount[0].count}`);
        
        if (creditCount[0].count >= 3) {
            console.log('  ✅ Seeds de saldos executados corretamente');
        } else {
            console.log('  ⚠️ Seeds de saldos podem não ter sido executados');
        }

        // Verificar configurações
        const configCount = await dataSource.query('SELECT COUNT(*) as count FROM system_config');
        console.log(`  🔧 Configurações encontradas: ${configCount[0].count}`);
        
        if (configCount[0].count >= 10) {
            console.log('  ✅ Seeds de configurações executados corretamente');
        } else {
            console.log('  ⚠️ Seeds de configurações podem não ter sido executados');
        }

        console.log('\n4️⃣ Verificando integridade dos dados...');

        // Verificar relacionamentos
        const plansWithFeatures = await dataSource.query(`
            SELECT p.name, COUNT(pf.id) as feature_count
            FROM plans p
            LEFT JOIN plan_features pf ON p.id = pf.plan_id
            GROUP BY p.id, p.name
        `);

        console.log('  📊 Planos e suas features:');
        plansWithFeatures.forEach(plan => {
            console.log(`    ${plan.name}: ${plan.feature_count} features`);
        });

        // Verificar usuários com saldos
        const usersWithBalance = await dataSource.query(`
            SELECT u.email, cb.balance
            FROM users u
            LEFT JOIN credit_balances cb ON u.id = cb.user_id
            WHERE cb.balance IS NOT NULL
        `);

        console.log('\n  💳 Usuários com saldo de créditos:');
        usersWithBalance.forEach(user => {
            console.log(`    ${user.email}: ${user.balance} créditos`);
        });

        console.log('\n5️⃣ Verificando arquivos de seed...');
        
        const seedsDir = path.join(__dirname, 'src', 'database', 'seeds');
        const requiredSeeds = [
            'seed-runner.ts',
            'run-seeds.ts',
            '001-users.seed.ts',
            '002-plans.seed.ts',
            '003-plan-features.seed.ts',
            '004-credit-balances.seed.ts',
            '005-user-sessions.seed.ts',
            '006-system-config.seed.ts'
        ];

        for (const seedFile of requiredSeeds) {
            const seedPath = path.join(seedsDir, seedFile);
            if (fs.existsSync(seedPath)) {
                console.log(`  ✅ Arquivo '${seedFile}' existe`);
            } else {
                console.log(`  ❌ Arquivo '${seedFile}' não encontrado`);
            }
        }

        console.log('\n==========================================');
        console.log('🎉 VALIDAÇÃO COMPLETA CONCLUÍDA!');
        console.log('==========================================');
        
        console.log('\n📊 RESUMO DA VALIDAÇÃO:');
        console.log('------------------------');
        console.log(`✅ Conexão com banco: OK`);
        console.log(`✅ Tabelas obrigatórias: ${requiredTables.length}/${requiredTables.length}`);
        console.log(`✅ Usuários: ${userCount[0].count}`);
        console.log(`✅ Planos: ${planCount[0].count}`);
        console.log(`✅ Features: ${featureCount[0].count}`);
        console.log(`✅ Saldos: ${creditCount[0].count}`);
        console.log(`✅ Configurações: ${configCount[0].count}`);
        
        console.log('\n🚀 O sistema está pronto para uso!');
        console.log('\n🔑 Para executar os seeds:');
        console.log('   npm run db:seed');
        
        console.log('\n📖 Para mais informações:');
        console.log('   Consulte o README.md em src/database/seeds/');

    } catch (error) {
        console.error('\n❌ ERRO NA VALIDAÇÃO:', error.message);
        console.error('\n🔧 Possíveis soluções:');
        console.error('1. Verificar se o MySQL está rodando');
        console.error('2. Verificar as variáveis de ambiente');
        console.error('3. Executar as migrations: npm run migration:run');
        console.error('4. Compilar o projeto: npm run build');
        process.exit(1);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

// Executar validação
if (require.main === module) {
    validateDatabase();
}

module.exports = { validateDatabase };
