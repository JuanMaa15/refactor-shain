import { Module } from '@nestjs/common';
import { MovementsController } from './movement.controller';
import { MovementService } from './services/movement.service';
import { MovementSummaryService } from './services/movement-summary.service';
import { MovementRepository } from './movement.repository';

@Module({
  controllers: [MovementsController],
  providers: [MovementRepository, MovementService, MovementSummaryService],
  exports: [MovementService],
})
export class MovementsModule {}
