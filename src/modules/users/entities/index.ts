/**
 * Barrel exports para entidades do módulo de usuários
 * 
 * @description Centraliza as exportações das entidades do módulo de usuários
 * @author NeuralContent Team
 * @since 1.0.0
 */

// Entidade principal
export { User } from './user.entity';

// Re-export da entidade User do database para compatibilidade
export { User as DatabaseUser } from '../../../database/entities/user.entity';
