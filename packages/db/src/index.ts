import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

function createPrismaClient(): PrismaClient {
  const logLevels: Prisma.LogLevel[] =
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : process.env.NODE_ENV === 'test'
        ? ['warn', 'error']
        : ['error'];

  return new PrismaClient({
    log: logLevels,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientValidationError
      ) {
        throw error;
      }

      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError ?? new Error('Operation failed after retries');
}

class PrismaManager {
  private static instance: PrismaClient | null = null;

  static get client(): PrismaClient {
    if (!PrismaManager.instance) {
      if (process.env.NODE_ENV !== 'production') {
        if (!globalForPrisma.prisma) {
          globalForPrisma.prisma = createPrismaClient();
        }
        PrismaManager.instance = globalForPrisma.prisma;
      } else {
        PrismaManager.instance = createPrismaClient();
      }
    }
    return PrismaManager.instance;
  }

  static async connect(): Promise<void> {
    const client = PrismaManager.client;
    try {
      await withRetry(() => client.$connect());
      console.log('[prisma] Database connection established');
    } catch (error) {
      console.error('[prisma] Failed to connect to database:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (PrismaManager.instance) {
      try {
        await PrismaManager.instance.$disconnect();
      } catch (error) {
        console.error('[prisma] Error during disconnect:', error);
      } finally {
        PrismaManager.instance = null;
        if (process.env.NODE_ENV !== 'production') {
          delete globalForPrisma.prisma;
        }
      }
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await PrismaManager.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

export const prisma = PrismaManager.client;

export { PrismaManager, withRetry, Prisma };

export function initializeDatabase(): Promise<void> {
  return PrismaManager.connect();
}

export async function shutdownDatabase(): Promise<void> {
  await PrismaManager.disconnect();
}

process.on('SIGINT', () => {
  PrismaManager.disconnect().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  PrismaManager.disconnect().then(() => process.exit(0));
});

export * from '@prisma/client';
export default prisma;
