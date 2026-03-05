import { Business, Role, User } from '@/generated/prisma/client';

/**
 * Usuario público — lo que se retorna en las responses de la API.
 * Nunca exponemos password, refreshTokens ni resetTokens.
 */
export type PublicUser = Omit<User, 'password'>;

/**
 * Usuario con sus relaciones incluidas (role + business).
 * Es lo que devuelven las queries con include en el service.
 */
export interface UserWithRelations extends PublicUser {
  role: Pick<Role, 'id' | 'name'>;
  business: Pick<Business, 'id' | 'name' | 'imageUrl'> | null;
}

/**
 * Resultado de listar usuarios por negocio.
 * El BUSINESS_OWNER ve a sus empleados con su progreso de meta.
 */
export interface UserWithGoalProgress extends PublicUser {
  role: Pick<Role, 'id' | 'name'>;
  goalProgress: number; // porcentaje 0-100
}
