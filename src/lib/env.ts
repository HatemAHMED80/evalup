/**
 * Validation des variables d'environnement au démarrage
 * Échoue rapidement si des variables critiques manquent
 */

interface EnvVar {
  key: string
  required: boolean
  serverOnly?: boolean
}

const ENV_VARS: EnvVar[] = [
  // Obligatoires
  { key: 'ANTHROPIC_API_KEY', required: true, serverOnly: true },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', required: true, serverOnly: true },
  { key: 'STRIPE_SECRET_KEY', required: true, serverOnly: true },
  { key: 'STRIPE_WEBHOOK_SECRET', required: true, serverOnly: true },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true },
  { key: 'NEXT_PUBLIC_APP_URL', required: true },
  // Optionnelles mais recommandées
  { key: 'PAPPERS_API_KEY', required: false, serverOnly: true },
  { key: 'UPSTASH_REDIS_REST_URL', required: false, serverOnly: true },
  { key: 'UPSTASH_REDIS_REST_TOKEN', required: false, serverOnly: true },
]

export function validateEnv(): void {
  const missing: string[] = []
  const warnings: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key]

    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(envVar.key)
      } else {
        warnings.push(envVar.key)
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[Env] Variables optionnelles manquantes: ${warnings.join(', ')}`
    )
  }

  if (missing.length > 0) {
    throw new Error(
      `[Env] Variables d'environnement obligatoires manquantes:\n` +
      missing.map(k => `  - ${k}`).join('\n') +
      `\n\nCopiez .env.example vers .env.local et remplissez les valeurs.`
    )
  }
}

/**
 * Récupère une variable d'environnement serveur avec vérification
 */
export function getServerEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`)
  }
  return value
}
