import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/modules/auth/decorators';
import { RoleService } from './role.service';

@ApiTags('Roles')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los roles activos' })
  @ApiResponse({ status: 200, description: 'Listado de roles' })
  async findAll() {
    const roles = await this.roleService.findAll();

    return {
      status: 'success',
      data: roles,
    };
  }

  @Get('register')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener roles disponibles para registro (SERVICE_PROVIDER y BUSINESS_OWNER)',
  })
  @ApiResponse({ status: 200, description: 'Listado de roles para registro' })
  async findRegisterRoles() {
    const roles = await this.roleService.findRegisterRoles();

    return {
      status: 'success',
      data: roles,
    };
  }
}
