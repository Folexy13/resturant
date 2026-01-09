import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    name: process.env.DB_NAME || 'restaurant_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300'),
  },
  peakHours: {
    start: parseInt(process.env.PEAK_HOURS_START || '18'),
    end: parseInt(process.env.PEAK_HOURS_END || '21'),
    maxDuration: parseInt(process.env.PEAK_HOURS_MAX_DURATION || '90'),
  },
};