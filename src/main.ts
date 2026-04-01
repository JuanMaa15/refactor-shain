import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // SECURITY - Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  //CORS
  app.enableCors({
    origin: configService.get('app.cors.origin') as string,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    '/api/v1/transactions/webhook',
    express.raw({ type: 'application/json' }),
  );

  //GLOBAL PREFIX
  const apiPrefix = configService.get('app.apiPrefix') as string;
  app.setGlobalPrefix(apiPrefix);

  // VERSIONING (opcional pero profesional)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  //GLOBAL PIPES - validacion autmatica
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en DTO
      forbidNonWhitelisted: true, // Rechaza propiedades extra
      transform: true, // Transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  //Middlewares
  app.use(cookieParser());
  app.use(compression());

  // SWAGGER - Documentación automática
  // ============================================
  if (configService.get('app.nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SHAIN API')
      .setDescription('Sistema de Gestión Financiera - API Documentation')
      .setVersion('2.0')
      .addBearerAuth()
      .addCookieAuth('token_shain')
      .addTag('Auth', 'Autenticación y autorización')
      .addTag('Users', 'Gestión de usuarios')
      .addTag('Business', 'Gestión de negocios')
      .addTag('Movements', 'Movimientos financieros')
      .addTag('Bookings', 'Sistema de reservas')
      .addTag('TimeSlots', 'Gestión de horarios')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // PRISMA - Shutdown hooks
  app.enableShutdownHooks();

  const port = configService.get('app.port') as number;
  await app.listen(port);

  console.log(`
  🚀 SHAIN API is running!
  
  📚 Documentation: http://localhost:${port}/${apiPrefix}/docs
  🌐 API Endpoint:  http://localhost:${port}/${apiPrefix}
  🔧 Environment:   ${configService.get('app.nodeEnv')}
  `);
}
bootstrap();
