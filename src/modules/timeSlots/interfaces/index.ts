import { TimeSlot } from '@/generated/prisma/client';

export type PublicTimeSlot = Omit<TimeSlot, 'createdAt' | 'updatedAt'>;

export interface AvailableTimeSlot {
  id: string;
  hour: string;
  available: boolean;
}
