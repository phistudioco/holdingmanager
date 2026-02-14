import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { getSupabaseEnv } from '@/lib/env'

/**
 * Client Supabase pour les composants client (navigateur)
 * Utilise les cookies du navigateur pour la session
 */
export function createClient() {
  const env = getSupabaseEnv()
  return createBrowserClient<Database>(
    env.url,
    env.anonKey
  )
}

/**
 * Singleton pour éviter de créer plusieurs instances
 */
let browserClient: ReturnType<typeof createClient> | null = null

export function getClient() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
