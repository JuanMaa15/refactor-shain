import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser as CurrentUserInterface } from '@/modules/auth/interfaces';
import { CurrentUser, Roles } from '../auth/decorators';
import { UpdateProfileDto, UpdateTrialPeriodDto, UpdateUserDto } from './dto';
import { RolesGuard } from '../auth/guards';
import { UserRole } from '@/generated/prisma/enums';

@ApiTags('Users')
@ApiCookieAuth('token_shain')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener perfil propio' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado' })
  getMyProfile(@CurrentUser() user: CurrentUserInterface) {
    // JwtStrategy ya cargó el usuario con sus relaciones desde DB.
    // No necesitamos ir de nuevo a la DB — usamos lo que ya está en req.user.
    return {
      status: 'success',
      data: {
        ...user,
        business: user.business ?? null,
      },
    };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar perfil propio' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente' })
  @ApiResponse({ status: 409, description: 'Username o email ya en uso' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.userService.updateProfile(
      userId,
      updateProfileDto,
    );

    return {
      status: 'success',
      message: 'Perfil actualizado correctamente.',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    };
  }

  @Get('business')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[BUSINESS_OWNER] Listar empleados del negocio' })
  @ApiResponse({ status: 200, description: 'Lista de empleados' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findByBusiness(@CurrentUser() user: CurrentUserInterface) {
    // businessId viene del JWT, nunca del cliente
    const businessId = user.businessId;

    if (!businessId) {
      return { status: 'success', data: [] };
    }

    const users = await this.userService.findByBusiness(businessId);

    return {
      status: 'success',
      data: users,
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Listar todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de todos los usuarios' })
  async findAll() {
    const users = await this.userService.findAll();

    return {
      status: 'success',
      data: users,
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN|BUSINESS_OWNER] Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(
    @CurrentUser() currentUser: CurrentUserInterface,
    @Param('id') id: string,
  ) {
    const user = await this.userService.findOneById(id);

    if (currentUser.role.name === UserRole.BUSINESS_OWNER) {
      if (
        !currentUser.businessId ||
        user.businessId !== currentUser.businessId
      ) {
        throw new ForbiddenException('No tienes permiso para ver este usuario');
      }
    }

    return {
      status: 'success',
      data: user,
    };
  }

  @Patch(':id/trial')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Actualizar periodo de prueba de un usuario',
  })
  @ApiResponse({ status: 200, description: 'Periodo de prueba actualizado' })
  @ApiResponse({ status: 400, description: 'Fecha inválida o en el pasado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateTrialPeriod(
    @Param('id') id: string,
    @Body() updateTrialPeriodDto: UpdateTrialPeriodDto,
  ) {
    const updatedUser = await this.userService.updateTrialPeriod(
      id,
      updateTrialPeriodDto,
    );

    return {
      status: 'success',
      message: 'Periodo de prueba actualizado correctamente.',
      data: {
        id: updatedUser.id,
        trialPeriodEndsAt: updatedUser.trialPeriodEndsAt,
      },
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Username o email ya en uso' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.updateUser(id, updateUserDto);

    return {
      status: 'success',
      message: 'Usuario actualizado correctamente.',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
      },
    };
  }
}
