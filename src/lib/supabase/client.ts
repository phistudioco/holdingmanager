import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Client Supabase pour les composants client (navigateur)
 * Utilise les cookies du navigateur pour la session
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Client Supabase sans typage strict pour les nouvelles tables
 * À utiliser pour les tables du portail client en attendant
 * la régénération complète des types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createUntypedClient(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
