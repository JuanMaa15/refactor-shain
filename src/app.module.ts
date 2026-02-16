import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import {
  app,
  cloudinaryConfig,
  database,
  email,
  jwtConfig,
} from './config/globals.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [app, database, jwtConfig, cloudinaryConfig, email],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
