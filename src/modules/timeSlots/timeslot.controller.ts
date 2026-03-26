import {
  Body,
  Controller,
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
import { TimeSlotService } from './timeslot.service';
import {
  CreateTimeSlotDto,
  GetAvailableHoursDto,
  UpdateTimeSlotDto,
} from './dto';

@ApiTags('Time Slots')
@ApiCookieAuth('token_shain')
@Controller('timeslots')
export class TimeSlotController {
  constructor(private readonly TimeSlotService: TimeSlotService) {}

  // GET /timeslots/available?date=YYYY-MM-DD
  // Respeta el contrato original: SERVICE_PROVIDER y BUSINESS_OWNER pueden consultar
  @Get('available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER, UserRole.BUSINESS_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener franjas horarias disponibles por fecha' })
  @ApiResponse({
    status: 200,
    description: 'Listado de horas con disponibilidad',
  })
  async getAvailableHours(
    @Query() query: GetAvailableHoursDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    const hours = await this.TimeSlotService.getAvailableHours(query, user.id);

    return {
      status: 'success',
      code: 200,
      data: hours,
    };
  }

  // GET /timeslots
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Listar todas las franjas horarias activas',
  })
  @ApiResponse({ status: 200, description: 'Listado de franjas horarias' })
  async findAll() {
    const timeSlots = await this.TimeSlotService.findAllActive();

    return {
      status: 'success',
      code: 200,
      data: timeSlots,
    };
  }

  // POST /timeslots
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[ADMIN] Crear franja horaria' })
  @ApiResponse({ status: 201, description: 'Franja horaria creada' })
  async create(@Body() dto: CreateTimeSlotDto) {
    const timeSlot = await this.TimeSlotService.create(dto);

    return {
      status: 'success',
      code: 201,
      data: timeSlot,
    };
  }

  // PATCH /timeslots/:id
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Actualizar franja horaria' })
  @ApiResponse({ status: 200, description: 'Franja horaria actualizada' })
  @ApiResponse({ status: 404, description: 'Franja horaria no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimeSlotDto,
  ) {
    const timeSlot = await this.TimeSlotService.update(id, dto);

    return {
      status: 'success',
      code: 200,
      data: timeSlot,
    };
  }
}
