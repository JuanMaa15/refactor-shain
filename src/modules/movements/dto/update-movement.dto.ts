import { PartialType } from '@nestjs/swagger';
import { CreateMovementDto } from './create-movement.dto';

/**
 * PartialType de NestJS/Swagger:
 * - Hace todos los campos opcionales
 * - Hereda validaciones y decoradores @ApiProperty
 * - Mantiene consistencia automática con CreateMovementDto
 *
 * Esto elimina la duplicación que existía en el Express original
 * donde createAndUpdate era el mismo schema para ambas operaciones.
 */
export class UpdateMovementDto extends PartialType(CreateMovementDto) {}
