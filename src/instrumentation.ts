/**
 * Next.js Instrumentation - exécuté au démarrage du serveur
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { validateEnv } = await import('@/lib/env')
      validateEnv()
    } catch (err) {
      // Ne pas crasher le serveur entier — les routes qui n'ont pas besoin
      // de ces variables continueront de fonctionner
      console.error('[Instrumentation]', err instanceof Error ? err.message : err)
    }
  }
}
