import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EmailService } from './email.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, EmailService],
})
export class PaymentsModule {}
