import { PrismaService } from '@/database/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.token_shain;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      omit: { password: true },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        role: { select: { name: true } },
      },
    });

    // Si el usuario no existe
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    //Si el usuario no esta activo
    if (user.isActive === false) {
      throw new UnauthorizedException('Usuario inactivo');
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

    return user;
  }
}
