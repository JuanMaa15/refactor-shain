import { PrismaService } from '@/database/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { ConflictException, Injectable } from '@nestjs/common';

type UserUniqueFilter = Prisma.UserWhereUniqueInput;

//Esta clase se encarga de realizar las validaciones con condicionales y lanzar los errores correspondientes.
@Injectable()
export class AuthValidationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifica si un usuario ya existe en la base de datos con
   * ciertos campos de busqueda.
   *
   * @param fieldName - Campo que se esta buscando (email, username, etc.)
   * @param filter - Filtro de busqueda para el usuario
   *
   * @throws Error - El usuario ya existe en la base de datos
   */
  async checkUserUniqueness(fieldName: string, filter: UserUniqueFilter) {
    const existingUser = await this.prisma.user.findUnique({
      where: filter,
    });
    if (existingUser) {
      throw new ConflictException(`El ${fieldName} ya esta en uso`);
    }
  }
}
