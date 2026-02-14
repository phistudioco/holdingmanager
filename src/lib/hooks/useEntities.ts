'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Types communs simplifiés (pour usage de base)
export type Filiale = {
  id: number
  nom: string
  code: string
  statut?: string
}

export type Client = {
  id: number
  nom: string
  code: string
  statut?: string
}

export type Service = {
  id: number
  nom: string
  code: string
}

export type Fournisseur = {
  id: number
  nom: string
  statut?: string
}

type EntityHookReturn<T = any> = {
  data: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook pour récupérer les filiales actives
 * @param options Options de configuration
 * @param options.fields Champs à sélectionner (par défaut: '*')
 * @param options.autoFetch Fetch automatique au montage (par défaut: true)
 */
export function useFiliales<T = Filiale>(options?: {
  fields?: string
  autoFetch?: boolean
}): EntityHookReturn<T> {
  const { fields = '*', autoFetch = true } = options || {}
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiliales = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: result, error: fetchError } = await supabase
        .from('filiales')
        .select(fields)
        .eq('statut', 'actif')
        .order('nom')

      if (fetchError) throw fetchError

      setData((result || []) as T[])
    } catch (err) {
      console.error('Erreur lors de la récupération des filiales:', err)
      setError('Erreur lors du chargement des filiales')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fields])

  useEffect(() => {
    if (autoFetch) {
      fetchFiliales()
    }
  }, [autoFetch, fetchFiliales])

  return {
    data,
    loading,
    error,
    refresh: fetchFiliales,
  }
}

/**
 * Hook pour récupérer les clients actifs et prospects
 * @param options Options de configuration
 * @param options.fields Champs à sélectionner (par défaut: '*')
 * @param options.statuts Statuts à inclure (par défaut: ['actif', 'prospect'])
 * @param options.autoFetch Fetch automatique au montage (par défaut: true)
 */
export function useClients<T = Client>(options?: {
  fields?: string
  statuts?: string[]
  autoFetch?: boolean
}): EntityHookReturn<T> {
  const {
    fields = '*',
    statuts = ['actif', 'prospect'],
    autoFetch = true,
  } = options || {}
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: result, error: fetchError } = await supabase
        .from('clients')
        .select(fields)
        .in('statut', statuts)
        .order('nom')

      if (fetchError) throw fetchError

      setData((result || []) as T[])
    } catch (err) {
      console.error('Erreur lors de la récupération des clients:', err)
      setError('Erreur lors du chargement des clients')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fields, statuts])

  useEffect(() => {
    if (autoFetch) {
      fetchClients()
    }
  }, [autoFetch, fetchClients])

  return {
    data,
    loading,
    error,
    refresh: fetchClients,
  }
}

/**
 * Hook pour récupérer les services
 * @param options Options de configuration
 * @param options.fields Champs à sélectionner (par défaut: '*')
 * @param options.autoFetch Fetch automatique au montage (par défaut: true)
 */
export function useServices<T = Service>(options?: {
  fields?: string
  autoFetch?: boolean
}): EntityHookReturn<T> {
  const { fields = '*', autoFetch = true } = options || {}
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: result, error: fetchError } = await supabase
        .from('services')
        .select(fields)
        .order('nom')

      if (fetchError) throw fetchError

      setData((result || []) as T[])
    } catch (err) {
      console.error('Erreur lors de la récupération des services:', err)
      setError('Erreur lors du chargement des services')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fields])

  useEffect(() => {
    if (autoFetch) {
      fetchServices()
    }
  }, [autoFetch, fetchServices])

  return {
    data,
    loading,
    error,
    refresh: fetchServices,
  }
}

/**
 * Hook pour récupérer les fournisseurs actifs et en évaluation
 * @param options Options de configuration
 * @param options.fields Champs à sélectionner (par défaut: '*')
 * @param options.statuts Statuts à inclure (par défaut: ['actif', 'en_evaluation'])
 * @param options.autoFetch Fetch automatique au montage (par défaut: true)
 */
export function useFournisseurs<T = Fournisseur>(options?: {
  fields?: string
  statuts?: string[]
  autoFetch?: boolean
}): EntityHookReturn<T> {
  const {
    fields = '*',
    statuts = ['actif', 'en_evaluation'],
    autoFetch = true,
  } = options || {}
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFournisseurs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: result, error: fetchError } = await supabase
        .from('fournisseurs')
        .select(fields)
        .in('statut', statuts)
        .order('nom')

      if (fetchError) throw fetchError

      setData((result || []) as T[])
    } catch (err) {
      console.error('Erreur lors de la récupération des fournisseurs:', err)
      setError('Erreur lors du chargement des fournisseurs')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fields, statuts])

  useEffect(() => {
    if (autoFetch) {
      fetchFournisseurs()
    }
  }, [autoFetch, fetchFournisseurs])

  return {
    data,
    loading,
    error,
    refresh: fetchFournisseurs,
  }
}
