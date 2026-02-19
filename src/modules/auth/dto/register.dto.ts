import {
  IsStringLowercase,
  IsStringTrimmed,
  NoWhitespaces,
} from '@/common/validators/custom-validators';
import { ValidationMessages } from '@/common/validators/validation-messages';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    minLength: 2,
  })
  @IsStringTrimmed(ValidationMessages.isString('nombre'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('nombre'))
  @MinLength(2, ValidationMessages.minLength('nombre', 2))
  name: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Perez',
    minLength: 2,
  })
  @IsStringTrimmed(ValidationMessages.isString('apellido'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('apellido'))
  @MinLength(2, ValidationMessages.minLength('apellido', 2))
  lastName: string;

  @ApiProperty({
    description: 'Nombre del usuario único',
    example: 'jperez',
    minLength: 4,
  })
  @IsString(ValidationMessages.isString('username'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('username'))
  @MinLength(4, ValidationMessages.minLength('username', 4))
  @NoWhitespaces(
    ValidationMessages.custom('El username no puede contener espacios'),
  )
  username: string;

  @ApiProperty({
    description: 'Correo Electrónico',
    example: 'jperez@jp.com',
  })
  @IsStringLowercase(ValidationMessages.isString('email'))
  @IsEmail({}, ValidationMessages.isEmail())
  @IsNotEmpty(ValidationMessages.isNotEmpty('email'))
  email: string;
}
