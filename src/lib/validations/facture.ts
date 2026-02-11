import { z } from 'zod'

export const factureLigneSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, 'La description est requise'),
  quantite: z.number().int('La quantité doit être un nombre entier').min(1, 'La quantité doit être au moins 1'),
  prix_unitaire: z.number().min(0, 'Le prix doit être positif'),
  taux_tva: z.number().min(0).max(100).default(20),
  ordre: z.number().default(0),
})

export const factureSchema = z.object({
  filiale_id: z.number({ required_error: 'La filiale est requise' }),
  client_id: z.number({ required_error: 'Le client est requis' }),
  contrat_id: z.number().optional().nullable(),
  numero: z.string().min(1, 'Le numéro est requis'),
  type: z.enum(['facture', 'avoir', 'acompte', 'proforma']).default('facture'),
  date_emission: z.string().min(1, 'La date d\'émission est requise'),
  date_echeance: z.string().min(1, 'La date d\'échéance est requise'),
  objet: z.string().optional().or(z.literal('')),
  taux_tva: z.number().min(0).max(100).default(20),
  statut: z
    .enum(['brouillon', 'envoyee', 'partiellement_payee', 'payee', 'annulee'])
    .default('brouillon'),
  notes: z.string().optional().or(z.literal('')),
  lignes: z.array(factureLigneSchema).min(1, 'Au moins une ligne est requise'),
})

export type FactureFormData = z.infer<typeof factureSchema>
export type FactureLigneFormData = z.infer<typeof factureLigneSchema>

// Schéma pour la création (génère le numéro automatiquement)
export const factureCreateSchema = factureSchema.omit({ numero: true })

// Taux de TVA courants
export const tauxTVA = [
  { label: '20% - France (Normal)', value: 20 },
  { label: '18% - Côte d\'Ivoire', value: 18 },
  { label: '10% - France (Intermédiaire)', value: 10 },
  { label: '5.5% - France (Réduit)', value: 5.5 },
  { label: '2.1% - France (Super réduit)', value: 2.1 },
  { label: '0% (Exonéré)', value: 0 },
]

// Types de factures
export const typesFacture = [
  { label: 'Facture', value: 'facture' },
  { label: 'Avoir', value: 'avoir' },
  { label: 'Acompte', value: 'acompte' },
  { label: 'Proforma', value: 'proforma' },
]

// Statuts de factures avec couleurs
export const statutsFacture = [
  { label: 'Brouillon', value: 'brouillon', color: 'gray' },
  { label: 'Envoyée', value: 'envoyee', color: 'blue' },
  { label: 'Partiellement payée', value: 'partiellement_payee', color: 'yellow' },
  { label: 'Payée', value: 'payee', color: 'green' },
  { label: 'Annulée', value: 'annulee', color: 'red' },
]
