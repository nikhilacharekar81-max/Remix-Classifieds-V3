import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });

    global._postgresPool.on('error', (err) => {
      const msg = String(err?.message || '');
      if (
        msg.includes('Connection terminated') ||
        msg.includes('ECONNRESET') ||
        msg.includes('57P01') ||
        msg.includes('socket hang up') ||
        msg.includes('closed')
      ) {
        // Normal idle connection termination by Cloud SQL / proxy; pool automatically cleans it up.
        return;
      }
      console.error('[DB Pool] Unexpected error on SQL client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Executes a database operation with automatic retry if a transient
 * database connection drop ("Connection terminated unexpectedly", "ECONNRESET", etc.) occurs.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err?.cause?.message || '');
      const isConnectionDrop =
        msg.includes('Connection terminated') ||
        msg.includes('ECONNRESET') ||
        msg.includes('57P01') ||
        msg.includes('EPIPE') ||
        msg.includes('socket hang up') ||
        msg.includes('closed');

      if (isConnectionDrop && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

