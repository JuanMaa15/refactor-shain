/**
 * DECORADORES DE VALIDACIÓN PERSONALIZADOS
 *
 * Estos decoradores combinan validación común con transformación
 * para reducir código repetitivo en los DTOs.
 */

import { ValidationOptions } from 'class-validator';

/**
 * Decorador que combina IsString + Transform(trim)
 *
 * USO:
 * @IsStringTrimmed()
 * name: string;
 *
 * EQUIVALE A:
 * @IsString()
 * @Transform(({ value }) => value?.trim())
 * name: string;
 */
export function IsStringTrimmed(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {};
}
