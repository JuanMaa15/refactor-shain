import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@/generated/prisma/enums';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { RolesGuard } from '@/modules/auth/guards';
import { CurrentUser as CurrentUserInterface } from '@/modules/auth/interfaces';
import { MovementService } from './services/movement.service';
import { MovementSummaryService } from './services/movement-summary.service';
import {
  CreateMovementDto,
  GetLastDaysQueryDto,
  GetMovementsQueryDto,
  UpdateMovementDto,
} from './dto';

@ApiTags('Movements')
@ApiCookieAuth('token_shain')
@Controller('movements')
export class MovementsController {
  constructor(
    private readonly movementService: MovementService,
    private readonly movementSummaryService: MovementSummaryService,
  ) {}

  // POST /movements
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar movimiento (ingreso o egreso)' })
  @ApiResponse({
    status: 201,
    description: 'Movimiento registrado correctamente',
  })
  async create(
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    const movement = await this.movementService.create(
      dto,
      user.id,
      user.businessId!,
    );

    return {
      status: 'success',
      message: 'Movimiento registrado correctamente.',
      data: {
        type: movement.type,
        description: movement.description,
        value: movement.value,
        date: movement.date,
      },
    };
  }

  // PATCH /movements/:id
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar movimiento' })
  @ApiResponse({ status: 200, description: 'Movimiento actualizado' })
  @ApiResponse({ status: 403, description: 'No tienes permiso' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovementDto,
    @CurrentUser('id') userId: string,
  ) {
    const movement = await this.movementService.update(id, dto, userId);

    return {
      status: 'success',
      code: 200,
      data: movement,
    };
  }

  // DELETE /movements/:id
  // BUG FIX: El original hacía res.status(204) sin .send() → cliente sin respuesta.
  // @HttpCode(NO_CONTENT) + void resuelve esto correctamente en NestJS.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar movimiento' })
  @ApiResponse({ status: 204, description: 'Eliminado correctamente' })
  @ApiResponse({ status: 403, description: 'No tienes permiso' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.movementService.delete(id, userId);
  }

  // GET /movements/summary/:userId
  @Get('summary/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resumen estadístico del usuario' })
  @ApiResponse({ status: 200, description: 'Resumen obtenido correctamente' })
  async getSummary(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    const summary = await this.movementSummaryService.getSummaryAndStatistics({
      date: new Date(),
      userId,
      businessId: user.businessId ?? null,
      role: user.role.name,
      goalUser: Number(user.goal ?? 0),
    });

    return {
      status: 'success',
      code: 200,
      data: summary,
    };
  }

  // GET /movements/last?days=7
  @Get('last')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Movimientos de los últimos N días' })
  async getMovementsLastDays(
    @Query() query: GetLastDaysQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    const days = query.days ? parseInt(query.days, 10) : 7;
    const movements = await this.movementService.findLastDays(userId, days);

    return {
      status: 'success',
      code: 200,
      data: movements,
    };
  }

  // GET /movements/user/:userId
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Movimientos de un usuario con filtros' })
  async getByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: GetMovementsQueryDto,
  ) {
    const result = await this.movementService.findByUser(userId, query);

    return {
      status: 'success',
      code: 200,
      data: result,
    };
  }

  // GET /movements/business/:businessId
  @Get('business/:businessId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[BUSINESS_OWNER] Movimientos del negocio agrupados por día',
  })
  async getByBusiness(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: GetMovementsQueryDto,
  ) {
    const result = await this.movementService.findByBusiness(businessId, query);

    return {
      status: 'success',
      code: 200,
      data: result,
    };
  }

  // GET /movements/:id
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un movimiento por ID' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const movement = await this.movementService.findOne(id);

    return {
      status: 'success',
      code: 200,
      data: movement,
    };
  }
}
