'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { RoleType, hasPermission, canAccessRoute, getRoleLevel, ModuleType, ActionType } from './permissions'

// Type pour le profil utilisateur avec rôle
export interface UserProfile {
  id: string
  nom: string
  prenom: string
  email: string
  avatar: string | null
  telephone: string | null
  statut: 'actif' | 'inactif' | 'suspendu'
  role_id: number | null
  role: {
    id: number
    nom: RoleType
    description: string | null
    niveau: number
  } | null
  filiales?: {
    id: number
    nom: string
    code: string
  }[]
  derniere_connexion: string | null
}

export interface UseUserReturn {
  // Données utilisateur
  user: User | null
  profile: UserProfile | null
  role: RoleType | null
  roleLevel: number

  // États
  loading: boolean
  error: string | null

  // Méthodes de permission
  hasPermission: (module: ModuleType, action: ActionType) => boolean
  canAccessRoute: (path: string) => boolean
  isAtLeast: (role: RoleType) => boolean

  // Actions
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

/**
 * Hook pour gérer l'utilisateur connecté et ses permissions
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Récupérer le profil utilisateur depuis la base de données
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          nom,
          prenom,
          email,
          avatar,
          telephone,
          statut,
          role_id,
          derniere_connexion,
          role:roles (
            id,
            nom,
            description,
            niveau
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erreur récupération profil:', error)
        // Si le profil n'existe pas encore, on retourne un profil basique
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data as unknown as UserProfile
    } catch (err) {
      console.error('Erreur fetchProfile:', err)
      return null
    }
  }, [supabase])

  // Charger les données utilisateur
  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      setUser(user)

      if (user) {
        const userProfile = await fetchProfile(user.id)
        setProfile(userProfile)

        // Mettre à jour la dernière connexion
        if (userProfile) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('users')
            .update({ derniere_connexion: new Date().toISOString() })
            .eq('id', user.id)
        }
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Erreur chargement utilisateur:', err)
      setError('Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }, [supabase, fetchProfile])

  // Rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
    }
  }, [user, fetchProfile])

  // Déconnexion
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [supabase])

  // Écouter les changements d'authentification
  useEffect(() => {
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUser, supabase, fetchProfile])

  // Extraire le rôle
  const role = profile?.role?.nom as RoleType | null
  const roleLevel = getRoleLevel(role || undefined)

  // Méthodes de permission
  const checkPermission = useCallback(
    (module: ModuleType, action: ActionType) => {
      return hasPermission(role || undefined, module, action)
    },
    [role]
  )

  const checkRouteAccess = useCallback(
    (path: string) => {
      return canAccessRoute(role || undefined, path)
    },
    [role]
  )

  const isAtLeast = useCallback(
    (requiredRole: RoleType) => {
      return roleLevel >= getRoleLevel(requiredRole)
    },
    [roleLevel]
  )

  return {
    user,
    profile,
    role,
    roleLevel,
    loading,
    error,
    hasPermission: checkPermission,
    canAccessRoute: checkRouteAccess,
    isAtLeast,
    signOut,
    refreshProfile,
  }
}
