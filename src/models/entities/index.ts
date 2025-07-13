// Export all entities
export { User, UserRole, UserStatus } from './User';
export { UserSession } from './UserSession';
export { UserPermission, PermissionType } from './UserPermission';
export { VerificationToken, TokenType } from './VerificationToken';

// Import entities for the array
import { User } from './User';
import { UserSession } from './UserSession';
import { UserPermission } from './UserPermission';
import { VerificationToken } from './VerificationToken';

// Array of all entities for TypeORM configuration
export const entities = [
  User,
  UserSession,
  UserPermission,
  VerificationToken
];

export default entities;
