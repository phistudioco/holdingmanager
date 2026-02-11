import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

/**
 * Met à jour la session Supabase dans le middleware
 * Permet de rafraîchir les tokens et maintenir la session
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Éviter d'écrire de la logique entre createServerClient et
  // supabase.auth.getUser(). Une simple erreur pourrait rendre difficile
  // le débogage des problèmes de session.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Routes protégées - Rediriger vers login si non authentifié
  const protectedRoutes = ['/filiales', '/employes', '/finance', '/services', '/workflows', '/admin']
  const isProtectedRoute =
    request.nextUrl.pathname === '/' ||
    protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Si l'utilisateur est connecté et essaie d'accéder à /login ou /register
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Vous *devez* retourner l'objet supabaseResponse tel quel.
  // Si vous créez un nouvel objet response avec NextResponse.next(),
  // assurez-vous de:
  // 1. Passer la request: NextResponse.next({ request })
  // 2. Copier les cookies: supabaseResponse.cookies.getAll().forEach(...)
  // 3. Modifier l'objet NextResponse selon vos besoins, mais ne pas remplacer
  //    les cookies !

  return supabaseResponse
}
