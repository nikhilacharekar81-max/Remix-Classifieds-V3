export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NEXT_PHASE !== 'phase-production-build'
  ) {
    const { ensureDatabaseSeeded } = await import('@/server/seed-postgres');
    try {
      await ensureDatabaseSeeded();
    } catch (err) {
      console.error('[Instrumentation] Startup database initialization failed:', err);
      throw err;
    }
  }
}

