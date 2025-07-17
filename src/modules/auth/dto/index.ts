/**
 * Barrel exports para DTOs de autenticação
 * 
 * @description Centraliza as exportações dos DTOs do módulo de autenticação
 * @author NeuralContent Team
 * @since 1.0.0
 */

// DTOs principais
export { LoginDto } from './login.dto';
export { RegisterDto, UserRole } from './register.dto';
export { 
  RefreshTokenDto, 
  AuthResponseDto, 
  LogoutDto,
  ValidateTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto 
} from './refresh-token.dto';

// DTOs de gestão de senha
export { ChangePasswordDto } from './change-password.dto';

// DTOs de token de verificação
export { CreateVerificationTokenDto } from './create-verification-token.dto';
export { VerificationTokenResponseDto } from './verification-token-response.dto';

// Re-export do UserRole para uso externo
export type { UserRole as AuthUserRole } from './register.dto';
