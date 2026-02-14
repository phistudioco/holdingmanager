'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Zap,
  Monitor,
  Users,
  Loader2,
  CheckCircle2,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const services = [
  {
    id: 'robotique',
    name: 'Robotique',
    description: 'Automatisation, robots industriels, systèmes intelligents',
    icon: Zap,
    color: 'border-robotique bg-robotique/5 hover:bg-robotique/10',
    activeColor: 'border-robotique bg-robotique text-white',
    iconColor: 'text-robotique',
  },
  {
    id: 'digital',
    name: 'Digital',
    description: 'Développement logiciel, applications, sites web',
    icon: Monitor,
    color: 'border-digital bg-digital/5 hover:bg-digital/10',
    activeColor: 'border-digital bg-digital text-black',
    iconColor: 'text-digital',
  },
  {
    id: 'outsourcing',
    name: 'Outsourcing',
    description: 'Services externalisés, ressources humaines, support',
    icon: Users,
    color: 'border-phi-primary bg-phi-primary/5 hover:bg-phi-primary/10',
    activeColor: 'border-phi-primary bg-phi-primary text-white',
    iconColor: 'text-phi-primary',
  },
]

const urgences = [
  { id: 'basse', name: 'Basse', description: 'Peut attendre plusieurs semaines' },
  { id: 'normale', name: 'Normale', description: 'Dans les délais standards' },
  { id: 'haute', name: 'Haute', description: 'À traiter en priorité' },
  { id: 'urgente', name: 'Urgente', description: 'Nécessite une action immédiate' },
]

interface UploadedFile {
  name: string
  size: number
  type: string
  file: File
}

export default function NouvelleDemandePagee() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<number | null>(null)

  // Form state
  const [serviceType, setServiceType] = useState(searchParams.get('service') || '')
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [urgence, setUrgence] = useState('normale')
  const [dateSouhaitee, setDateSouhaitee] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])

  useEffect(() => {
    const fetchClient = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portail/login')
        return
      }

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('portail_user_id', user.id)
        .single()

      if (client) {
        setClientId(client.id)
      }
    }

    fetchClient()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = []
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      // Limite à 10 Mo par fichier
      if (file.size > 10 * 1024 * 1024) {
        setError(`Le fichier ${file.name} dépasse la limite de 10 Mo`)
        continue
      }
      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      })
    }

    setFiles([...files, ...newFiles])
    e.target.value = '' // Reset input
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) return

    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Créer la demande
      const { data: demande, error: demandeError } = await supabase
        .from('demandes_clients')
        .insert({
          client_id: clientId,
          service_type: serviceType,
          titre,
          description,
          urgence,
          date_souhaitee: dateSouhaitee || null,
        })
        .select()
        .single()

      if (demandeError) throw demandeError

      // Upload des fichiers si présents
      if (files.length > 0 && demande) {
        for (const uploadedFile of files) {
          const filePath = `demandes/${demande.id}/${Date.now()}_${uploadedFile.name}`

          const { error: uploadError } = await supabase.storage
            .from('demandes-fichiers')
            .upload(filePath, uploadedFile.file)

          if (uploadError) {
            console.error('Erreur upload:', uploadError)
            continue
          }

          // Enregistrer le fichier dans la table
          await supabase.from('demandes_fichiers').insert({
            demande_id: demande.id,
            nom_fichier: uploadedFile.name,
            type_fichier: uploadedFile.type,
            taille: uploadedFile.size,
            url_stockage: filePath,
            uploaded_by_type: 'client',
            uploaded_by_id: clientId,
          })
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/portail/demandes/${demande.id}`)
      }, 2000)
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de la création de la demande')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2">
              Demande envoyée !
            </h2>
            <p className="text-muted-foreground mb-6">
              Votre demande a été soumise avec succès. Notre équipe va l'examiner et vous répondra dans les plus brefs délais.
            </p>
            <div className="animate-pulse text-sm text-muted-foreground">
              Redirection en cours...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <Link
          href="/portail/demandes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux demandes
        </Link>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Nouvelle demande
        </h1>
        <p className="text-muted-foreground">
          Décrivez votre besoin et nous vous répondrons rapidement
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Erreur */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sélection du service */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Type de service</CardTitle>
              <CardDescription>
                Sélectionnez le service concerné par votre demande
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {services.map((service) => {
                  const Icon = service.icon
                  const isSelected = serviceType === service.id
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setServiceType(service.id)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        isSelected ? service.activeColor : service.color
                      )}
                    >
                      <Icon className={cn('h-8 w-8 mb-2', isSelected ? '' : service.iconColor)} />
                      <p className="font-medium">{service.name}</p>
                      <p className={cn('text-xs mt-1', isSelected ? 'opacity-80' : 'text-muted-foreground')}>
                        {service.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Détails de la demande */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Détails de la demande</CardTitle>
              <CardDescription>
                Décrivez votre besoin de manière détaillée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre *</Label>
                <Input
                  id="titre"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Développement d'une application mobile"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre besoin en détail : objectifs, fonctionnalités souhaitées, contraintes..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="urgence">Niveau d'urgence</Label>
                  <Select value={urgence} onValueChange={setUrgence}>
                    <SelectTrigger id="urgence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgences.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div>
                            <span>{u.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              - {u.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date souhaitée</Label>
                  <Input
                    id="date"
                    type="date"
                    value={dateSouhaitee}
                    onChange={(e) => setDateSouhaitee(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pièces jointes */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Pièces jointes</CardTitle>
              <CardDescription>
                Ajoutez des documents pour illustrer votre demande (max 10 Mo par fichier)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label
                  htmlFor="files"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez ou glissez des fichiers ici
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    PDF, images, documents Office
                  </span>
                  <input
                    id="files"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded bg-phi-primary/10 flex items-center justify-center shrink-0">
                            <Upload className="h-4 w-4 text-phi-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} Mo
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/portail/demandes">Annuler</Link>
            </Button>
            <Button
              type="submit"
              className="bg-phi-primary hover:bg-phi-primary/90"
              disabled={loading || !serviceType || !titre || !description}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Soumettre la demande'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
