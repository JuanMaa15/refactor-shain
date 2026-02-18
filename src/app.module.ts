import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/validation-schema.config';
import {
  app,
  cloudinaryConfig,
  database,
  email,
  jwtConfig,
} from './config/globals.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [app, database, jwtConfig, cloudinaryConfig, email],
      validate: (config: Record<string, unknown>) =>
        validationSchema.parse(config),

      //Validacion con Joi
      /* validationSchema,
      validationOptions: {
        abortEarly: true, // Muestra todos los errores
      }, */
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests
      },
      {
        name: 'login',
        ttl: 900000, // 15 minutos
        limit: 7, // 7 intentos
      },
    ]),

    // Base de datos
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
