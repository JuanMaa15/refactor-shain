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
import { BusinessService } from '@/modules/business/business.service';

export interface UserWithDetails extends UserWithoutSensitive {
  business?: {
    id: string;
    name: string | null;
    imageUrl: string | null;
  } | null;
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
    private businessService: BusinessService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserWithoutSensitive> {
    const {
      password,
      confirmPassword: _unused,
      businessCode,
      entryCode,
      roleId,
      ...baseData
    } = registerDto;

    await this.authValidationsService.checkUserUniqueness('nombre de usuario', {
      username: registerDto.username,
    });
    await this.authValidationsService.checkUserUniqueness('email', {
      email: registerDto.email,
    });

    if (entryCode && roleId) {
      throw new BadRequestException(
        'No puedes enviar un código de ingreso y un rol al mismo tiempo. Usa entryCode para suscripción o roleId para el período de prueba.',
      );
    }

    // ─── Flujo con código de ingreso (suscripción paga) ───────────────────────
    if (entryCode) {
      return this.registerWithEntryCode(entryCode, { ...baseData, password });
    }

    // ─── Flujo con rol (período de prueba gratuito) ───────────────────────────
    if (!roleId) {
      throw new BadRequestException(
        'Debes proporcionar un código de ingreso o seleccionar un rol para el período de prueba.',
      );
    }

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('El rol no existe.');

    let businessId: string | null = null;

    if (role.name === UserRole.SERVICE_PROVIDER) {
      if (!businessCode) {
        throw new BadRequestException('El código de negocio es requerido.');
      }
      const business = await this.businessService.findByJoinCode(businessCode);
      if (!business) {
        throw new NotFoundException('El código de negocio no existe.');
      }
      businessId = business.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...baseData,
        roleId,
        password: hashedPassword,
        businessId,
        trialPeriodEndsAt: addDays(new Date(), 14),
        goal: 0,
      },
    });

    if (role.name === UserRole.BUSINESS_OWNER) {
      const businessJoinCode = this.generateBusinessCode();
      const newBusiness = await this.businessService.createBusiness({
        ownerId: user.id,
        businessJoinCode,
      });
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { businessId: newBusiness.id },
      });
      user.businessId = updatedUser.businessId;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private async registerWithEntryCode(
    code: string,
    data: {
      name: string;
      lastName: string;
      username: string;
      email: string;
      password: string;
      phone?: string;
    },
  ): Promise<UserWithoutSensitive> {
    const entryCode = await this.prisma.entryCode.findUnique({
      where: { code },
      include: { order: true, role: true },
    });

    if (!entryCode) {
      throw new NotFoundException('El código de ingreso no existe.');
    }
    if (entryCode.used) {
      throw new BadRequestException('El código de ingreso ya fue utilizado.');
    }
    if (entryCode.order.status !== 'APPROVED') {
      throw new BadRequestException(
        'El código de ingreso no corresponde a una orden aprobada.',
      );
    }

    const roleName = entryCode.role.name as UserRole;
    const paymentPeriodEndsAt = entryCode.order.endDate;

    // SERVICE_PROVIDER: el propietario del negocio debe haberse registrado antes
    let businessId: string | null = null;

    if (roleName === UserRole.SERVICE_PROVIDER) {
      const ownerRole = await this.prisma.role.findFirst({
        where: { name: UserRole.BUSINESS_OWNER },
      });

      const ownerCode = await this.prisma.entryCode.findFirst({
        where: {
          orderId: entryCode.orderId,
          roleId: ownerRole?.id,
          used: true,
        },
        include: { user: true },
      });

      if (!ownerCode?.user?.businessId) {
        throw new BadRequestException(
          'El propietario del negocio aún no ha completado su registro. Por favor intenta más tarde.',
        );
      }

      businessId = ownerCode.user.businessId;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear usuario y marcar código como usado en una transacción
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          lastName: data.lastName,
          username: data.username,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          roleId: entryCode.roleId,
          businessId,
          entryCodeId: entryCode.id,
          paymentPeriodEndsAt,
          goal: 0,
        },
      });

      await tx.entryCode.update({
        where: { id: entryCode.id },
        data: { used: true },
      });

      return newUser;
    });

    // BUSINESS_OWNER: crear el negocio después de crear el usuario
    if (roleName === UserRole.BUSINESS_OWNER) {
      const businessJoinCode = this.generateBusinessCode();
      const newBusiness = await this.businessService.createBusiness({
        ownerId: user.id,
        businessJoinCode,
      });
      await this.prisma.user.update({
        where: { id: user.id },
        data: { businessId: newBusiness.id },
      });
      user.businessId = newBusiness.id;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
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

    // Validar vigencia de acceso (trial o suscripción activa)
    const now = new Date();
    const trialActivo =
      user.trialPeriodEndsAt !== null && now <= user.trialPeriodEndsAt;
    const pagoActivo =
      user.paymentPeriodEndsAt !== null && now <= user.paymentPeriodEndsAt;
    const sinFechasDeControl =
      user.trialPeriodEndsAt === null && user.paymentPeriodEndsAt === null;

    if (!sinFechasDeControl && !trialActivo && !pagoActivo) {
      throw new UnauthorizedException(
        user.paymentPeriodEndsAt
          ? 'Tu suscripción ha expirado. Por favor, renueva tu plan.'
          : 'Tu período de prueba ha expirado. Por favor, adquiere un plan.',
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

  async refreshAccessToken(
    userId: string,
    refreshToken: string,
    res: Response,
  ): Promise<string> {
    // ← Cambiar void a string
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (tokenRecord.revoked) {
      throw new UnauthorizedException(
        'Refresh token revocado. Por favor, inicia sesión nuevamente.',
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const newAccessToken = await this.jwtService.signAsync(
      {
        userId: user.id,
        username: user.username,
        role: user.role.name,
      },
      {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn:
          (this.configService.get<string>('jwt.expiresIn') as '15m') ?? '15m',
      },
    );

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const domain = this.configService.get<string>('cookie.domain');

    res.cookie('token_shain', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'lax' : 'strict',
      maxAge: 15 * 60 * 1000,
      domain,
      path: '/',
    });

    return newAccessToken; // ← AGREGAR ESTE RETURN
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
    const domain = this.configService.get<string>('cookie.domain');
    clearAuthTokens(res, domain);
  }
}
