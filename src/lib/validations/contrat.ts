import { z } from 'zod'

export const contratSchema = z.object({
  filiale_id: z.number({ required_error: 'La filiale est requise' }),
  client_id: z.number({ required_error: 'Le client est requis' }),
  numero: z.string().min(1, 'Le numéro est requis').max(50, 'Le numéro est trop long'),
  titre: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  type: z.enum(['service', 'maintenance', 'licence', 'location', 'autre']).default('service'),
  date_debut: z.string().min(1, 'La date de début est requise'),
  date_fin: z.string().optional().or(z.literal('')),
  montant: z.number().min(0, 'Le montant doit être positif'),
  periodicite: z.enum(['mensuel', 'trimestriel', 'semestriel', 'annuel', 'ponctuel']).default('mensuel'),
  reconduction_auto: z.boolean().default(false),
  statut: z.enum(['brouillon', 'actif', 'suspendu', 'termine', 'resilie']).default('brouillon'),
  description: z.string().optional().or(z.literal('')),
})

export type ContratFormData = z.infer<typeof contratSchema>

// Schéma pour la création (génère le numéro automatiquement)
export const contratCreateSchema = contratSchema.omit({ numero: true })

// Types de contrats
export const typesContrat = [
  { label: 'Service', value: 'service' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Licence', value: 'licence' },
  { label: 'Location', value: 'location' },
  { label: 'Autre', value: 'autre' },
] as const

// Périodicités
export const periodicitesContrat = [
  { label: 'Mensuel', value: 'mensuel' },
  { label: 'Trimestriel', value: 'trimestriel' },
  { label: 'Semestriel', value: 'semestriel' },
  { label: 'Annuel', value: 'annuel' },
  { label: 'Ponctuel', value: 'ponctuel' },
] as const

// Statuts de contrats avec couleurs
export const statutsContrat = [
  { label: 'Brouillon', value: 'brouillon', color: 'gray' },
  { label: 'Actif', value: 'actif', color: 'green' },
  { label: 'Suspendu', value: 'suspendu', color: 'orange' },
  { label: 'Terminé', value: 'termine', color: 'blue' },
  { label: 'Résilié', value: 'resilie', color: 'red' },
] as const
