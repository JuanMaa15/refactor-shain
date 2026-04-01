import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Role } from '@/generated/prisma/client';
import { UserRole } from '@/generated/prisma/enums';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findRegisterRoles(): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: {
        isActive: true,
        name: { in: [UserRole.SERVICE_PROVIDER, UserRole.BUSINESS_OWNER] },
      },
      orderBy: { name: 'asc' },
    });
  }
}
