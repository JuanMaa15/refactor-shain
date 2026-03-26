import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class GetAvailableHoursDto {
  @ApiProperty({
    example: '2025-06-15',
    description: 'Fecha para consultar disponibilidad (formato YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  date: string;
}
