import { IsStringTrimmed } from '@/common/validators/custom-validators';
import { ValidationMessages } from '@/common/validators/validation-messages';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

/**
 * DTO para renovar access token usando refresh token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token para obtener nuevo access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsStringTrimmed(ValidationMessages.isString('refresh token'))
  @IsNotEmpty(ValidationMessages.isNotEmpty('refresh token'))
  refreshToken: string;
}
