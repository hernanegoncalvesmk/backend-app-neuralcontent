import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  Req, 
  UseGuards,
  Get 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  RefreshTokenDto, 
  AuthResponseDto,
  LogoutDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailResponseDto,
  EmailOperationResponseDto,
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
    description: 'Autentica usuário e retorna tokens de acesso' 
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciais inválidas ou usuário inativo' 
  })
  @ApiResponse({ 
    status: 422, 
    description: 'Dados de entrada inválidos' 
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
    description: 'Cria nova conta de usuário' 
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuário criado com sucesso',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Email já está em uso' 
  })
  @ApiResponse({ 
    status: 422, 
    description: 'Dados de entrada inválidos' 
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
    description: 'Gera novo access token usando refresh token válido' 
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Token renovado com sucesso',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Refresh token inválido ou expirado' 
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
    description: 'Invalida refresh token e encerra sessão' 
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
          example: 'Logout realizado com sucesso'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de acesso inválido' 
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
    description: 'Retorna informações do usuário logado' 
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
        status: { type: 'string', example: 'active' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de acesso inválido' 
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

  // ===================================================================
  // ENDPOINTS DE VERIFICAÇÃO DE EMAIL E RECUPERAÇÃO DE SENHA
  // ===================================================================

  /**
   * Verificar email do usuário
   */
  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar email do usuário',
    description: 'Verifica o email do usuário usando token recebido por email',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verificado com sucesso',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido ou expirado',
  })
  @ApiBody({ type: VerifyEmailDto })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
    try {
      this.logger.log(`Verificação de email solicitada`);
      
      const result = await this.authService.verifyEmail(
        verifyEmailDto.token,
        verifyEmailDto.email,
      );

      return result;
    } catch (error) {
      this.logger.error(`Erro na verificação de email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reenviar email de verificação
   */
  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenviar email de verificação',
    description: 'Reenvia o email de verificação para o usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Email de verificação reenviado',
    type: EmailOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email já verificado ou inválido',
  })
  @ApiBody({ type: ResendVerificationDto })
  async resendVerification(
    @Body() resendDto: ResendVerificationDto,
  ): Promise<EmailOperationResponseDto> {
    try {
      this.logger.log(`Reenvio de verificação solicitado para: ${resendDto.email}`);
      
      const result = await this.authService.resendVerificationEmail(resendDto.email);

      return result;
    } catch (error) {
      this.logger.error(`Erro no reenvio de verificação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Solicitar recuperação de senha
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description: 'Envia email com instruções para recuperação de senha',
  })
  @ApiResponse({
    status: 200,
    description: 'Instruções enviadas por email',
    type: EmailOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email inválido ou usuário não encontrado',
  })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<EmailOperationResponseDto> {
    try {
      this.logger.log(`Recuperação de senha solicitada para: ${forgotPasswordDto.email}`);
      
      const result = await this.authService.forgotPassword(
        forgotPasswordDto.email,
        forgotPasswordDto.callbackUrl,
      );

      return result;
    } catch (error) {
      this.logger.error(`Erro na recuperação de senha: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reset de senha
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset de senha',
    description: 'Redefine a senha do usuário usando token de recuperação',
  })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, expirado ou senhas não coincidem',
  })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Reset de senha solicitado`);
      
      const result = await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
        resetPasswordDto.confirmPassword,
        resetPasswordDto.email,
      );

      return result;
    } catch (error) {
      this.logger.error(`Erro no reset de senha: ${error.message}`);
      throw error;
    }
  }
}
