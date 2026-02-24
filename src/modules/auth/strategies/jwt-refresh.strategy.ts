import { PrismaService } from '@/database/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh', // Nombre único (diferente a 'jwt')
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.refresh_token_shain;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refresh.secret') as string,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies?.refresh_token;

    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    // Validar que el token exista en DB
    if (!refreshTokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Validar que el token no esté revocado
    if (refreshTokenRecord.revoked) {
      throw new UnauthorizedException(
        'Refresh token revocado. Por favor, inicia sesión nuevamente.',
      );
    }

    // Validar que el token no esté expirado en DB
    if (new Date() > refreshTokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Validar que el usuario asociado exista y esté activo
    if (!refreshTokenRecord.user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!refreshTokenRecord.user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Return payload + refreshToken
    // El controller usará esto para generar nuevo access token
    return {
      userId: payload.userId,
      refreshToken,
    };
  }
}
