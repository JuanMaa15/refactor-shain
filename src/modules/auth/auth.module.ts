import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthValidationsService } from './services/auth-validations.service';
import { AuthRepository } from './auth.repository';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { BusinessModule } from '@/modules/business/business.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn:
            (configService.get<string>('jwt.expiresIn') as '15m') ?? '15m',
        },
      }),
    }),
    BusinessModule,
  ],
  controllers: [AuthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    AuthService,
    AuthValidationsService,
    AuthRepository,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthModule {}
