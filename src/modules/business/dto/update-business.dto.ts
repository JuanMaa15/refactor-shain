import { ValidationMessages } from '@/common/validators/validation-messages';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateBusinessDto {
  /* @ApiPropertyOptional({
    description: 'Nombre del negocio',
    example: 'Peluquería Estilo',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('nombre'))
  @MinLength(2, ValidationMessages.minLength('nombre', 2))
  @MaxLength(100, ValidationMessages.maxLength('nombre', 100))
  name?: string;
 */
  @ApiPropertyOptional({
    description: 'Meta mensual de ventas del negocio (en pesos)',
    example: 10000000,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'La meta debe ser un número' })
  @Min(0, { message: 'La meta no puede ser negativa' })
  goal?: number;

  /* @ApiPropertyOptional({
    description: 'Tipo de negocio',
    example: 'Peluquería',
    maxLength: 50,
  })
  @IsOptional()
  @IsString(ValidationMessages.isString('tipo'))
  @MaxLength(50, ValidationMessages.maxLength('tipo', 50))
  type?: string; */

  @ApiPropertyOptional({
    description: 'Descripción del negocio',
    example: 'Peluquería especializada en cortes modernos',
    maxLength: 500,
  })
  @IsOptional()
  @IsString(ValidationMessages.isString('descripción'))
  @MaxLength(500, ValidationMessages.maxLength('descripción', 500))
  description?: string;
}
