/**
 * Validation et typage des variables d'environnement
 *
 * Ce fichier centralise toutes les variables d'environnement de l'application
 * et les valide au démarrage pour éviter les erreurs en production.
 */

// ============================================================
// Type pour les variables d'environnement validées
// ============================================================

export type Env = {
  // Supabase - Configuration obligatoire
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string | undefined // Undefined côté client
  }

  // Application
  app: {
    name: string
    version: string
    companyName: string
    url: string
  }

  // Environnement
  isProduction: boolean
  isDevelopment: boolean
  isTest: boolean
}

// ============================================================
// Validation des variables requises
// ============================================================

function validateRequired(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `❌ Variable d'environnement manquante: ${name}\n\n` +
      `Cette variable est requise pour le fonctionnement de l'application.\n` +
      `Vérifiez votre fichier .env.local et assurez-vous que ${name} est défini.\n\n` +
      `Exemple: ${name}=votre_valeur_ici\n\n` +
      `Consultez .env.local.example pour plus d'informations.`
    )
  }
  return value
}

function validateOptional(name: string, value: string | undefined, defaultValue: string): string {
  if (!value || value.trim() === '') {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  Variable d'environnement optionnelle non définie: ${name}. Utilisation de la valeur par défaut: "${defaultValue}"`)
    return defaultValue
  }
  return value
}

function validateUrl(name: string, value: string): string {
  try {
    new URL(value)
    return value
  } catch {
    throw new Error(
      `❌ Variable d'environnement invalide: ${name}\n\n` +
      `La valeur "${value}" n'est pas une URL valide.\n` +
      `Format attendu: https://exemple.com\n`
    )
  }
}

// ============================================================
// Chargement et validation
// ============================================================

function loadEnv(): Env {
  // Variables Supabase - OBLIGATOIRES
  const supabaseUrl = validateRequired(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL
  )

  const supabaseAnonKey = validateRequired(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Service role key - obligatoire côté serveur uniquement
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Validation URL Supabase
  validateUrl('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl)

  // Variables Application - avec valeurs par défaut
  const appName = validateOptional(
    'NEXT_PUBLIC_APP_NAME',
    process.env.NEXT_PUBLIC_APP_NAME,
    'HoldingManager'
  )

  const appVersion = validateOptional(
    'NEXT_PUBLIC_APP_VERSION',
    process.env.NEXT_PUBLIC_APP_VERSION,
    '2.0.0'
  )

  const companyName = validateOptional(
    'NEXT_PUBLIC_COMPANY_NAME',
    process.env.NEXT_PUBLIC_COMPANY_NAME,
    'PHI Studios'
  )

  const appUrl = validateOptional(
    'NEXT_PUBLIC_APP_URL',
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000'
  )

  // Validation URL application si définie
  if (process.env.NEXT_PUBLIC_APP_URL) {
    validateUrl('NEXT_PUBLIC_APP_URL', appUrl)
  }

  // Déterminer l'environnement
  const nodeEnv = process.env.NODE_ENV || 'development'

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
    },
    app: {
      name: appName,
      version: appVersion,
      companyName: companyName,
      url: appUrl,
    },
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
  }
}

// ============================================================
// Export singleton
// ============================================================

let envInstance: Env | null = null

/**
 * Récupère les variables d'environnement validées
 *
 * Lance une erreur claire si une variable requise est manquante.
 * Utilise un singleton pour éviter de valider plusieurs fois.
 *
 * @returns Variables d'environnement typées et validées
 * @throws Error si une variable requise est manquante ou invalide
 *
 * @example
 * ```typescript
 * import { getEnv } from '@/lib/env'
 *
 * const env = getEnv()
 * console.log(env.supabase.url) // https://xxx.supabase.co
 * ```
 */
export function getEnv(): Env {
  if (!envInstance) {
    try {
      envInstance = loadEnv()

      // Log en développement uniquement (sans les secrets)
      if (envInstance.isDevelopment) {
        // eslint-disable-next-line no-console
        console.log('✅ Variables d\'environnement chargées avec succès')
        // eslint-disable-next-line no-console
        console.log(`   - Supabase URL: ${envInstance.supabase.url}`)
        // eslint-disable-next-line no-console
        console.log(`   - App: ${envInstance.app.name} v${envInstance.app.version}`)
        // eslint-disable-next-line no-console
        console.log(`   - Environnement: ${process.env.NODE_ENV}`)
      }
    } catch (error) {
      // En production, ne pas exposer les détails des erreurs
      if (process.env.NODE_ENV === 'production') {
        // eslint-disable-next-line no-console
        console.error('❌ Erreur de configuration de l\'application')
      }
      throw error
    }
  }

  return envInstance
}

// ============================================================
// Helpers pour accès rapide
// ============================================================

/**
 * Récupère les variables Supabase validées
 */
export function getSupabaseEnv() {
  return getEnv().supabase
}

/**
 * Récupère les variables de l'application
 */
export function getAppEnv() {
  return getEnv().app
}

/**
 * Vérifie si on est en production
 */
export function isProduction() {
  return getEnv().isProduction
}

/**
 * Vérifie si on est en développement
 */
export function isDevelopment() {
  return getEnv().isDevelopment
}
