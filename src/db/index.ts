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
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('[DB Pool] Unexpected error on idle SQL pool client:', err?.message || err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Executes a database operation with automatic single retry if a transient
 * database connection drop ("Connection terminated unexpectedly", "ECONNRESET", etc.) occurs.
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const msg = String(err?.message || err?.cause?.message || '');
    const isConnectionDrop =
      msg.includes('Connection terminated unexpectedly') ||
      msg.includes('ECONNRESET') ||
      msg.includes('57P01') ||
      msg.includes('EPIPE') ||
      msg.includes('socket hang up');

    if (isConnectionDrop) {
      console.warn('[DB Pool] Transient connection drop detected. Retrying query...', msg);
      await new Promise((resolve) => setTimeout(resolve, 150));
      return await fn();
    }
    throw err;
  }
}

