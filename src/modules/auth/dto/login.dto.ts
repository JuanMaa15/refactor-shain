import { IsStringTrimmed } from '@/common/validators/custom-validators';
import { ValidationMessages } from '@/common/validators/validation-messages';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

/**
 * DTO para login de usuarios
 *
 * Acepta tanto username como email
 */
export class LoginDto {
  @ApiProperty({
    description: 'Username o email del usuario',
    example: 'jperez',
  })
  @IsStringTrimmed(ValidationMessages.isString('username'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('username'))
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'passwor$d123!',
  })
  @IsStringTrimmed(ValidationMessages.isString('contraseña'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('contraseña'))
  password: string;
}
