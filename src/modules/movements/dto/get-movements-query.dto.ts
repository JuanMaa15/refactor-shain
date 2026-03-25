import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { MovementType } from '@/generated/prisma/enums';
import { FilterDate } from '../interfaces';

/**
 * DTO para los query params del endpoint GET /movements/user/:userId
 * y GET /movements/business/:businessId
 *
 * En el Express original estos params venían sin validación — cualquier
 * string llegaba directo al query builder. Aquí los validamos explícitamente.
 */
export class GetMovementsQueryDto {
  @ApiPropertyOptional({ enum: MovementType })
  @IsOptional()
  @IsEnum(MovementType, { message: 'Tipo de movimiento inválido' })
  type?: MovementType;

  @ApiPropertyOptional({
    enum: ['sevenDays', 'month', 'quarter', 'year', 'other', 'all'],
    description: 'Filtro de fecha predefinido',
  })
  @IsOptional()
  @IsString()
  filterDate?: FilterDate;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Fecha inicio (solo cuando filterDate=other)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha inválido (from)' })
  from?: string;

  @ApiPropertyOptional({
    example: '2025-01-31',
    description: 'Fecha fin (solo cuando filterDate=other)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha inválido (to)' })
  to?: string;
}

export class GetLastDaysQueryDto {
  @ApiPropertyOptional({
    example: '7',
    description: 'Número de días hacia atrás',
  })
  @IsOptional()
  @IsString()
  days?: string;
}
