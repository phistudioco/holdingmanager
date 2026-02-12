import { z } from 'zod'

export const employeSchema = z.object({
  filiale_id: z.number({ required_error: 'La filiale est requise' }),
  service_id: z.number().optional().nullable(),
  matricule: z.string().min(1, 'Le matricule est requis').max(50, 'Le matricule est trop long'),
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  prenom: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().max(20, 'Le téléphone est trop long').optional().or(z.literal('')),
  date_naissance: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  poste: z.string().max(100, 'Le poste est trop long').optional().or(z.literal('')),
  date_embauche: z.string().min(1, 'La date d\'embauche est requise'),
  salaire: z.number().min(0, 'Le salaire doit être positif').optional().nullable(),
  statut: z.enum(['actif', 'en_conge', 'suspendu', 'sorti']).default('actif'),
  photo: z.string().nullable().optional(),
})

export type EmployeFormData = z.infer<typeof employeSchema>

// Statuts des employés avec couleurs
export const statutsEmploye = [
  { label: 'Actif', value: 'actif', color: 'green' },
  { label: 'En congé', value: 'en_conge', color: 'blue' },
  { label: 'Suspendu', value: 'suspendu', color: 'orange' },
  { label: 'Sorti', value: 'sorti', color: 'gray' },
]
