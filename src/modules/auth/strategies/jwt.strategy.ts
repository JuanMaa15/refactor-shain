import { PrismaService } from '@/database/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
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

    //Si expiró su periodo de prueba
    if (user.trialPeriodEndsAt && new Date() > user.trialPeriodEndsAt) {
      throw new UnauthorizedException(
        'Tu período de prueba ha expirado. Por favor, actualiza tu plan.',
      );
    }

    return user;
  }
}
