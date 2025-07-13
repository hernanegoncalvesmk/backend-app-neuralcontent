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

// DTOs de consulta e filtros
export { QueryUsersDto, SortOrder } from './query-users.dto';

// DTOs de estatísticas
export { UserStatisticsDto } from './user-statistics.dto';

// Re-export tipos para uso externo
export type { CreateUserDto as CreateUserDtoType } from './create-user.dto';
export type { UpdateUserDto as UpdateUserDtoType, ChangePasswordDto as ChangePasswordDtoType } from './update-user.dto';
export type { 
  UserResponseDto as UserResponseDtoType,
  UserListResponseDto as UserListResponseDtoType,
  UserStatsResponseDto as UserStatsResponseDtoType
} from './user-response.dto';
export type { QueryUsersDto as QueryUsersDtoType } from './query-users.dto';
export type { UserStatisticsDto as UserStatisticsDtoType } from './user-statistics.dto';
export type { UserRole as UsersUserRole } from './create-user.dto';
export type { UserStatus as UsersUserStatus } from './create-user.dto';
