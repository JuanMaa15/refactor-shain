import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, MinDate } from 'class-validator';

export class UpdateTrialPeriodDto {
  @ApiProperty({
    description: 'Fecha de expiración del periodo de prueba',
    example: '2026-06-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsNotEmpty({ message: 'La fecha de expiración del periodo de prueba es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'La fecha de expiración debe ser una fecha válida' })
  @MinDate(new Date(), { message: 'La fecha de expiración debe ser en el futuro' })
  trialPeriodEndsAt!: Date;
}
