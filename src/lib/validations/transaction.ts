import { z } from 'zod'

export const transactionSchema = z.object({
  filiale_id: z.number({ required_error: 'La filiale est requise' }),
  type: z.enum(['revenu', 'depense']).default('revenu'),
  categorie: z.string().min(1, 'La catégorie est requise'),
  montant: z.number({ required_error: 'Le montant est requis' }).positive('Le montant doit être supérieur à 0'),
  date_transaction: z.string().min(1, 'La date de transaction est requise'),
  description: z.string().optional().or(z.literal('')),
  reference: z.string().optional().or(z.literal('')),
  client_id: z.number().optional().nullable(),
  statut: z.enum(['en_attente', 'validee', 'annulee']).default('en_attente'),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

// Catégories de revenus
export const categoriesRevenu = [
  { label: 'Facturation', value: 'facturation' },
  { label: 'Prestation', value: 'prestation' },
  { label: 'Vente', value: 'vente' },
  { label: 'Subvention', value: 'subvention' },
  { label: 'Autre revenu', value: 'autre_revenu' },
] as const

// Catégories de dépenses
export const categoriesDepense = [
  { label: 'Salaires', value: 'salaires' },
  { label: 'Loyer', value: 'loyer' },
  { label: 'Fournitures', value: 'fournitures' },
  { label: 'Équipements', value: 'equipements' },
  { label: 'Services', value: 'services' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Déplacements', value: 'deplacements' },
  { label: 'Autre dépense', value: 'autre_depense' },
] as const

// Statuts de transaction avec couleurs
export const statutsTransaction = [
  { label: 'En attente', value: 'en_attente', color: 'yellow' },
  { label: 'Validée', value: 'validee', color: 'green' },
  { label: 'Annulée', value: 'annulee', color: 'red' },
] as const
