import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ValidationMessages } from '@/common/validators/validation-messages';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    example: 'Carlos López',
    description: 'Nombre del cliente',
    maxLength: 100,
  })
  @IsOptional()
  @IsString(ValidationMessages.isString('nombre del cliente'))
  @MaxLength(100, ValidationMessages.maxLength('nombre del cliente', 100))
  @Transform(({ value }: { value: string }) => value?.trim())
  customerName?: string;

  @ApiPropertyOptional({
    example: 'Corte clásico',
    description: 'Descripción del servicio',
    maxLength: 500,
  })
  @IsOptional()
  @IsString(ValidationMessages.isString('descripción'))
  @MaxLength(500, ValidationMessages.maxLength('descripción', 500))
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;
}
