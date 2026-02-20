/**
 * DECORADORES DE VALIDACIÓN PERSONALIZADOS
 *
 * Estos decoradores combinan validación común con transformación
 * para reducir código repetitivo en los DTOs.
 */

import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

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
  return function (object: object, propertyName: string) {
    Transform(({ value }) => (value as string)?.trim())(object, propertyName);

    registerDecorator({
      name: 'isStringTrimmed',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string';
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser un texto`;
        },
      },
    });
  };
}

/**
 * Decorador que valida si contiene espacios
 *
 * USO:
 * @NoWithespaces()
 * username: string;
 *
 */
export function NoWhitespaces(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noWhitespaces',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (value as string)?.includes(' ');
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} no puede contener espacios`;
        },
      },
    });
  };
}

/**
 * Decorador que combina IsString + Transform(trim + toLowerCase)
 * Útil para emails, usernames, etc.
 *
 * USO:
 * @IsStringLowercase()
 * username: string;
 *
 * Input: "  JUANP  "
 * Output: "juanp"
 */
export function IsStringLowercase(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    // Transform: trim + lowercase
    Transform(({ value }) => (value as string)?.trim().toLowerCase())(
      object,
      propertyName,
    );

    // Validar
    registerDecorator({
      name: 'isStringLowercase',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string';
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser un texto`;
        },
      },
    });
  };
}

/**
 * Decorador para validar si la constraseñas coiniden
 *
 * USO:
 * @IsEqualTo()
 * username: string;
 *

 */

export function IsEqualTo(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEqualTo',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as string[];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return typeof value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as string[];
          return `${args.property} debe ser igual a ${relatedPropertyName}`;
        },
      },
    });
  };
}
