import { CloudinaryUploadResult } from '@/modules/business/interfaces';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    // Configurar la instancia global de Cloudinary al inicializar el servicio
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
      secure: true,
    });
  }

  async uploadImage(
    buffer: Buffer,
    folder: string = 'default',
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          // Transformación: recortar a 600x600 centrado en la cara (si hay)
          // Mismo comportamiento que el Express original
          transformation: [
            { width: 600, height: 600, crop: 'fill', gravity: 'face' },
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error('Error al subir imagen a Cloudinary', error);
            return reject(
              new InternalServerErrorException(
                'Error al procesar la imagen. Intenta nuevamente.',
              ),
            );
          }

          if (!result) {
            return reject(
              new InternalServerErrorException(
                'No se recibió respuesta de Cloudinary',
              ),
            );
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      // Convertir Buffer a Readable stream y conectarlo al upload stream
      Readable.from(buffer).pipe(uploadStream);
    });
  }
}
