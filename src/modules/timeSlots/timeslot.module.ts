import { Module } from '@nestjs/common';
import { TimeSlotController } from './timeslot.controller';
import { TimeSlotService } from './timeslot.service';

@Module({
  controllers: [TimeSlotController],
  providers: [TimeSlotService],
})
export class TimeSlotModule {}
