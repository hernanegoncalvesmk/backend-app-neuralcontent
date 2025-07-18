import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Seeds para usuários de desenvolvimento
 * 
 * @description Cria usuários de teste para desenvolvimento
 * incluindo admin e usuários normais
 * 
 * @author NeuralContent Team
 * @since 2.14.0
 */

interface UserSeedData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
}

const usersData: UserSeedData[] = [
  // Super Admin
  {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@neuralcontent.com',
    password: 'SuperAdmin@2024',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  },
  
  // Admin
  {
    firstName: 'Admin',
    lastName: 'NeuralContent',
    email: 'admin@neuralcontent.com',
    password: 'Admin@2024',
    role: UserRole.ADMIN,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  },

  // Usuário de teste 1
  {
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@teste.com',
    password: 'User@2024',
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  },

  // Usuário de teste 2
  {
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@teste.com',
    password: 'User@2024',
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  },

  // Usuário de teste 3
  {
    firstName: 'Pedro',
    lastName: 'Oliveira',
    email: 'pedro.oliveira@teste.com',
    password: 'User@2024',
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: false,
  },

  // Usuário guest para testes
  {
    firstName: 'Guest',
    lastName: 'User',
    email: 'guest@teste.com',
    password: 'Guest@2024',
    role: UserRole.GUEST,
    isActive: false,
    isEmailVerified: false,
  },

  // Usuário suspenso para testes
  {
    firstName: 'Suspenso',
    lastName: 'Teste',
    email: 'suspenso@teste.com',
    password: 'Suspenso@2024',
    role: UserRole.USER,
    isActive: false,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  },
];

export async function runUserSeeds(): Promise<void> {
  const userRepository: Repository<User> = AppDataSource.getRepository(User);

  try {
    console.log('   📝 Criando usuários de desenvolvimento...');

    for (const userData of usersData) {
      // Verificar se usuário já existe
      const existingUser = await userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`   ⏭️  Usuário ${userData.email} já existe, pulando...`);
        continue;
      }

      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Criar usuário
      const user = new User();
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      user.email = userData.email;
      user.password = hashedPassword;
      user.role = userData.role;
      user.isEmailVerified = userData.isEmailVerified;
      user.emailVerifiedAt = userData.emailVerifiedAt;
      user.isActive = userData.isActive;

      await userRepository.save(user);
      
      console.log(`   ✅ Usuário ${userData.firstName} ${userData.lastName} (${userData.email}) criado - Role: ${userData.role}`);
    }

    console.log(`   🎯 Total de usuários processados: ${usersData.length}`);

  } catch (error) {
    console.error('   ❌ Erro ao criar seeds de usuários:', error);
    throw error;
  }
}
