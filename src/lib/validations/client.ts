import { z } from 'zod'

export const clientSchema = z.object({
  filiale_id: z.number({ required_error: 'La filiale est requise' }),
  type: z.enum(['entreprise', 'particulier'], {
    required_error: 'Le type de client est requis',
  }),
  code: z.string().min(1, 'Le code est requis'),
  nom: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  ville: z.string().optional().or(z.literal('')),
  code_postal: z.string().optional().or(z.literal('')),
  pays_id: z.number().optional().nullable(),
  siret: z
    .string()
    .regex(/^[0-9]{14}$/, 'Le SIRET doit contenir 14 chiffres')
    .optional()
    .or(z.literal('')),
  tva_intracommunautaire: z
    .string()
    .regex(/^FR[0-9]{11}$/, 'Format TVA invalide (ex: FR12345678901)')
    .optional()
    .or(z.literal('')),
  forme_juridique: z.string().optional().or(z.literal('')),
  delai_paiement: z.number().min(0).max(365).default(30),
  mode_reglement_prefere: z.string().optional().or(z.literal('')),
  limite_credit: z.number().min(0).optional().nullable(),
  statut: z.enum(['prospect', 'actif', 'inactif', 'suspendu']).default('prospect'),
  notes: z.string().optional().or(z.literal('')),
})

export type ClientFormData = z.infer<typeof clientSchema>

// Schéma pour la création (génère le code automatiquement)
export const clientCreateSchema = clientSchema.omit({ code: true })

// Formes juridiques françaises courantes
export const formesJuridiques = [
  'SA',
  'SAS',
  'SASU',
  'SARL',
  'EURL',
  'SCI',
  'SNC',
  'Auto-entrepreneur',
  'EI',
  'EIRL',
  'Association',
  'Autre',
]

// Modes de règlement
export const modesReglement = [
  'Virement bancaire',
  'Chèque',
  'Carte bancaire',
  'Prélèvement',
  'Espèces',
  'Lettre de change',
]
