import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BookingFilter } from '@/modules/booking/interfaces';

export class GetBookingsQueryDto {
  @ApiPropertyOptional({
    enum: ['today', 'month', 'all'],
    example: 'today',
    description: 'Filtro de fecha: today | month | all (default: all)',
  })
  @IsOptional()
  @IsEnum(['today', 'month', 'all'] as const, {
    message: 'El filtro debe ser today, month o all',
  })
  filter?: BookingFilter;
}
