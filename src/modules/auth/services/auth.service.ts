import { PrismaService } from '@/database/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UserRole } from '@/generated/prisma/enums';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RegisterDto,
  ResetPasswordDto,
} from '@/modules/auth/dto';
import { AuthValidationsService } from './auth-validations.service';
import { UserWithoutSensitive } from '@/modules/auth/interfaces';
import { Response } from 'express';
import { clearAuthTokens, setAuthTokens } from '@/common/utils/cookies.util';
import crypto from 'crypto';

interface UserWithDetails extends UserWithoutSensitive {
  Business?: {
    id: string;
    name: string;
    imageUrl: string;
  };
  role: {
    name: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private authValidationsService: AuthValidationsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserWithoutSensitive> {
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

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserWithDetails | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    //Validar que el usuario esté activo
    if (!user.isActive) {
      throw new UnauthorizedException('Tu cuenta se encuentra inactiva');
    }

    // Validar trial period
    if (user.trialPeriodEndsAt && new Date() > user.trialPeriodEndsAt) {
      throw new UnauthorizedException(
        'Tu período de prueba ha expirado. Por favor, actualiza tu plan.',
      );
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: UserWithDetails, res: Response): Promise<UserWithDetails> {
    const accessToken = await this.jwtService.signAsync(
      {
        userId: user.id,
        username: user.username,
        role: user.role.name,
      },
      {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn:
          (this.configService.get<string>('jwt.expiresIn') as '1d') ?? '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        userId: user.id,
      },
      {
        secret: this.configService.get<string>('jwt.refresh.secret'),
        expiresIn:
          (this.configService.get<string>('jwt.refresh.expiresIn') as '7d') ??
          '7d',
      },
    );

    //Guuardar refresh token en DB

    //Configurar valores de expiración
    const daysExpiresAt = this.configService
      .get<string>('jwt.refresh.expiresIn')
      ?.includes('d')
      ? this.configService
          .get<string>('jwt.refresh.expiresIn')
          ?.replace('d', '')
      : null;

    const expiresAt = addDays(
      new Date(),
      daysExpiresAt ? parseInt(daysExpiresAt) : 7,
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        revoked: false,
      },
    });

    //Configurar cookies httpOnly
    const isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production';
    const domain = this.configService.get<string>('cookie.domain');

    setAuthTokens({ res, accessToken, refreshToken, isProduction, domain }); //Configuración de cookies de autenticación de forma segura (httpOnly, secure, sameSite, domain, path, etc) y seteo de cookies res, accessToken, refreshToken, isProduction, domain);

    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return; // No revelar que el email no existe (seguridad)
    }

    const resetToken = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.prisma.resetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        used: false,
        expiresAt,
      },
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, password } = resetPasswordDto;

    const resetToken = await this.prisma.resetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used) {
      throw new BadRequestException('Token inválido o ya usado');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('El token ha expirado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await this.prisma.resetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Revocar todos los refresh tokens (seguridad)
    await this.prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: { revoked: true },
    });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, password, confirmPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const isSamePassword = await bcrypt.compare(password, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revocar todos los refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  /**
   * UTILIDAD: Generar token seguro
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * LOGOUT - Cerrar sesión
   */
  async logout(refreshToken: string, res: Response): Promise<void> {
    // Revocar refresh token en DB
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }

    // Limpiar cookies
    const domain = this.configService.get<string>('COOKIE_DOMAIN');
    clearAuthTokens(res, domain);
  }
}
