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
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/decorators';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  GetBookingsQueryDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
} from './dto';

@ApiTags('Bookings')
@ApiCookieAuth('token_shain')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingsService: BookingService) {}

  // POST /bookings
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una reserva' })
  @ApiResponse({ status: 201, description: 'Reserva creada correctamente' })
  @ApiResponse({ status: 404, description: 'Franja horaria no encontrada' })
  @ApiResponse({ status: 409, description: 'Turno ya reservado' })
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    const booking = await this.bookingsService.create(dto, userId);

    return {
      status: 'success',
      code: 201,
      data: booking,
    };
  }

  // GET /bookings?filter=today|month|all
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar reservas del usuario con filtros' })
  @ApiResponse({ status: 200, description: 'Listado de reservas' })
  async findAll(
    @Query() query: GetBookingsQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    const bookings = await this.bookingsService.findByUser(userId, query);

    return {
      status: 'success',
      code: 200,
      data: bookings,
    };
  }

  // PATCH /bookings/:id
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar datos de una reserva' })
  @ApiResponse({ status: 200, description: 'Reserva actualizada' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    const booking = await this.bookingsService.update(id, dto, userId);

    return {
      status: 'success',
      code: 200,
      data: booking,
    };
  }

  // PATCH /bookings/:id/status
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar estado de una reserva' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.bookingsService.updateStatus(id, dto, userId);

    return {
      status: 'success',
      code: 200,
      data: result,
    };
  }

  // DELETE /bookings/:id
  // BUG FIX: el original hacía res.status(204) sin .send() → cliente sin respuesta.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una reserva' })
  @ApiResponse({ status: 204, description: 'Reserva eliminada' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.bookingsService.delete(id, userId);
  }
}
