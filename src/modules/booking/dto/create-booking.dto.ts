import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ValidationMessages } from '@/common/validators/validation-messages';

export class CreateBookingDto {
  @ApiProperty({
    example: '2025-06-15',
    description: 'Fecha de la reserva en formato YYYY-MM-DD',
  })
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  date: string;

  @ApiProperty({
    example: 'uuid-del-slot',
    description: 'ID de la franja horaria a reservar',
  })
  @IsUUID('4', ValidationMessages.isUUID('franja horaria'))
  timeSlotId: string;

  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Nombre del cliente',
    maxLength: 100,
  })
  @IsOptional()
  @IsString(ValidationMessages.isString('nombre del cliente'))
  @MaxLength(100, ValidationMessages.maxLength('nombre del cliente', 100))
  @Transform(({ value }: { value: string }) => value?.trim())
  customerName?: string;

  @ApiPropertyOptional({
    example: 'Corte y barba',
    description: 'Descripción del servicio',
    maxLength: 500,
  })
  @IsOptional()
  @IsString(ValidationMessages.isString('descripción'))
  @MaxLength(500, ValidationMessages.maxLength('descripción', 500))
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;
}
