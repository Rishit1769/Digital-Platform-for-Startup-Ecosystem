import '../config/env';
import mysql from 'mysql2/promise';

function getPoolConfig(): mysql.PoolOptions {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const parsed = new URL(databaseUrl);

    return {
      host: decodeURIComponent(parsed.hostname || 'localhost'),
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'startup_ecosystem'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'startup_ecosystem',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

export const pool = mysql.createPool(getPoolConfig());

export { prisma, PrismaManager, withRetry, initializeDatabase, shutdownDatabase, Prisma } from '@startup-ecosystem/db';
export type { PrismaClient } from '@startup-ecosystem/db';
export { default } from '@startup-ecosystem/db';
