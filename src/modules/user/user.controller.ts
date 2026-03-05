import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { UpdateProfileDto, UpdateUserDto } from './dto';
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

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.findOneById(id);

    return {
      status: 'success',
      data: user,
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
    @Param('id', ParseUUIDPipe) id: string,
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
