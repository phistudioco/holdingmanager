import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Custom render function with providers if needed
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { ...options }),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render with custom render
export { customRender as render }

// Helper to create mock Supabase response
export function mockSupabaseResponse<T>(data: T, error: null): { data: T; error: null }
export function mockSupabaseResponse<T>(data: null, error: { message: string; code: string }): { data: null; error: { message: string; code: string } }
export function mockSupabaseResponse<T>(data: T | null, error: { message: string; code: string } | null) {
  return { data, error }
}

// Helper to wait for async operations
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data generators
export const mockFiliale = (overrides = {}) => ({
  id: 1,
  code: 'PHI-FR-001',
  nom: 'PHI Studios France',
  adresse: '123 Rue Test',
  ville: 'Paris',
  code_postal: '75001',
  pays_id: 1,
  telephone: '+33 1 23 45 67 89',
  email: 'contact@phistudios.fr',
  site_web: 'https://phistudios.fr',
  directeur_nom: 'Jean Dupont',
  directeur_email: 'jean.dupont@phistudios.fr',
  statut: 'actif' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const mockClient = (overrides = {}) => ({
  id: 1,
  code: 'CLI-001',
  nom: 'Client Test',
  type: 'entreprise' as const,
  email: 'client@test.com',
  telephone: '+33 1 23 45 67 89',
  adresse: '456 Avenue Test',
  ville: 'Lyon',
  code_postal: '69001',
  pays: 'France',
  siret: '12345678901234',
  tva_intracommunautaire: 'FR12345678901',
  forme_juridique: 'SAS',
  statut: 'actif' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const mockFacture = (overrides = {}) => ({
  id: 1,
  numero: 'FAC-2026-001',
  client_id: 1,
  filiale_id: 1,
  date_emission: new Date().toISOString().split('T')[0],
  date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  total_ht: 1000,
  total_tva: 200,
  total_ttc: 1200,
  statut: 'brouillon' as const,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const mockEmploye = (overrides = {}) => ({
  id: 1,
  matricule: 'EMP-001',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@phistudios.com',
  telephone: '+33 6 12 34 56 78',
  poste: 'Développeur',
  departement: 'IT',
  filiale_id: 1,
  date_embauche: '2024-01-15',
  statut: 'actif' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const mockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'user@test.com',
  role: 'user',
  created_at: new Date().toISOString(),
  ...overrides,
})
