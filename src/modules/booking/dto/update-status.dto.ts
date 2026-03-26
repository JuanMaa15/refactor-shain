import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from '@/generated/prisma/enums';
import { ValidationMessages } from '@/common/validators/validation-messages';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    example: BookingStatus.IN_PROGRESS,
    description: 'Nuevo estado de la reserva',
  })
  @IsEnum(BookingStatus, ValidationMessages.isEnum('estado'))
  status: BookingStatus;
}
