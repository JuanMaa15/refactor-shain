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

/**
 * REGEXES REUTILIZABLES
 *
 * Patrones de regex comunes para validaciones
 */
export class ValidationRegex {
  /**
   * Username: letras, números, guión, guión bajo
   * Ejemplo: "juan-perez_123"
   */
  static readonly USERNAME = /^[a-zA-Z0-9_-]+$/;

  /**
   * Password básico: al menos una letra y un número
   * Ejemplo: "password123"
   */
  static readonly PASSWORD_BASIC = /^(?=.*[A-Za-z])(?=.*\d)/;

  /**
   * Password fuerte: mayúscula, minúscula, número, carácter especial
   * Ejemplo: "Password123!"
   */
  static readonly PASSWORD_STRONG =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

  /**
   * Solo letras (con tildes y ñ)
   * Ejemplo: "José María"
   */
  static readonly ONLY_LETTERS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  /**
   * Solo números
   * Ejemplo: "123456"
   */
  static readonly ONLY_NUMBERS = /^\d+$/;

  /**
   * Teléfono (formato internacional opcional)
   * Ejemplo: "+573001234567" o "3001234567"
   */
  static readonly PHONE = /^(\+)?[0-9]{10,15}$/;

  /**
   * URL
   * Ejemplo: "https://example.com"
   */
  static readonly URL =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+/~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+/.~#?&//=]*)$/;
}
