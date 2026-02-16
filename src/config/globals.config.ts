import { registerAs } from '@nestjs/config';

export const app = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',

  cors: {
    origin: process.env.ALLOWED_FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },

  security: {
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    loginTtl: parseInt(process.env.THROTTLE_LOGIN_TTL || '900000', 10),
    loginLimit: parseInt(process.env.THROTTLE_LOGIN_LIMIT || '7', 10),
  },
}));

export const database = registerAs('database', () => ({
  url: process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : process.env.DATABASE_URL_LOCAL,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',

  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
}));

export const cloudinaryConfig = registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}));

export const email = registerAs('email', () => ({
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_EMAIL || 'noreply@shain.finance',
  },
}));
