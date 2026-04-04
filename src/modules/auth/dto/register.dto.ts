import {
  IsEqualTo,
  IsStringLowercase,
  IsStringTrimmed,
  NoWhitespaces,
} from '@/common/validators/custom-validators';
import {
  ValidationMessages,
  ValidationRegex,
} from '@/common/validators/validation-messages';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

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
    description: 'Nombre de usuario único',
    example: 'jperez',
    minLength: 4,
  })
  @IsString(ValidationMessages.isString('username'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('username'))
  @MinLength(4, ValidationMessages.minLength('username', 4))
  @NoWhitespaces(
    ValidationMessages.custom('El username no puede contener espacios'),
  )
  @Matches(
    ValidationRegex.USERNAME,
    ValidationMessages.invalidFormat('username'),
  )
  username: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'jperez@jp.com',
  })
  @IsStringLowercase(ValidationMessages.isString('email'))
  @IsEmail({}, ValidationMessages.isEmail())
  @IsNotEmpty(ValidationMessages.isNotEmpty('email'))
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 8 caracteres, letras y números)',
    example: 'SecurePassword123',
    minLength: 8,
  })
  @IsString(ValidationMessages.isString('contraseña'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('contraseña'))
  @MinLength(8, ValidationMessages.minLength('contraseña', 8))
  @Matches(
    ValidationRegex.PASSWORD_BASIC,
    ValidationMessages.strongPasswordFormat(),
  )
  password: string;

  @ApiProperty({
    description: 'Confirmación de contraseña',
    example: 'SecurePassword123',
    minLength: 8,
  })
  @IsString(ValidationMessages.isString('Confirmación contraseña'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('Confirmación contraseña'))
  @MinLength(8, ValidationMessages.minLength('Confirmación contraseña', 8))
  @Matches(
    ValidationRegex.PASSWORD_BASIC,
    ValidationMessages.strongPasswordFormat(),
  )
  @IsEqualTo('password', ValidationMessages.passwordsDoNotMatch())
  confirmPassword: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+573001234567',
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('teléfono'))
  @Matches(/^(\+)?[0-9]{10,15}$/, ValidationMessages.invalidFormat('teléfono'))
  phone?: string;

  @ApiPropertyOptional({
    description:
      'ID del rol del usuario. Obligatorio para el período de prueba gratuito. Se omite si se usa entryCode.',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsUUID('4', ValidationMessages.isUUID('rol'))
  roleId?: string;

  @ApiPropertyOptional({
    description:
      'Código de negocio. Obligatorio si roleId corresponde a SERVICE_PROVIDER en el flujo de prueba.',
    example: 'd4f7a3b9c2e1',
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('código de negocio'))
  businessCode?: string;

  @ApiPropertyOptional({
    description:
      'Código de ingreso recibido por correo al adquirir una suscripción (formato SHN-XXXXXXXX). Si se proporciona, reemplaza roleId y businessCode.',
    example: 'SHN-AB12CD34',
  })
  @IsOptional()
  @IsString({ message: 'El código de ingreso debe ser una cadena de texto' })
  entryCode?: string;
}
