import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'startup_ecosystem',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export { prisma, PrismaManager, withRetry, initializeDatabase, shutdownDatabase, Prisma } from '@startup-ecosystem/db';
export type { PrismaClient } from '@startup-ecosystem/db';
export { default } from '@startup-ecosystem/db';
