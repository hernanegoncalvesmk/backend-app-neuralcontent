import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../guards/roles.guard';

/**
 * Decorator para definir roles necessárias para acessar uma rota
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
