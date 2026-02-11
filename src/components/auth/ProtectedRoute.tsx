'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { RoleType, ModuleType, ActionType, ROLE_LEVELS } from '@/lib/auth/permissions'
import { AlertTriangle, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: ReactNode
  // Options de protection
  requiredRole?: RoleType
  requiredModule?: ModuleType
  requiredAction?: ActionType
  // Affichage personnalisé
  fallback?: ReactNode
  showAccessDenied?: boolean
}

/**
 * Composant pour protéger les routes/sections selon les permissions
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredModule,
  requiredAction = 'view',
  fallback,
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const { user, role, roleLevel, loading, hasPermission } = useAuth()

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }

  // Si pas d'utilisateur connecté
  if (!user) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connexion requise
        </h2>
        <p className="text-gray-600 mb-4">
          Vous devez être connecté pour accéder à cette page.
        </p>
        <Link href="/login">
          <Button className="bg-phi-primary hover:bg-phi-primary/90">
            Se connecter
          </Button>
        </Link>
      </div>
    )
  }

  // Vérifier le rôle minimum requis
  if (requiredRole) {
    const requiredLevel = ROLE_LEVELS[requiredRole] || 0
    if (roleLevel < requiredLevel) {
      if (!showAccessDenied) return null
      if (fallback) return <>{fallback}</>

      return <AccessDenied currentRole={role} requiredRole={requiredRole} />
    }
  }

  // Vérifier les permissions sur un module
  if (requiredModule && !hasPermission(requiredModule, requiredAction)) {
    if (!showAccessDenied) return null
    if (fallback) return <>{fallback}</>

    return (
      <AccessDenied
        currentRole={role}
        message={`Vous n'avez pas l'autorisation de ${getActionLabel(requiredAction)} dans le module ${requiredModule}.`}
      />
    )
  }

  return <>{children}</>
}

// Composant pour afficher le message d'accès refusé
function AccessDenied({
  currentRole,
  requiredRole,
  message,
}: {
  currentRole: RoleType | null
  requiredRole?: RoleType
  message?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Accès non autorisé
      </h2>
      <p className="text-gray-600 mb-4 max-w-md">
        {message ||
          `Vous n'avez pas les permissions nécessaires pour accéder à cette page.`}
      </p>
      <div className="flex flex-col gap-2 text-sm text-gray-500">
        <p>
          Votre rôle actuel:{' '}
          <span className="font-medium text-gray-700 capitalize">
            {currentRole?.replace('_', ' ') || 'Non défini'}
          </span>
        </p>
        {requiredRole && (
          <p>
            Rôle minimum requis:{' '}
            <span className="font-medium text-gray-700 capitalize">
              {requiredRole.replace('_', ' ')}
            </span>
          </p>
        )}
      </div>
      <div className="mt-6">
        <Link href="/">
          <Button variant="outline">Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  )
}

// Helper pour obtenir le label d'une action
function getActionLabel(action: ActionType): string {
  const labels: Record<ActionType, string> = {
    view: 'consulter',
    create: 'créer',
    edit: 'modifier',
    delete: 'supprimer',
    approve: 'approuver',
    export: 'exporter',
  }
  return labels[action] || action
}

/**
 * HOC pour protéger un composant entier
 */
export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }
}

/**
 * Composant pour cacher/afficher du contenu selon le rôle
 */
export function RoleGate({
  children,
  allowedRoles,
  fallback = null,
}: {
  children: ReactNode
  allowedRoles: RoleType[]
  fallback?: ReactNode
}) {
  const { role } = useAuth()

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Composant pour afficher du contenu uniquement aux admins
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  return (
    <RoleGate allowedRoles={['super_admin', 'admin']}>{children}</RoleGate>
  )
}

/**
 * Composant pour afficher du contenu aux directeurs et plus
 */
export function DirectorOnly({ children }: { children: ReactNode }) {
  return (
    <RoleGate allowedRoles={['super_admin', 'admin', 'directeur']}>
      {children}
    </RoleGate>
  )
}

/**
 * Composant pour afficher du contenu aux responsables et plus
 */
export function ManagerOnly({ children }: { children: ReactNode }) {
  return (
    <RoleGate
      allowedRoles={['super_admin', 'admin', 'directeur', 'manager', 'responsable']}
    >
      {children}
    </RoleGate>
  )
}
