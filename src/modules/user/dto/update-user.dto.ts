import {
  IsStringTrimmed,
  IsStringLowercase,
} from '@/common/validators/custom-validators';
import {
  ValidationMessages,
  ValidationRegex,
} from '@/common/validators/validation-messages';
import { UserRole } from '@/generated/prisma/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan', minLength: 2 })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('nombre'))
  @MinLength(2, ValidationMessages.minLength('nombre', 2))
  name?: string;

  @ApiPropertyOptional({ example: 'Pérez', minLength: 2 })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('apellido'))
  @MinLength(2, ValidationMessages.minLength('apellido', 2))
  lastName?: string;

  @ApiPropertyOptional({ example: 'jperez', minLength: 4 })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('username'))
  @MinLength(4, ValidationMessages.minLength('username', 4))
  @Matches(
    ValidationRegex.USERNAME,
    ValidationMessages.invalidFormat('username'),
  )
  username?: string;

  @ApiPropertyOptional({ example: 'jperez@mail.com' })
  @IsOptional()
  @IsStringLowercase(ValidationMessages.isString('email'))
  @IsEmail({}, ValidationMessages.isEmail())
  email?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsStringTrimmed(ValidationMessages.isString('teléfono'))
  @Matches(ValidationRegex.PHONE, ValidationMessages.invalidFormat('teléfono'))
  phone?: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    enum: UserRole,
    example: UserRole.SERVICE_PROVIDER,
  })
  @IsOptional()
  @IsEnum(UserRole, ValidationMessages.isEnum('rol'))
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del usuario',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser true o false' })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Meta mensual de ventas del usuario',
    example: 5000000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La meta debe ser un número' })
  @IsPositive({ message: 'La meta debe ser un número positivo' })
  goal?: number;
}
