import { z } from 'zod';

export const validationSchema = z
  .object({
    // Application
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.number().default(3000),
    API_PREFIX: z.string().default('api'),

    // Database - Prisma 7
    DATABASE_URL: z.string(),
    DATABASE_URL_DIRECT: z.string().optional(), // Para Prisma Accelerate

    // JWT
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default('1d'),
    JWT_REFRESH_SECRET: z.string(),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Security
    SALT_ROUNDS: z.number().default(10),

    // CORS
    ALLOWED_FRONTEND_URL: z.string(),

    // Email
    RESEND_API_KEY: z.string().optional(),
    RESEND_EMAIL: z.email(),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),

    // Rate Limiting
    THROTTLE_TTL: z.number().default(60000),
    THROTTLE_LIMIT: z.number().default(100),
    THROTTLE_LOGIN_TTL: z.number().default(900000),
    THROTTLE_LOGIN_LIMIT: z.number().default(7),
  })
  .refine(
    (data) =>
      data.NODE_ENV !== 'production' || data.RESEND_API_KEY !== undefined, //Debe ser true para que pase la validación
    {
      message: 'RESEND_API_KEY is required in production',
      path: ['RESEND_API_KEY'],
    },
  );
