import { Booking, TimeSlot } from '@/generated/prisma/client';

// ─── Tipo público ─────────────────────────────────────────────────────────────

export type PublicBooking = Omit<Booking, 'userId' | 'timeSlotId' | 'date'> & {
  date: string;
  timeSlot: PublicTimeSlotEmbed;
};

export type PublicTimeSlotEmbed = Pick<TimeSlot, 'id' | 'hour'>;

export interface BookingCreatedResult {
  date: string;
  hour: string;
  client: string | null;
}

// ─── Filtros de listado ───────────────────────────────────────────────────────

export type BookingFilter = 'today' | 'month' | 'all';
