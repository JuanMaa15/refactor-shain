import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@/generated/prisma/enums';
import { Roles } from '@/modules/auth/decorators';
import { RolesGuard } from '@/modules/auth/guards';
import { PlansService } from '../services/plans.service';
import { CreatePlanDto } from '@/modules/plans/dto/create-plan.dto';
import { UpdatePlanDto } from '@/modules/plans/dto/update-plan.dto';
import { Public } from '@/modules/auth/decorators';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // Público: cualquier visitante puede ver los planes disponibles
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar planes activos (público)' })
  async findAllActive() {
    return { status: 'success', data: await this.plansService.findAllActive() };
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('token_shain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Listar todos los planes' })
  async findAll() {
    return { status: 'success', data: await this.plansService.findAll() };
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un plan por ID (público)' })
  async findOne(@Param('id') id: string) {
    return { status: 'success', data: await this.plansService.findOne(id) };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('token_shain')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[ADMIN] Crear plan' })
  async create(@Body() dto: CreatePlanDto) {
    return { status: 'success', data: await this.plansService.create(dto) };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('token_shain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Actualizar plan' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return { status: 'success', data: await this.plansService.update(id, dto) };
  }
}
