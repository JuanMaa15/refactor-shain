import {
  IsStringTrimmed,
  IsStringLowercase,
} from '@/common/validators/custom-validators';
import {
  ValidationMessages,
  ValidationRegex,
} from '@/common/validators/validation-messages';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, Matches, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'Juan',
    minLength: 2,
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('nombre'))
  @MinLength(2, ValidationMessages.minLength('nombre', 2))
  name?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
    minLength: 2,
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('apellido'))
  @MinLength(2, ValidationMessages.minLength('apellido', 2))
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Nombre de usuario único',
    example: 'jperez',
    minLength: 4,
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('username'))
  @MinLength(4, ValidationMessages.minLength('username', 4))
  @Matches(
    ValidationRegex.USERNAME,
    ValidationMessages.invalidFormat('username'),
  )
  username?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'jperez@mail.com',
  })
  @IsOptional()
  @IsStringLowercase(ValidationMessages.isString('email'))
  @IsEmail({}, ValidationMessages.isEmail())
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+573001234567',
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('teléfono'))
  @Matches(ValidationRegex.PHONE, ValidationMessages.invalidFormat('teléfono'))
  phone?: string;
}
