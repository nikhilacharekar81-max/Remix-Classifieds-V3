export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureDatabaseSeeded } = await import('@/server/seed-postgres');
    try {
      await ensureDatabaseSeeded();
    } catch (err) {
      console.error('[Instrumentation] Startup database initialization failed:', err);
    }
  }
}
