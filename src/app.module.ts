import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/validation-schema.config';
import {
  app,
  cloudinaryConfig,
  cookie,
  database,
  email,
  jwtConfig,
  payments,
} from './config/globals.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BusinessModule } from './modules/business/business.module';
import { CloudinaryModule } from './modules/storage/cloudinary.module';
import { MovementsModule } from './modules/movements/movement.module';
import { RoleModule } from './modules/role/role.module';
import { TimeSlotModule } from '@/modules/timeSlots/timeslot.module';
import { BookingModule } from '@/modules/booking/booking.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { PlansModule } from '@/modules/plans/plans.module';
import { OrdersModule } from '@/modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        app,
        database,
        jwtConfig,
        cloudinaryConfig,
        email,
        payments,
        cookie,
      ],
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

    // Módulos
    AuthModule,
    UserModule,
    BusinessModule,
    CloudinaryModule,
    MovementsModule,
    TimeSlotModule,
    BookingModule,
    RoleModule,
    PlansModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
