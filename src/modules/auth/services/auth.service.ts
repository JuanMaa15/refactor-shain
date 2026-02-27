import { PrismaService } from '@/database/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '@/generated/prisma/enums';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';
import { User } from '@/generated/prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from '@/modules/auth/dto';
import { AuthValidationsService } from './auth-validations.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtSerfice: JwtService,
    private configService: ConfigService,
    private authValidationsService: AuthValidationsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { password, confirmPassword: _unused, ...restRegister } = registerDto;

    //Validar username
    await this.authValidationsService.checkUserUniqueness('nombre de usuario', {
      username: registerDto.username,
    });

    //Validar email
    await this.authValidationsService.checkUserUniqueness('email', {
      email: registerDto.email,
    });

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

    //Si es un propietario de negocio, crear un negocio
    if (role.name === UserRole.BUSINESS_OWNER) {
      const businessJoinCode = this.generateBusinessCode();

      const newBusiness = await this.prisma.business.create({
        data: {
          businessJoinCode,
          goal: 0, // Meta inicial en 0
          ownerId: user.id,
        },
      });

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { businessId: newBusiness.id },
      });
      user.businessId = updatedUser.businessId;
    }

    const { password: _, ...userWhitouthPassword } = user;

    return userWhitouthPassword;
  }

  private generateBusinessCode(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
