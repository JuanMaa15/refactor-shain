import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { PlanType } from '@/generated/prisma/enums';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @ApiProperty({ example: 'Plan Emprendedor' })
  @IsString({ message: 'El nombre del plan debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre del plan es obligatorio' })
  name: string;

  @ApiProperty({ enum: PlanType, example: PlanType.MONTHLY })
  @IsEnum(PlanType, { message: 'El tipo de plan debe ser MONTHLY o ANNUAL' })
  type: PlanType;

  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio por usuario debe ser numérico' })
  @IsPositive({ message: 'El precio por usuario debe ser mayor a cero' })
  pricePerUser: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber({}, { message: 'El número máximo de usuarios debe ser numérico' })
  @Min(1, { message: 'El número máximo de usuarios debe ser al menos 1' })
  maxUsers: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un booleano' })
  isActive?: boolean;
}
