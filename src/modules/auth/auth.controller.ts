import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
  LogoutDto,
} from './dto';
import { Public } from '../../shared/decorators/public.decorator';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { LoggerService } from '../../shared/logger/logger.service';

/**
 * Controlador de autenticação
 *
 * @description Gerencia endpoints de autenticação e autorização
 * @author NeuralContent Team
 * @since 1.0.0
 */
@ApiTags('🔐 Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthController');
  }

  /**
   * Endpoint de login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login do usuário',
    description: `
    Autentica usuário com email e senha, retornando tokens de acesso JWT.
    
    **Funcionalidades:**
    - Validação de credenciais
    - Geração de access_token (válido por 1h)
    - Geração de refresh_token (válido por 7 dias)
    - Registro de sessão com IP e User-Agent
    - Controle de tentativas de login
    `,
  })
  @ApiBody({ 
    type: LoginDto,
    examples: {
      admin: {
        summary: 'Login de Administrador',
        description: 'Exemplo de login com usuário administrador',
        value: {
          email: 'admin@neuralcontent.com',
          password: 'admin123'
        }
      },
      user: {
        summary: 'Login de Usuário',
        description: 'Exemplo de login com usuário comum',
        value: {
          email: 'usuario@exemplo.com',
          password: 'senha123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
    example: {
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 1,
          firstName: 'João',
          lastName: 'Silva',
          email: 'usuario@exemplo.com',
          role: 'user',
          isActive: true,
          avatar: null,
          createdAt: '2025-01-01T00:00:00.000Z'
        }
      },
      timestamp: '2025-07-17T20:45:12.023Z'
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou usuário inativo',
    example: {
      success: false,
      message: 'Email ou senha inválidos',
      error: 'INVALID_CREDENTIALS',
      timestamp: '2025-07-17T20:45:12.023Z'
    }
  })
  @ApiResponse({
    status: 422,
    description: 'Dados de entrada inválidos',
    example: {
      success: false,
      message: 'Dados de entrada inválidos',
      errors: [
        {
          field: 'email',
          message: 'Email deve ter um formato válido',
          value: 'email-invalido'
        },
        {
          field: 'password',
          message: 'Senha deve ter pelo menos 6 caracteres',
          value: '123'
        }
      ],
      timestamp: '2025-07-17T20:45:12.023Z'
    }
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`, {
      ip: request.ip,
      userAgent: request.get('User-Agent'),
    });

    const clientInfo = this.extractClientInfo(request);

    const result = await this.authService.login(loginDto, clientInfo);

    this.logger.log(`Login successful for user ID: ${result.user.id}`);

    return result;
  }

  /**
   * Endpoint de registro
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registro de usuário',
    description: `
    Cria uma nova conta de usuário no sistema.
    
    **Funcionalidades:**
    - Validação de unicidade do email
    - Criptografia segura da senha (bcrypt)
    - Geração automática de tokens JWT
    - Criação de perfil inicial
    - Envio de email de boas-vindas (opcional)
    `,
  })
  @ApiBody({ 
    type: RegisterDto,
    examples: {
      basic: {
        summary: 'Registro Básico',
        description: 'Exemplo básico de registro de usuário',
        value: {
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao.silva@exemplo.com',
          password: 'senha123',
          confirmPassword: 'senha123'
        }
      },
      complete: {
        summary: 'Registro Completo',
        description: 'Exemplo com todos os campos opcionais',
        value: {
          firstName: 'Maria',
          lastName: 'Santos',
          email: 'maria.santos@exemplo.com',
          password: 'minhasenha456',
          confirmPassword: 'minhasenha456',
          acceptTerms: true
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: AuthResponseDto,
    example: {
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 2,
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao.silva@exemplo.com',
          role: 'user',
          isActive: true,
          avatar: null,
          emailVerifiedAt: null,
          createdAt: '2025-07-17T20:45:12.023Z'
        }
      },
      timestamp: '2025-07-17T20:45:12.023Z'
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Email já está em uso',
    example: {
      success: false,
      message: 'Este email já está registrado no sistema',
      error: 'EMAIL_ALREADY_EXISTS',
      timestamp: '2025-07-17T20:45:12.023Z'
    }
  })
  @ApiResponse({
    status: 422,
    description: 'Dados de entrada inválidos',
    example: {
      success: false,
      message: 'Dados de entrada inválidos',
      errors: [
        {
          field: 'email',
          message: 'Email deve ter um formato válido',
          value: 'email-invalido'
        },
        {
          field: 'password',
          message: 'Senha deve ter pelo menos 6 caracteres',
          value: '123'
        },
        {
          field: 'confirmPassword',
          message: 'Confirmação de senha não confere',
          value: 'diferente'
        }
      ],
      timestamp: '2025-07-17T20:45:12.023Z'
    }
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`, {
      ip: request.ip,
      userAgent: request.get('User-Agent'),
    });

    const result = await this.authService.register(registerDto);

    this.logger.log(`Registration successful for user ID: ${result.user.id}`);

    return result;
  }

  /**
   * Endpoint de renovação de token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar token de acesso',
    description: 'Gera novo access token usando refresh token válido',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    this.logger.log('Token refresh attempt');

    const result = await this.authService.refreshToken(refreshTokenDto);

    this.logger.log(`Token refresh successful for user ID: ${result.user.id}`);

    return result;
  }

  /**
   * Endpoint de logout
   */
  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout do usuário',
    description: 'Invalida refresh token e encerra sessão',
  })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logout realizado com sucesso',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido',
  })
  async logout(
    @Body() logoutDto: LogoutDto,
    @Req() request: Request,
  ): Promise<{ message: string }> {
    this.logger.log('Logout attempt', {
      ip: request.ip,
      userAgent: request.get('User-Agent'),
    });

    const result = await this.authService.logout(logoutDto);

    this.logger.log('Logout successful');

    return result;
  }

  /**
   * Endpoint para verificar status da autenticação
   */
  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Dados do usuário autenticado',
    description: 'Retorna informações do usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'usuario@neuralcontent.com' },
        name: { type: 'string', example: 'João Silva Santos' },
        role: { type: 'string', example: 'user' },
        status: { type: 'string', example: 'active' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido',
  })
  async getProfile(@Req() request: any) {
    const user = request.user;

    this.logger.log(`Profile access for user ID: ${user.id}`);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  }

  // ========== VerificationToken Endpoints ==========

  @ApiOperation({
    summary: 'Obter tokens de verificação de um usuário',
    description:
      'Retorna todos os tokens de verificação válidos de um usuário.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens encontrados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          userId: { type: 'string', example: '123' },
          token: { type: 'string', example: 'verification_token_hash' },
          type: { type: 'string', example: 'email_verification' },
          expiresAt: { type: 'string', format: 'date-time' },
          isUsed: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @Get('my-verification-tokens')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getMyVerificationTokens(@Req() request: any) {
    const user = request.user;
    return this.authService.getUserVerificationTokens(user.sub.toString());
  }

  @ApiOperation({
    summary: 'Invalidar tokens de verificação de um usuário',
    description:
      'Invalida todos os tokens de verificação de um usuário específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens invalidados com sucesso',
    schema: {
      type: 'object',
      properties: {
        affected: { type: 'number', example: 3 },
        message: { type: 'string', example: 'Tokens invalidados com sucesso' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @Post('invalidate-my-verification-tokens')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async invalidateMyVerificationTokens(@Req() request: any) {
    const user = request.user;
    return this.authService.invalidateUserVerificationTokens(
      user.sub.toString(),
    );
  }

  /**
   * Extrai informações do cliente da requisição
   */
  private extractClientInfo(request: Request) {
    const userAgent = request.get('User-Agent') || '';

    // Detectar tipo de dispositivo básico - iPad primeiro para não ser capturado como mobile
    let deviceType = 'desktop';
    if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/Mobile|Android|iPhone/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    return {
      ipAddress: request.ip,
      userAgent,
      deviceType,
      // location pode ser obtida através de serviço de geolocalização IP
    };
  }
}
