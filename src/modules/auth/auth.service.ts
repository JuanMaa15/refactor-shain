import { PrismaService } from '@/database/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from './dto';
import { UserRole } from '@/generated/prisma/enums';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';
import { User } from '@/generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { password, confirmPassword, ...restRegister } = registerDto;

    //Validar username
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
    }

    //Validar email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('El correo electrónico ya está en uso.');
    }

    //Validar password
    if (password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    //Validar si existe el codigo del negocio si es prestador de servicio
    const role = await this.prisma.role.findUnique({
      where: { id: registerDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('El rol no existe.');
    }

    let businessId: string | null = null;

    if (role.name === UserRole.SERVICE_PROVIDER) {
      if (!registerDto.businessCode) {
        throw new BadRequestException('El codigo del negocio es requerido.');
      }

      const business = await this.prisma.business.findUnique({
        where: { businessJoinCode: registerDto.businessCode },
      });

      if (!business) {
        throw new NotFoundException('El codigo del negocio no existe.');
      }

      businessId = business.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //Calcular fecha de fin de trial (14 días)
    const trialPeriodEndsAt = addDays(new Date(), 14);

    // 7. Crear usuario
    const user = await this.prisma.user.create({
      data: {
        ...restRegister,
        password: hashedPassword,
        businessId,
        trialPeriodEndsAt,
        goal: 0, // Meta inicial en 0
        //Sistema de referidos
        // referraCode: null, // Se puede asignar después
        //referredById: null,
      },
    });

    return user;
  }
}
