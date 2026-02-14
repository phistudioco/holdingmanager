import { useState, useEffect } from 'react'

/**
 * Hook de debounce pour optimiser les performances lors de la frappe
 * Retarde la mise à jour de la valeur jusqu'à ce que l'utilisateur arrête de taper
 *
 * @param value - La valeur à debouncer (ex: valeur d'un input)
 * @param delay - Délai en millisecondes (défaut: 300ms)
 * @returns La valeur debouncée
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => {
 *   // Cette fonction ne sera appelée que 300ms après la dernière frappe
 *   fetchData(debouncedSearch)
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Créer un timer qui mettra à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Nettoyer le timer si la valeur change avant la fin du délai
    // Cela évite les mises à jour inutiles pendant la frappe
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
