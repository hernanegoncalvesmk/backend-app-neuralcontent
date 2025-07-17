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
@ApiTags('✅ Autenticação')
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
    description: 'Autentica usuário e retorna tokens de acesso',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou usuário inativo',
  })
  @ApiResponse({
    status: 422,
    description: 'Dados de entrada inválidos',
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
    description: 'Cria nova conta de usuário',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email já está em uso',
  })
  @ApiResponse({
    status: 422,
    description: 'Dados de entrada inválidos',
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
