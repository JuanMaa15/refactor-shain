import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import multer, { memoryStorage } from 'multer';
import { Observable } from 'rxjs';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class ImageUploadInterceptor implements NestInterceptor {
  private readonly upload = multer({
    storage: memoryStorage(), // Guardar en memoria como Buffer, no en disco
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
    },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: multer.FileFilterCallback,
    ) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        callback(null, true);
      } else {
        // Error tipado: Multer acepta Error en el callback
        callback(
          new UnsupportedMediaTypeException(
            'Solo se permiten imágenes PNG, JPG, WEBP o SVG.',
          ) as unknown as null,
          false,
        );
      }
    },
  }).single('image'); //El campo del formulario se llama 'image'

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    return new Observable((observer) => {
      this.upload(req, res, (error: unknown) => {
        if (error) {
          // Multer lanza este error cuando el archivo supera el límite de tamaño
          if (
            error instanceof multer.MulterError &&
            error.code === 'LIMIT_FILE_SIZE'
          ) {
            observer.error(
              new PayloadTooLargeException(
                `La imagen no puede superar ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
              ),
            );
            return;
          }

          // Errores de validación (tipo de archivo inválido) ya son HttpExceptions
          observer.error(error);
          return;
        }

        // Todo ok → continuar con el siguiente handler (el controller)
        next.handle().subscribe({
          next: (value) => observer.next(value),
          error: (err: unknown) => observer.error(err),
          complete: () => observer.complete(),
        });
      });
    });
  }
}
