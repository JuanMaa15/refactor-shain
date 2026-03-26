import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import {
  CreateBookingDto,
  GetBookingsQueryDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
} from './dto';
import {
  BookingCreatedResult,
  BookingFilter,
  PublicBooking,
} from './interfaces';
import { startOfDay, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Crear ─────────────────────────────────────────────────────────────────

  async create(
    dto: CreateBookingDto,
    userId: string,
  ): Promise<BookingCreatedResult> {
    const date = new Date(dto.date);

    // Verificamos que el slot existe antes de intentar insertar
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: dto.timeSlotId },
    });

    if (!slot) throw new NotFoundException('La franja horaria no existe');
    if (!slot.isActive)
      throw new ConflictException('La franja horaria no está disponible');

    // Verificamos duplicado en la capa de servicio para devolver un error
    // legible. La restricción @@unique en BD es el seguro ante concurrencia.
    const existing = await this.prisma.booking.findUnique({
      where: {
        date_timeSlotId_userId: { date, timeSlotId: dto.timeSlotId, userId },
      },
    });

    if (existing) throw new ConflictException('Este turno ya fue reservado');

    const booking = await this.prisma.booking.create({
      data: {
        date,
        customerName: dto.customerName ?? null,
        description: dto.description ?? null,
        user: { connect: { id: userId } },
        timeSlot: { connect: { id: dto.timeSlotId } },
      },
      include: { timeSlot: { select: { hour: true } } },
    });

    return {
      date: this.formatDate(booking.date),
      hour: booking.timeSlot.hour,
      client: booking.customerName ?? null,
    };
  }

  // ─── Listar ────────────────────────────────────────────────────────────────

  async findByUser(
    userId: string,
    query: GetBookingsQueryDto,
  ): Promise<PublicBooking[]> {
    const where: Prisma.BookingWhereInput = { userId };

    const dateFilter = this.buildDateFilter(query.filter ?? 'all');
    if (dateFilter) where.date = dateFilter;

    const bookings = await this.prisma.booking.findMany({
      where,
      include: { timeSlot: { select: { id: true, hour: true } } },
      orderBy: [{ date: 'asc' }, { timeSlot: { hour: 'asc' } }],
    });

    return bookings.map((b) => this.format(b));
  }

  // ─── Actualizar ────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateBookingDto,
    userId: string,
  ): Promise<PublicBooking> {
    await this.assertOwnership(id, userId);

    const updated = await this.prisma.booking.update({
      where: { id },
      data: dto,
      include: { timeSlot: { select: { id: true, hour: true } } },
    });

    return this.format(updated);
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    userId: string,
  ): Promise<Pick<PublicBooking, 'status'>> {
    await this.assertOwnership(id, userId);

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
    });

    return { status: updated.status };
  }

  // ─── Eliminar ──────────────────────────────────────────────────────────────

  // BUG FIX del original: deleteBooking no validaba ownership.
  // Cualquier usuario autenticado podía borrar la reserva de otro.
  async delete(id: string, userId: string): Promise<void> {
    await this.assertOwnership(id, userId);
    await this.prisma.booking.delete({ where: { id } });
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private async assertOwnership(id: string, userId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.userId !== userId)
      throw new ForbiddenException(
        'No tienes permiso para modificar esta reserva',
      );
  }

  private buildDateFilter(filter: BookingFilter): Prisma.DateTimeFilter | null {
    const today = startOfDay(new Date());

    switch (filter) {
      case 'today':
        return { gte: today, lt: new Date(today.getTime() + 86_400_000) };
      case 'month':
        return { gte: startOfMonth(today), lte: endOfMonth(today) };
      case 'all':
      default:
        return null;
    }
  }

  private format(
    booking: Prisma.BookingGetPayload<{
      include: { timeSlot: { select: { id: true; hour: true } } };
    }>,
  ): PublicBooking {
    const { userId: _userId, timeSlotId: _timeSlotId, date, ...rest } = booking;

    return {
      ...rest,
      date: this.formatDate(date),
      timeSlot: {
        id: booking.timeSlot.id,
        hour: booking.timeSlot.hour,
      },
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
