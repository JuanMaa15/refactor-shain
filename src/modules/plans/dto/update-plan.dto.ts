import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';
import { PlanType } from '@/generated/prisma/enums';
import { Type } from 'class-transformer';

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Plan Avanzado' })
  @IsOptional()
  @IsString({ message: 'El nombre del plan debe ser una cadena' })
  name?: string;

  @ApiPropertyOptional({ enum: PlanType, example: PlanType.ANNUAL })
  @IsOptional()
  @IsEnum(PlanType, { message: 'El tipo de plan debe ser MONTHLY o ANNUAL' })
  type?: PlanType;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio por usuario debe ser numérico' })
  @IsPositive({ message: 'El precio por usuario debe ser mayor a cero' })
  pricePerUser?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El número máximo de usuarios debe ser numérico' })
  @Min(1, { message: 'El número máximo de usuarios debe ser al menos 1' })
  maxUsers?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un booleano' })
  isActive?: boolean;
}
