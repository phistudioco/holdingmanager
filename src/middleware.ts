import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware Next.js pour gérer l'authentification Supabase
 * et protéger les routes du dashboard
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Configuration du matcher pour le middleware
 * Exclut les assets statiques et les API routes internes de Next.js
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - images, svg, fichiers publics
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
