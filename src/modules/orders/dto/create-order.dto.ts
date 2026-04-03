import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '8f4c1e07-4f25-4ef0-913d-425dc2b8fa4c' })
  @IsUUID('4', { message: 'planId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'planId es obligatorio' })
  planId: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString({ message: 'El nombre debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @ApiProperty({ example: 'juan.perez@mail.com' })
  @IsEmail({}, { message: 'El correo no es válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsPositive({ message: 'La cantidad de usuarios debe ser mayor a cero' })
  @Min(1, { message: 'La cantidad de usuarios debe ser al menos 1' })
  quantityUsers: number;
}
