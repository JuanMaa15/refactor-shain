import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
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
