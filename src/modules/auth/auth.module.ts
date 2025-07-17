import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserSession } from './entities/user-session.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { User } from '../users/entities/user.entity';

// Shared modules
import { LoggerModule } from '../../shared/logger/logger.module';
import { CacheModule } from '../../shared/cache/cache.module';

/**
 * Módulo de autenticação
 * 
 * @description Fornece funcionalidades completas de autenticação e autorização
 * @author NeuralContent Team
 * @since 1.0.0
 * 
 * @features
 * - Login/Logout de usuários
 * - Registro de novos usuários
 * - Gestão de refresh tokens
 * - Controle de sessões
 * - Autenticação JWT
 * - Segurança avançada
 */
@Module({
  imports: [
    // TypeORM para entidades
    TypeOrmModule.forFeature([
      User,
      UserSession,
      VerificationToken,
    ]),

    // JWT Module com configuração assíncrona
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),

    // Passport para estratégias de autenticação
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),

    // Módulos compartilhados
    LoggerModule,
    CacheModule,
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
  ],

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
