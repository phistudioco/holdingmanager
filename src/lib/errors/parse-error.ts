/**
 * Helper de gestion d'erreurs pour les opérations Supabase
 * Détecte et catégorise les erreurs RLS, métier et techniques
 */

import { PostgrestError } from '@supabase/supabase-js'

export type FormErrorType = 'validation' | 'rls' | 'business' | 'technical' | 'network'

export interface FormError {
  type: FormErrorType
  message: string
  details?: string
  code?: string
  userFriendly: boolean // Si true, peut être affiché tel quel à l'utilisateur
}

/**
 * Parse une erreur PostgreSQL/Supabase et retourne un objet FormError structuré
 */
export function parseSupabaseError(error: PostgrestError | Error | unknown): FormError {
  // Si pas d'erreur
  if (!error) {
    return {
      type: 'technical',
      message: 'Une erreur inconnue est survenue',
      userFriendly: false,
    }
  }

  // Erreur PostgreSQL (Supabase)
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const pgError = error as PostgrestError

    // 🔒 ERREURS RLS (Row Level Security)
    if (
      pgError.code === '42501' || // Violation de politique RLS
      pgError.message?.toLowerCase().includes('policy') ||
      pgError.message?.toLowerCase().includes('row-level security')
    ) {
      return {
        type: 'rls',
        message: 'Accès refusé par les politiques de sécurité',
        details: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action sur cette filiale.',
        code: pgError.code,
        userFriendly: true,
      }
    }

    // 📋 ERREURS MÉTIER

    // Doublon / Contrainte d'unicité
    if (
      pgError.code === '23505' ||
      pgError.message?.toLowerCase().includes('unique') ||
      pgError.message?.toLowerCase().includes('duplicate')
    ) {
      // Extraire le champ en cause si possible
      const fieldMatch = pgError.message?.match(/Key \((\w+)\)/)
      const field = fieldMatch ? fieldMatch[1] : ''

      return {
        type: 'business',
        message: field
          ? `Cette valeur pour "${field}" existe déjà`
          : 'Cette valeur existe déjà',
        details: 'Veuillez utiliser une valeur différente.',
        code: pgError.code,
        userFriendly: true,
      }
    }

    // Contrainte de clé étrangère
    if (pgError.code === '23503') {
      return {
        type: 'business',
        message: 'Opération impossible : données liées',
        details: 'Cet enregistrement est lié à d\'autres données et ne peut pas être modifié ou supprimé.',
        code: pgError.code,
        userFriendly: true,
      }
    }

    // Contrainte NOT NULL
    if (pgError.code === '23502') {
      const fieldMatch = pgError.message?.match(/column "(\w+)"/)
      const field = fieldMatch ? fieldMatch[1] : 'un champ requis'

      return {
        type: 'validation',
        message: `Le champ "${field}" est requis`,
        details: 'Veuillez remplir tous les champs obligatoires.',
        code: pgError.code,
        userFriendly: true,
      }
    }

    // 🔍 ERREURS SUPABASE (pas de données retournées)
    if (pgError.code === 'PGRST116') {
      return {
        type: 'rls',
        message: 'Ressource introuvable ou accès refusé',
        details: 'La ressource demandée n\'existe pas ou vous n\'avez pas accès à la filiale concernée.',
        code: pgError.code,
        userFriendly: true,
      }
    }

    // ⚠️ ERREUR TECHNIQUE PostgreSQL générique
    return {
      type: 'technical',
      message: 'Erreur de base de données',
      details: pgError.message || 'Une erreur technique est survenue',
      code: pgError.code,
      userFriendly: false,
    }
  }

  // Erreur JavaScript standard
  if (error instanceof Error) {
    // Erreur réseau
    if (
      error.message?.toLowerCase().includes('fetch') ||
      error.message?.toLowerCase().includes('network')
    ) {
      return {
        type: 'network',
        message: 'Erreur de connexion',
        details: 'Vérifiez votre connexion internet et réessayez.',
        userFriendly: true,
      }
    }

    return {
      type: 'technical',
      message: error.message || 'Une erreur est survenue',
      userFriendly: false,
    }
  }

  // Erreur inconnue
  return {
    type: 'technical',
    message: 'Une erreur inattendue est survenue',
    details: String(error),
    userFriendly: false,
  }
}

/**
 * Parse une réponse d'API route (fetch)
 */
export async function parseApiError(response: Response): Promise<FormError> {
  try {
    const result = await response.json()

    // Erreur RLS (403)
    if (response.status === 403) {
      return {
        type: 'rls',
        message: result.error || 'Accès refusé',
        details: result.message || 'Vous n\'avez pas les droits nécessaires pour cette action.',
        userFriendly: true,
      }
    }

    // Ressource introuvable (404)
    if (response.status === 404) {
      return {
        type: 'rls', // Peut être RLS ou vraiment introuvable
        message: result.error || 'Ressource introuvable',
        details: result.message || 'La ressource demandée n\'existe pas ou vous n\'y avez pas accès.',
        userFriendly: true,
      }
    }

    // Validation / Bad Request (400)
    if (response.status === 400) {
      return {
        type: 'validation',
        message: result.error || 'Données invalides',
        details: result.message || 'Veuillez vérifier les informations saisies.',
        userFriendly: true,
      }
    }

    // Erreur serveur (500+)
    if (response.status >= 500) {
      return {
        type: 'technical',
        message: 'Erreur du serveur',
        details: result.message || 'Une erreur technique est survenue. Veuillez réessayer.',
        userFriendly: true,
      }
    }

    // Autre erreur
    return {
      type: 'technical',
      message: result.error || 'Une erreur est survenue',
      details: result.message,
      userFriendly: false,
    }
  } catch {
    // Impossible de parser la réponse
    return {
      type: 'technical',
      message: 'Erreur de communication',
      details: `Code HTTP: ${response.status}`,
      userFriendly: false,
    }
  }
}

/**
 * Formatte une FormError pour l'affichage utilisateur
 */
export function formatErrorForDisplay(error: FormError | null): string {
  if (!error) return ''

  if (error.userFriendly) {
    return error.details ? `${error.message}\n${error.details}` : error.message
  }

  // Erreur technique : message générique pour l'utilisateur
  return 'Une erreur technique est survenue. Veuillez contacter l\'assistance si le problème persiste.'
}
