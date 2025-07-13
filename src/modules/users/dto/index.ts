/**
 * Barrel exports para DTOs do módulo de usuários
 * 
 * @description Centraliza as exportações dos DTOs do módulo de usuários
 * @author NeuralContent Team
 * @since 1.0.0
 */

// DTOs principais de entrada
export { CreateUserDto, UserRole, UserStatus } from './create-user.dto';
export { UpdateUserDto, ChangePasswordDto } from './update-user.dto';

// DTOs de resposta
export { 
  UserResponseDto, 
  UserListResponseDto, 
  UserStatsResponseDto 
} from './user-response.dto';

// Re-export tipos para uso externo
export type { UserRole as UsersUserRole } from './create-user.dto';
export type { UserStatus as UsersUserStatus } from './create-user.dto';
