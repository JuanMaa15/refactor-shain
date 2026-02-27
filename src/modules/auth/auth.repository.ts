import { PrismaService } from '@/database/prisma.service';
import { Prisma, User } from '@/generated/prisma/client';
import { Injectable } from '@nestjs/common';

type UserUniqueFilter = Prisma.UserWhereUniqueInput;

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findUniqueByFilter(filter: UserUniqueFilter): Promise<User | null> {
    // Verificamos que al menos venga un filtro para no traer el primer registro por error
    if (Object.keys(filter).length === 0) return null;

    return this.prisma.user.findUnique({ where: filter });
  }
}
