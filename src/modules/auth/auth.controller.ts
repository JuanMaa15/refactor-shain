import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Public } from './decorators';
import { Throttle } from '@nestjs/throttler';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { AuthService } from './services/auth.service';
import { LocalAuthGuard } from './guards';
import { CurrentUser as CurrentUserInterface } from './interfaces';
import { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ login: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Username o email ya en uso' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);

    return {
      status: 'success',
      message: 'Usuario registrado correctamente.',
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        businessId: user.businessId,
      },
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { limit: 7, ttl: 900000 } })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso, cookies configuradas',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta inactiva',
  })
  async login(
    @CurrentUser() user: CurrentUserInterface,
    @Body() _loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loggedUser = await this.authService.login(user, res);

    return {
      status: 'success',
      data: {
        id: loggedUser.id,
        username: loggedUser.username,
        role: loggedUser.role.name,
        businessId: loggedUser.businessId,
        businessImage: loggedUser.business?.imageUrl ?? null,
      },
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Solicitar enlace de recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Respuesta genérica (seguridad)' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);

    return {
      status: 'success',
      message: 'Si el correo existe, recibirás un enlace de recuperación.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida' })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, ya usado, o expirado',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);

    return {
      status: 'success',
      message: 'Contraseña restablecida correctamente.',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('token_shain')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req.cookies?.refresh_token_shain as string) ?? '';
    await this.authService.logout(refreshToken, res);

    return {
      status: 'success',
      message: 'Sesión cerrada correctamente.',
    };
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('token_shain')
  @ApiOperation({ summary: 'Cambiar contraseña (usuario autenticado)' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, changePasswordDto);

    return {
      status: 'success',
      message: 'Contraseña actualizada correctamente.',
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('token_shain')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado o token expirado' })
  me(@CurrentUser() user: CurrentUserInterface) {
    return {
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role.name,
        businessId: user.businessId,
        businessImage: user.business?.imageUrl ?? null,
        isActive: user.isActive,
        trialPeriodEndsAt: user.trialPeriodEndsAt,
      },
    };
  }
}
