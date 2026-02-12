import { z } from 'zod'

// Schema pour une ligne de devis (géré séparément avec useState)
export const ligneDevisSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, 'La description est requise'),
  quantite: z.number().min(1, 'La quantité doit être au moins 1'),
  prix_unitaire: z.number().min(0, 'Le prix unitaire doit être positif'),
  taux_tva: z.number().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
  montant_ht: z.number(),
  montant_tva: z.number(),
  montant_ttc: z.number(),
})

export type LigneDevisFormData = z.infer<typeof ligneDevisSchema>

// Schema pour le devis (champs du formulaire seulement, lignes gérées séparément)
export const devisSchema = z.object({
  filiale_id: z.number({ required_error: 'La filiale est requise' }),
  client_id: z.number({ required_error: 'Le client est requis' }),
  numero: z.string().min(1, 'Le numéro est requis').max(50, 'Le numéro est trop long'),
  date_emission: z.string().min(1, 'La date d\'émission est requise'),
  date_validite: z.string().min(1, 'La date de validité est requise'),
  objet: z.string().optional().or(z.literal('')),
  taux_tva: z.number().min(0).max(100).default(20),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'converti']).default('brouillon'),
  notes: z.string().optional().or(z.literal('')),
  conditions: z.string().optional().or(z.literal('')),
})

export type DevisFormData = z.infer<typeof devisSchema>

// Schema pour la création (numero auto-généré)
export const devisCreateSchema = devisSchema.omit({ numero: true })

export type DevisCreateFormData = z.infer<typeof devisCreateSchema>

// Taux de TVA disponibles
export const tauxTVA = [
  { value: 20, label: '20% (Normal)' },
  { value: 10, label: '10% (Intermédiaire)' },
  { value: 5.5, label: '5.5% (Réduit)' },
  { value: 2.1, label: '2.1% (Super réduit)' },
  { value: 0, label: '0% (Exonéré)' },
] as const

// Statuts de devis avec couleurs
export const statutsDevis = [
  { label: 'Brouillon', value: 'brouillon', color: 'gray' },
  { label: 'Envoyé', value: 'envoye', color: 'blue' },
  { label: 'Accepté', value: 'accepte', color: 'green' },
  { label: 'Refusé', value: 'refuse', color: 'red' },
  { label: 'Expiré', value: 'expire', color: 'orange' },
] as const
