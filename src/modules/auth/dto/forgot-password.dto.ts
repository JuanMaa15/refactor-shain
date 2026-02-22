import { IsStringLowercase } from '@/common/validators/custom-validators';
import { ValidationMessages } from '@/common/validators/validation-messages';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO para solicitar reset de contraseña
 *
 * Solo requiere el email del usuario
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'Fb3tU@example.com',
  })
  @IsStringLowercase(ValidationMessages.isString('email'))
  @IsEmail({}, ValidationMessages.isEmail())
  @IsNotEmpty(ValidationMessages.isNotEmpty('email'))
  email: string;
}
