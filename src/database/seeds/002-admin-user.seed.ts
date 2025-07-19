import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export class AdminUserSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Verificar se já existe um usuário admin
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@neuralcontent.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe, pulando criação...');
      return;
    }

    console.log('🔑 Criando usuário admin padrão...');

    // Hash da senha padrão
    const defaultPassword = 'NeuralContent@2025';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Criar usuário admin - usando apenas campos que existem na migration
    const adminUser = userRepository.create({
      name: 'Neural Content Admin',
      email: 'admin@neuralcontent.com',
      password_hash: hashedPassword,
      role: 'admin' as const,
      status: 'active' as const,
      email_verified: true,
      phone: '+55 11 99999-9999',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      preferences: {
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
        theme: 'light'
      },
      login_attempts: 0
    });

    const savedAdmin = await userRepository.save(adminUser);

    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`   - ID: ${savedAdmin.id}`);
    console.log(`   - Email: ${savedAdmin.email}`);
    console.log(`   - Senha padrão: ${defaultPassword}`);
    console.log('   ⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!');
  }
}
