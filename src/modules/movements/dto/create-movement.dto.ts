import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { MovementType, FrequencyType } from '@/generated/prisma/enums';
import { ValidationMessages } from '@/common/validators/validation-messages';

export class CreateMovementDto {
  @ApiProperty({
    enum: MovementType,
    example: MovementType.INCOME,
    description: 'Tipo de movimiento: INCOME (ingreso) o EXPENSE (egreso)',
  })
  @IsEnum(MovementType, ValidationMessages.isEnum('tipo de movimiento'))
  type: MovementType;

  @ApiPropertyOptional({
    enum: FrequencyType,
    example: FrequencyType.NEW,
    description: 'Frecuencia del movimiento',
  })
  @IsOptional()
  @IsEnum(FrequencyType, ValidationMessages.isEnum('frecuencia'))
  frequency?: FrequencyType;

  @ApiProperty({
    example: 150000,
    description: 'Valor del movimiento en pesos',
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'El valor debe ser un número' })
  @Min(0.01, { message: 'El valor debe ser mayor a 0' })
  // Transform: el cliente puede enviar string desde FormData → lo convertimos
  @Transform(({ value }) => Number(value))
  value: number;

  /**
   * BUG CORREGIDO del original:
   * En el Express original `description` era obligatoria solo para egresos,
   * pero el schema Zod lo validaba en `.refine()` DESPUÉS de parsear.
   * En class-validator hacemos lo mismo con @ValidateIf: el decorador
   * @IsNotEmpty solo se activa cuando type === EXPENSE.
   */
  @ApiPropertyOptional({
    example: 'Compra de insumos',
    description: 'Descripción (obligatoria para egresos)',
    maxLength: 500,
  })
  @ValidateIf((o: CreateMovementDto) => o.type === MovementType.EXPENSE)
  @IsNotEmpty(ValidationMessages.isNotEmpty('descripción'))
  @IsOptional()
  @IsString(ValidationMessages.isString('descripción'))
  @MaxLength(500, ValidationMessages.maxLength('descripción', 500))
  description?: string;

  @ApiProperty({
    example: '2025-06-15',
    description: 'Fecha del movimiento en formato YYYY-MM-DD',
  })
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  date: string;
}
