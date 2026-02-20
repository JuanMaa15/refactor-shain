export class ValidationMessages {
  /**
   * Mensaje para validación @IsString
   * @param field - Nombre del campo en minúsculas
   */
  static isString(field: string): { message: string } {
    return { message: `${field} debe ser un texto` };
  }

  /**
   * Mensaje para validsación @IsNotEmpty
   * @param field - Nombre del campo en minúsculas
   */
  static isNotEmpty(field: string): { message: string } {
    return { message: `El ${field} es obligatorio` };
  }

  /**
   * Mensaje para validación @IsEmail
   */
  static isEmail(): { message: string } {
    return { message: 'El email no es válido' };
  }

  /**
   * Mensaje para validación @MinLength
   * @param field - Nombre del campo
   * @param min - Longitud mínima
   */
  static minLength(field: string, min: number): { message: string } {
    return { message: `El ${field} debe tener al menos ${min} caracteres` };
  }

  /**
   * Mensaje para validación @MaxLength
   * @param field - Nombre del campo
   * @param max - Longitud máxima
   */
  static maxLength(field: string, max: number): { message: string } {
    return { message: `El ${field} no puede tener más de ${max} caracteres` };
  }

  /**
   * Mensaje para validación @IsEnum
   * @param field - Nombre del campo
   */
  static isEnum(field: string): { message: string } {
    return { message: `El ${field} no es válido` };
  }

  /**
   * Mensaje para validación @Matches con password fuerte
   */
  static strongPasswordFormat(): { message: string } {
    return {
      message:
        'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial',
    };
  }

  /**
   * Mensaje cuando las contraseñas no coinciden
   */
  static passwordsDoNotMatch(): string {
    return 'Las contraseñas no coinciden';
  }

  /**
   * Mensaje cuando el campo debe ser único
   * @param field - Nombre del campo
   */
  static mustBeUnique(field: string): string {
    return `El ${field} ya está en uso`;
  }

  /**
   * Mensaje personalizado
   * @param message - mensaje personalizado
   */
  static custom(message: string): { message: string } {
    return { message };
  }

  /**
   * Mensaje para cuando el formato del telefono no es valido
   * @param field - campo
   */
  static invalidFormat(field: string): { message: string } {
    return { message: `El formato del ${field} no es valido` };
  }
}
