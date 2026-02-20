import {
  IsStringLowercase,
  IsStringTrimmed,
  NoWhitespaces,
} from '@/common/validators/custom-validators';
import { ValidationMessages } from '@/common/validators/validation-messages';
import { UserRole } from '@/generated/prisma/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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

  @ApiProperty({
    description:
      'Contraseña (minimo 8 caracteres, debe incluir letras y números)',
    example: 'SecurePassword123',
    minLength: 8,
  })
  @IsString(ValidationMessages.isString('contraseña'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('contraseña'))
  @MinLength(8, ValidationMessages.minLength('contraseña', 8))
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
    ValidationMessages.strongPasswordFormat(),
  )
  password: string;

  @ApiProperty({
    description: 'Confirmación de la contraseñas',
    example: 'SecurePassword123',
    minLength: 8,
  })
  @IsString(ValidationMessages.isString('Confirmación contraseña'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('Confirmación contraseña'))
  @MinLength(8, ValidationMessages.minLength('Confirmación contraseña', 8))
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
    ValidationMessages.strongPasswordFormat(),
  )
  confirmPassword: string;

  @ApiProperty({
    description: 'Rol del usuario',
    example: UserRole.BUSINESS_OWNER,
  })
  @IsEnum(UserRole, ValidationMessages.isEnum('role'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('role'))
  role: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono (opcional)',
    example: '+573001234567',
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('teléfono'))
  @Matches(/^(\+)?[0-9]{10,15}$/, ValidationMessages.invalidFormat('teléfono'))
  phone?: string;

  @ApiPropertyOptional({
    description:
      'Código de negocio (OBLIGATORIO si el rol es SERVICE_PROVIDER)',
    example: 'd4f7a3b9c2e1',
  })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('código de negocio'))
  businessCode?: string;
}
