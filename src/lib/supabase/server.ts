import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { getSupabaseEnv } from '@/lib/env'

type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

/**
 * Client Supabase pour les Server Components et Route Handlers
 * Gère automatiquement les cookies pour la session
 */
export async function createClient() {
  const cookieStore = await cookies()
  const env = getSupabaseEnv()

  return createServerClient<Database>(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Client Supabase avec la clé service (admin)
 * À utiliser uniquement côté serveur pour les opérations admin
 * ATTENTION: Ne jamais exposer côté client !
 */
export async function createAdminClient() {
  const cookieStore = await cookies()
  const env = getSupabaseEnv()

  // Validation obligatoire de la service role key
  if (!env.serviceRoleKey) {
    throw new Error(
      '❌ SUPABASE_SERVICE_ROLE_KEY est requise pour createAdminClient()\n\n' +
      'Cette clé est nécessaire pour les opérations admin côté serveur.\n' +
      'Ajoutez SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env.local\n\n' +
      'IMPORTANT: Cette clé ne doit JAMAIS être exposée côté client !'
    )
  }

  return createServerClient<Database>(
    env.url,
    env.serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
