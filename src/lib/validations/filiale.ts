import { z } from 'zod'

export const filialeSchema = z.object({
  code: z.string().min(1, 'Le code est requis').max(50, 'Le code est trop long'),
  nom: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  adresse: z.string().optional().or(z.literal('')),
  ville: z.string().max(100, 'La ville est trop longue').optional().or(z.literal('')),
  code_postal: z.string().max(20, 'Le code postal est trop long').optional().or(z.literal('')),
  pays_id: z.number().optional().nullable(),
  telephone: z.string().max(20, 'Le téléphone est trop long').optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  site_web: z.string().url('URL invalide').optional().or(z.literal('')),
  directeur_nom: z.string().max(200, 'Le nom est trop long').optional().or(z.literal('')),
  directeur_email: z.string().email('Email invalide').optional().or(z.literal('')),
  statut: z.enum(['actif', 'inactif', 'en_creation']).default('en_creation'),
})

export type FilialeFormData = z.infer<typeof filialeSchema>

// Statuts de filiales avec couleurs
export const statutsFiliale = [
  { label: 'En création', value: 'en_creation', color: 'gray' },
  { label: 'Actif', value: 'actif', color: 'green' },
  { label: 'Inactif', value: 'inactif', color: 'red' },
]
