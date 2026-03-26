import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ValidationMessages } from '@/common/validators/validation-messages';

export class UpdateTimeSlotDto {
  @ApiPropertyOptional({
    example: '09:00',
    description: 'Nueva franja horaria en formato HH:MM (24h)',
  })
  @IsOptional()
  @IsString(ValidationMessages.isString('hora'))
  @MaxLength(5, ValidationMessages.maxLength('hora', 5))
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora debe tener formato HH:MM (ej: 08:00, 14:30)',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  hour?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Activar o desactivar la franja horaria',
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un booleano' })
  isActive?: boolean;
}
