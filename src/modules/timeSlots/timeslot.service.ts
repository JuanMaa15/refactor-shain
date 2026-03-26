import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateTimeSlotDto,
  GetAvailableHoursDto,
  UpdateTimeSlotDto,
} from './dto';
import { AvailableTimeSlot, PublicTimeSlot } from './interfaces';

@Injectable()
export class TimeSlotService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD (solo ADMIN) ─────────────────────────────────────────────────────

  async create(dto: CreateTimeSlotDto): Promise<PublicTimeSlot> {
    const timeSlot = await this.prisma.timeSlot.create({
      data: { hour: dto.hour },
    });

    return this.format(timeSlot);
  }

  async update(id: string, dto: UpdateTimeSlotDto): Promise<PublicTimeSlot> {
    await this.findOrFail(id);

    const updated = await this.prisma.timeSlot.update({
      where: { id },
      data: dto,
    });

    return this.format(updated);
  }

  // ─── Consultas ─────────────────────────────────────────────────────────────

  async findAllActive(): Promise<PublicTimeSlot[]> {
    const slots = await this.prisma.timeSlot.findMany({
      where: { isActive: true },
      orderBy: { hour: 'asc' },
    });

    return slots.map((s) => this.format(s));
  }

  async getAvailableHours(
    dto: GetAvailableHoursDto,
    userId: string,
  ): Promise<AvailableTimeSlot[]> {
    const date = new Date(dto.date);

    // Ambas queries son independientes → paralelo
    const [activeSlots, reservedBookings] = await Promise.all([
      this.prisma.timeSlot.findMany({
        where: { isActive: true },
        orderBy: { hour: 'asc' },
      }),
      this.prisma.booking.findMany({
        where: { userId, date },
        select: { timeSlotId: true },
      }),
    ]);

    const reservedSet = new Set(reservedBookings.map((b) => b.timeSlotId));

    return activeSlots.map((slot) => ({
      id: slot.id,
      hour: slot.hour,
      available: !reservedSet.has(slot.id),
    }));
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private async findOrFail(id: string): Promise<void> {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Franja horaria no encontrada');
  }

  private format(slot: {
    id: string;
    hour: string;
    isActive: boolean;
  }): PublicTimeSlot {
    return {
      id: slot.id,
      hour: slot.hour,
      isActive: slot.isActive,
    };
  }
}
