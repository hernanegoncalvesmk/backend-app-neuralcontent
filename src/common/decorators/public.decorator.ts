import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para marcar rotas como públicas (sem autenticação)
 */
export const Public = () => SetMetadata('isPublic', true);
