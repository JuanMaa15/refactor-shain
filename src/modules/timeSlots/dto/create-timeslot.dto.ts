import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { ValidationMessages } from '@/common/validators/validation-messages';

export class CreateTimeSlotDto {
  @ApiProperty({
    example: '08:00',
    description: 'Franja horaria en formato HH:MM (24h)',
  })
  @IsString(ValidationMessages.isString('hora'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('hora'))
  @MaxLength(5, ValidationMessages.maxLength('hora', 5))
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora debe tener formato HH:MM (ej: 08:00, 14:30)',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  hour: string;
}
