import { IsEqualTo } from '@/common/validators/custom-validators';
import {
  ValidationMessages,
  ValidationRegex,
} from '@/common/validators/validation-messages';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * DTO para cambiar contraseña (usuario ya autenticado)
 *
 * Requiere:
 * - Contraseña actual (para verificar identidad)
 * - Nueva contraseña
 * - Confirmación de nueva contraseña
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'passwor$d123!',
  })
  @IsString(ValidationMessages.isString('contraseña'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('contraseña'))
  currentPassword: string;

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
