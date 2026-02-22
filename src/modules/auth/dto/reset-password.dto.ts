import {
  IsEqualTo,
  IsStringTrimmed,
} from '@/common/validators/custom-validators';
import {
  ValidationMessages,
  ValidationRegex,
} from '@/common/validators/validation-messages';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * DTO para resetear contraseña con token
 *
 * Requiere:
 * - Token de reset (enviado por email)
 * - Nueva contraseña
 * - Confirmación de contraseña
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset enviado por email',
    example: 'a7f3d9c2e1b4f8a6c9d2e5f8b1c4d7e0',
  })
  @IsStringTrimmed(ValidationMessages.isString('token'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('token'))
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'passwor$d123!',
  })
  @IsString(ValidationMessages.isString('contraseña'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('contraseña'))
  @MinLength(8, ValidationMessages.minLength('contraseña', 8))
  @Matches(
    ValidationRegex.PASSWORD_STRONG,
    ValidationMessages.strongPasswordFormat(),
  )
  password: string;

  @ApiProperty({
    description: 'Confirmar contraseña',
    example: 'passwor$d123!',
  })
  @IsString(ValidationMessages.isString('contraseña'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('contraseña'))
  @IsEqualTo('password', {
    message: ValidationMessages.passwordsDoNotMatch(),
  })
  confirmPassword: string;
}
