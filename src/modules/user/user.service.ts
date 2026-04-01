import { PrismaService } from '@/database/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicUser, UserWithRelations } from './interfaces';
import { Prisma } from '@/generated/prisma/client';
import { UpdateProfileDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(id: string): Promise<UserWithRelations> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
      include: {
        role: { select: { id: true, name: true } },
        business: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user as UserWithRelations;
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      omit: { password: true },
      include: {
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return users as PublicUser[];
  }

  async findByBusiness(businessId: string): Promise<PublicUser[]> {
    //Validar si existe el negocio
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('El negocio no existe');
    }

    return this.prisma.user.findMany({
      where: { businessId },
      omit: { password: true },
      include: {
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    //Verificar si el usuario existe
    await this.findOneById(userId);

    // Verificar unicidad de username si se está cambiando
    if (dto.username) {
      await this.checkFieldUniqueness('username', userId, {
        username: dto.username,
      });
    }

    // Verificar unicidad de email si se está cambiando
    if (dto.email) {
      await this.checkFieldUniqueness('email', userId, {
        email: dto.email,
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      omit: { password: true },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    // Verificar que el usuario existe antes de cualquier otra operación
    await this.findOneById(id);

    if (dto.username) {
      await this.checkFieldUniqueness('username', id, {
        username: dto.username,
      });
    }

    if (dto.email) {
      await this.checkFieldUniqueness('email', id, {
        email: dto.email,
      });
    }

    // Si viene el role (nombre del enum), necesitamos resolver el roleId (FK)
    let roleId: string | undefined;
    if (dto.role) {
      const roleRecord = await this.prisma.role.findUnique({
        where: { name: dto.role },
      });

      if (!roleRecord) {
        throw new NotFoundException(`El rol '${dto.role}' no existe`);
      }

      roleId = roleRecord.id;
    }

    // Separamos 'role' del resto para no enviarlo directamente a Prisma
    const { role: _role, ...restDto } = dto;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...restDto,
        ...(roleId && { roleId }),
      },
      omit: { password: true },
    });
  }

  private async checkFieldUniqueness(
    field: string,
    excludeUserId: string,
    filter: Prisma.UserWhereUniqueInput,
  ): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: {
        ...filter,
        NOT: { id: excludeUserId },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`El ${field} ya está en uso`);
    }
  }
}
