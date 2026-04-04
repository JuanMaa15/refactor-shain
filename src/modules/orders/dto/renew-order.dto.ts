import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class RenewOrderDto {
  @ApiPropertyOptional({
    description:
      'ID del nuevo plan a contratar. Si no se especifica, se usa el plan de la última orden aprobada.',
    example: '8f4c1e07-4f25-4ef0-913d-425dc2b8fa4c',
  })
  @IsOptional()
  @IsUUID('4', { message: 'planId debe ser un UUID válido' })
  planId?: string;

  @ApiPropertyOptional({
    description:
      'Cantidad de usuarios para la renovación. Si no se especifica, se mantiene la cantidad anterior.',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad de usuarios debe ser un número entero' })
  @IsPositive({ message: 'La cantidad de usuarios debe ser mayor a cero' })
  @Min(1, { message: 'La cantidad de usuarios debe ser al menos 1' })
  quantityUsers?: number;
}
