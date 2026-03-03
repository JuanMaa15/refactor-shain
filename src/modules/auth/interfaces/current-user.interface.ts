import { Business, Role, User } from '@/generated/prisma/client';

export interface CurrentUser extends User {
  role: Omit<Role, 'createdAt' | 'updatedAt'>;
  business: Pick<Business, 'id' | 'name' | 'imageUrl'>;
}
