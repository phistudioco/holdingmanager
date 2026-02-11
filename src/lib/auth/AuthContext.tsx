'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useUser, UseUserReturn } from './useUser'

// Créer le contexte
const AuthContext = createContext<UseUserReturn | undefined>(undefined)

// Props du provider
interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provider d'authentification pour l'application
 * Fournit les informations utilisateur et permissions à toute l'app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useUser()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook pour accéder au contexte d'authentification
 */
export function useAuth(): UseUserReturn {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }

  return context
}

/**
 * HOC pour protéger les composants selon les permissions
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    requiredRole?: string
    redirectTo?: string
  }
) {
  return function WithAuthComponent(props: P) {
    const { user, loading, role, roleLevel } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary" />
        </div>
      )
    }

    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = options?.redirectTo || '/login'
      }
      return null
    }

    if (options?.requiredRole) {
      const ROLE_LEVELS: Record<string, number> = {
        super_admin: 100,
        admin: 80,
        directeur: 60,
        manager: 40,
        responsable: 40,
        employe: 20,
      }
      const requiredLevel = ROLE_LEVELS[options.requiredRole] || 0

      if (roleLevel < requiredLevel) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
            <p className="text-gray-600">
              Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Rôle actuel: <span className="font-medium">{role || 'Non défini'}</span>
            </p>
          </div>
        )
      }
    }

    return <WrappedComponent {...props} />
  }
}
