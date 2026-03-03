import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://divulguei:divulguei_dev_password@localhost:5432/divulguei',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  BOT_PHONE_NUMBER: process.env.BOT_PHONE_NUMBER || '',
  ADMIN_PHONE: process.env.ADMIN_PHONE || '',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
