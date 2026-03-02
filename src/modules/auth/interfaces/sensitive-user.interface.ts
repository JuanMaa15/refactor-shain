import { User } from '@/generated/prisma/client';

export type UserWithoutSensitive = Omit<User, 'password'>;
