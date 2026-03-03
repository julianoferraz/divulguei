import { Pool } from 'pg';
import Redis from 'ioredis';
import OpenAI from 'openai';

// Database
export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'divulguei',
  user: process.env.DB_USER || 'divulguei',
  password: process.env.DB_PASSWORD || 'divulguei123',
  max: 10,
});

// Redis
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 3,
});

// OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function query(text: string, params?: any[]) {
  return db.query(text, params);
}
